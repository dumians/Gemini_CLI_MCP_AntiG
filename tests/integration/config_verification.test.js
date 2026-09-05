import test from "node:test";
import assert from "node:assert";
import jwt from "../../server/node_modules/jsonwebtoken/index.js";
import { 
  verifyStartupConfigAccess, 
  getOrRunStartupReport,
  CheckStatus, 
  OverallStatus 
} from "../../agent/utils/config_verifier.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-mesh-os";
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

test("Config Verifier: direct execution returns valid diagnostic report", async () => {
  const report = await verifyStartupConfigAccess({ logToConsole: false });

  assert.ok(report, "Report should be defined");
  assert.ok(typeof report.timestamp === "string", "Report must contain timestamp");
  assert.ok(
    [OverallStatus.HEALTHY, OverallStatus.DEGRADED, OverallStatus.FAILED].includes(report.overallStatus),
    `Invalid overallStatus: ${report.overallStatus}`
  );
  assert.ok(report.summary, "Report must contain summary");
  assert.strictEqual(typeof report.summary.totalChecks, "number");
  assert.strictEqual(typeof report.summary.passed, "number");
  assert.strictEqual(typeof report.summary.warnings, "number");
  assert.strictEqual(typeof report.summary.failed, "number");
  assert.strictEqual(typeof report.summary.durationMs, "number");
  assert.ok(Array.isArray(report.checks), "checks must be an array");
  assert.strictEqual(report.summary.totalChecks, report.checks.length);

  // Verify categories
  const categories = new Set(report.checks.map(c => c.category));
  assert.ok(categories.has("Filesystem & Storage"), "Must include Filesystem & Storage checks");
  assert.ok(categories.has("Environment & Security"), "Must include Environment & Security checks");
  assert.ok(categories.has("Cloud & AI Services"), "Must include Cloud & AI Services checks");
  assert.ok(categories.has("MCP Gateway & Data Transports"), "Must include MCP Gateway checks");

  // Verify individual check schema
  for (const check of report.checks) {
    assert.ok(check.id, "Check must have id");
    assert.ok(check.name, "Check must have name");
    assert.ok(check.category, "Check must have category");
    assert.ok(
      [CheckStatus.PASSED, CheckStatus.WARNING, CheckStatus.FAILED].includes(check.status),
      `Invalid check status: ${check.status} on ${check.id}`
    );
    assert.ok(typeof check.message === "string", "Check must have message");
    assert.ok(typeof check.durationMs === "number", "Check must have durationMs");
  }

  // Check 1.1 Config Directory Access must pass in standard repo layout
  const configDirCheck = report.checks.find(c => c.id === "config_dir_permissions");
  assert.ok(configDirCheck, "Config directory check must exist");
  assert.strictEqual(configDirCheck.status, CheckStatus.PASSED);
});

test("Config Verifier: getOrRunStartupReport caches and refreshes correctly", async () => {
  const first = await getOrRunStartupReport(false);
  assert.ok(first, "First report should be generated/cached");

  const second = await getOrRunStartupReport(false);
  assert.strictEqual(first.timestamp, second.timestamp, "Cached report should preserve timestamp without force refresh");

  const refreshed = await getOrRunStartupReport(true);
  assert.ok(refreshed, "Refreshed report should exist");
  assert.ok(refreshed.checks.length > 0);
});

test("API Server: Startup Configuration Access endpoints integration", async () => {
  const { app } = await import("../../server/server.js");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. GET /health includes configStatus
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, "ok");
    assert.ok(
      ["HEALTHY", "DEGRADED", "FAILED", "UNKNOWN"].includes(healthData.configStatus),
      `Unexpected configStatus in /health: ${healthData.configStatus}`
    );

    // 2. GET /api/health/config-access (Public pre-flight)
    const preflightRes = await fetch(`${baseUrl}/api/health/config-access`);
    assert.ok([200, 503].includes(preflightRes.status), `Pre-flight status code should be 200 or 503, got: ${preflightRes.status}`);
    const preflightData = await preflightRes.json();
    assert.ok(preflightData.status, "Pre-flight must return status");
    assert.ok(preflightData.summary, "Pre-flight must return summary");
    assert.ok(Array.isArray(preflightData.checks), "Pre-flight must return checks array");

    // 3. GET /api/admin/config/verify without token -> 401 Unauthorized
    const unauthGetRes = await fetch(`${baseUrl}/api/admin/config/verify`);
    assert.strictEqual(unauthGetRes.status, 401);

    // 4. POST /api/admin/config/verify without token -> 401 Unauthorized
    const unauthPostRes = await fetch(`${baseUrl}/api/admin/config/verify`, {
      method: "POST"
    });
    assert.strictEqual(unauthPostRes.status, 401);

    // 5. GET /api/admin/config/verify with valid admin JWT -> 200 OK
    const token = jwt.sign({ username: "admin", role: "admin" }, process.env.JWT_SECRET);
    const authGetRes = await fetch(`${baseUrl}/api/admin/config/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(authGetRes.status, 200);
    const authGetData = await authGetRes.json();
    assert.ok(authGetData.overallStatus, "Admin verify must return overallStatus");
    assert.ok(Array.isArray(authGetData.checks), "Admin verify must return checks");
    assert.strictEqual(authGetData.summary.totalChecks, authGetData.checks.length);

    // 6. POST /api/admin/config/verify with valid admin JWT -> 200 OK (force refresh)
    const authPostRes = await fetch(`${baseUrl}/api/admin/config/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(authPostRes.status, 200);
    const authPostData = await authPostRes.json();
    assert.ok(authPostData.overallStatus, "Admin POST verify must return overallStatus");
    assert.ok(Array.isArray(authPostData.checks), "Admin POST verify must return checks");
  } finally {
    server.close();
  }
});
