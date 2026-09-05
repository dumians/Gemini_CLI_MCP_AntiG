/**
 * Startup Configuration Access Verifier
 * Validates access to config files, environment variables, storage providers,
 * GCP credentials, and MCP transports on system initialization.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logging_service.js";
import { storageProvider } from "./storage_service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../../");
const CONFIG_DIR = path.join(ROOT_DIR, "config");

export const CheckStatus = {
  PASSED: "PASSED",
  WARNING: "WARNING",
  FAILED: "FAILED"
};

export const OverallStatus = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  FAILED: "FAILED"
};

/**
 * Executes a single diagnostic check with timing and error isolation.
 */
async function executeCheck(id, name, category, checkFn) {
  const startTime = Date.now();
  try {
    const result = await checkFn();
    const durationMs = Date.now() - startTime;
    return {
      id,
      name,
      category,
      status: result.status || CheckStatus.PASSED,
      message: result.message || "Check passed successfully",
      details: result.details || null,
      durationMs
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    return {
      id,
      name,
      category,
      status: CheckStatus.FAILED,
      message: err.message || "Check encountered an unexpected error",
      details: { stack: err.stack },
      durationMs
    };
  }
}

/**
 * Verify complete configuration access for the Agentic Data Mesh.
 */
export async function verifyStartupConfigAccess(options = {}) {
  const { logToConsole = true } = options;
  const totalStart = Date.now();
  const checks = [];

  // =========================================================================
  // 1. Filesystem & Configuration Directory Access
  // =========================================================================

  // Check 1.1: Config Directory Permissions
  checks.push(await executeCheck(
    "config_dir_permissions",
    "Config Directory Access",
    "Filesystem & Storage",
    async () => {
      if (!fs.existsSync(CONFIG_DIR)) {
        return {
          status: CheckStatus.FAILED,
          message: `Configuration directory does not exist at ${CONFIG_DIR}`,
          details: { path: CONFIG_DIR }
        };
      }
      try {
        fs.accessSync(CONFIG_DIR, fs.constants.R_OK | fs.constants.W_OK);
        const files = fs.readdirSync(CONFIG_DIR);
        return {
          status: CheckStatus.PASSED,
          message: `Config directory verified readable & writable (${files.length} configuration files found)`,
          details: { path: CONFIG_DIR, fileCount: files.length }
        };
      } catch (err) {
        return {
          status: CheckStatus.FAILED,
          message: `Insufficient filesystem permissions for ${CONFIG_DIR}: ${err.message}`,
          details: { path: CONFIG_DIR }
        };
      }
    }
  ));

  // Check 1.2: Essential Config Files Validation
  const essentialConfigFiles = [
    { key: "agents.json", required: true, desc: "Autonomous Agent Registry" },
    { key: "data_sources.json", required: true, desc: "Data Sources & Domains" },
    { key: "data_contracts.json", required: false, desc: "Data Product Contracts" },
    { key: "policies.json", required: false, desc: "Governance Policies" },
    { key: "data_products.json", required: false, desc: "Mesh Data Products" },
    { key: "catalog_aspects.json", required: false, desc: "Knowledge Catalog Aspects" }
  ];

  for (const item of essentialConfigFiles) {
    checks.push(await executeCheck(
      `config_file_${item.key.replace(".json", "")}`,
      `Config File: ${item.key}`,
      "Filesystem & Storage",
      async () => {
        const filePath = path.join(CONFIG_DIR, item.key);
        if (!fs.existsSync(filePath)) {
          if (item.required) {
            return {
              status: CheckStatus.FAILED,
              message: `Required config file ${item.key} is missing`,
              details: { path: filePath, required: true }
            };
          } else {
            return {
              status: CheckStatus.WARNING,
              message: `Optional config file ${item.key} does not exist yet (will be initialized on demand)`,
              details: { path: filePath, required: false }
            };
          }
        }

        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const parsed = JSON.parse(raw);
          const entriesCount = Array.isArray(parsed) 
            ? parsed.length 
            : typeof parsed === "object" && parsed !== null 
            ? Object.keys(parsed).length 
            : 0;

          return {
            status: CheckStatus.PASSED,
            message: `Valid JSON parsed cleanly (${entriesCount} top-level entries) - ${item.desc}`,
            details: { path: filePath, entriesCount, sizeBytes: raw.length }
          };
        } catch (err) {
          return {
            status: CheckStatus.FAILED,
            message: `Syntax or JSON corruption in ${item.key}: ${err.message}`,
            details: { path: filePath, error: err.message }
          };
        }
      }
    ));
  }

  // Check 1.3: Storage Provider Verification
  checks.push(await executeCheck(
    "storage_provider_access",
    "Storage Provider Operations",
    "Filesystem & Storage",
    async () => {
      try {
        const testData = storageProvider.get("agents");
        const isArray = Array.isArray(testData);
        return {
          status: CheckStatus.PASSED,
          message: `Storage provider active and operational (test read returned ${isArray ? testData.length : "valid"} items)`,
          details: { providerClass: storageProvider.constructor?.name }
        };
      } catch (err) {
        return {
          status: CheckStatus.FAILED,
          message: `Storage provider failed operational test: ${err.message}`,
          details: { error: err.message }
        };
      }
    }
  ));

  // =========================================================================
  // 2. Environment & Authentication Access
  // =========================================================================

  // Check 2.1: JWT Secret Configuration
  checks.push(await executeCheck(
    "auth_jwt_secret",
    "JWT Authentication Secret",
    "Environment & Security",
    async () => {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.trim().length === 0) {
        return {
          status: CheckStatus.FAILED,
          message: "JWT_SECRET environment variable is missing or blank",
          details: { variable: "JWT_SECRET" }
        };
      }
      if (secret === "test-jwt-secret-key-for-mesh-os" && process.env.NODE_ENV === "production") {
        return {
          status: CheckStatus.WARNING,
          message: "Default development JWT_SECRET is active in production environment",
          details: { variable: "JWT_SECRET", warning: "Please set a cryptographically random secret" }
        };
      }
      return {
        status: CheckStatus.PASSED,
        message: "JWT_SECRET configured and verified",
        details: { length: secret.length }
      };
    }
  ));

  // Check 2.2: Admin Credentials Access
  checks.push(await executeCheck(
    "auth_admin_credentials",
    "Admin Master Credentials",
    "Environment & Security",
    async () => {
      const user = process.env.ADMIN_USERNAME;
      const pass = process.env.ADMIN_PASSWORD;

      if (!user || !pass) {
        return {
          status: CheckStatus.WARNING,
          message: "ADMIN_USERNAME or ADMIN_PASSWORD not explicitly set in environment (using default fallback)",
          details: { usernameConfigured: Boolean(user), passwordConfigured: Boolean(pass) }
        };
      }
      return {
        status: CheckStatus.PASSED,
        message: `Admin credentials verified for user '${user}'`,
        details: { username: user }
      };
    }
  ));

  // =========================================================================
  // 3. GCP Cloud Infrastructure & AI Configuration
  // =========================================================================

  // Check 3.1: Gemini AI API Key
  checks.push(await executeCheck(
    "gcp_gemini_api_key",
    "Gemini AI API Key Access",
    "Cloud & AI Services",
    async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim().length === 0) {
        return {
          status: CheckStatus.WARNING,
          message: "GEMINI_API_KEY is not set. System will operate in simulated AI mode.",
          details: { variable: "GEMINI_API_KEY", mode: "simulation" }
        };
      }
      const masked = apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4);
      return {
        status: CheckStatus.PASSED,
        message: `Gemini AI API key configured (${masked})`,
        details: { keyFormat: apiKey.startsWith("AIza") ? "Google Cloud / AI Studio" : "Custom Key" }
      };
    }
  ));

  // Check 3.2: GCP Project Identifier
  checks.push(await executeCheck(
    "gcp_project_id",
    "Google Cloud Project Configuration",
    "Cloud & AI Services",
    async () => {
      const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "total-vertex-469513-r8";
      return {
        status: CheckStatus.PASSED,
        message: `Target Google Cloud Project: ${projectId}`,
        details: { projectId, region: process.env.GCP_REGION || "europe-west1" }
      };
    }
  ));

  // Check 3.3: Google Application Default Credentials (ADC)
  checks.push(await executeCheck(
    "gcp_adc_credentials",
    "Google Cloud Credentials (ADC)",
    "Cloud & AI Services",
    async () => {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credPath) {
        if (fs.existsSync(credPath)) {
          return {
            status: CheckStatus.PASSED,
            message: `Service account key verified at ${credPath}`,
            details: { path: credPath }
          };
        } else {
          return {
            status: CheckStatus.WARNING,
            message: `GOOGLE_APPLICATION_CREDENTIALS points to missing file: ${credPath}`,
            details: { path: credPath }
          };
        }
      }
      // Check default ADC path
      const home = process.env.HOME || process.env.USERPROFILE || "";
      const defaultAdcPath = path.join(home, ".config/gcloud/application_default_credentials.json");
      if (fs.existsSync(defaultAdcPath)) {
        return {
          status: CheckStatus.PASSED,
          message: "User Application Default Credentials (ADC) detected from gcloud",
          details: { path: defaultAdcPath }
        };
      }
      return {
        status: CheckStatus.WARNING,
        message: "No explicit service account JSON key found. Relying on Compute Engine / Cloud Run runtime identity.",
        details: { envVarSet: false }
      };
    }
  ));

  // =========================================================================
  // 4. MCP Gateway & Transports Configuration Access
  // =========================================================================

  checks.push(await executeCheck(
    "mcp_gateway_transport",
    "MCP Gateway Local Transports",
    "MCP Gateway & Data Transports",
    async () => {
      const serversDir = path.join(ROOT_DIR, "servers");
      if (!fs.existsSync(serversDir)) {
        return {
          status: CheckStatus.WARNING,
          message: "servers/ directory not found. Tool execution may be limited to external MCP endpoints.",
          details: { path: serversDir }
        };
      }
      const localServers = fs.readdirSync(serversDir).filter(s => {
        try {
          return fs.statSync(path.join(serversDir, s)).isDirectory();
        } catch {
          return false;
        }
      });
      return {
        status: CheckStatus.PASSED,
        message: `Local MCP server suites detected: [${localServers.join(", ")}]`,
        details: { serverCount: localServers.length, servers: localServers }
      };
    }
  ));

  // =========================================================================
  // Aggregate Metrics & Overall Status
  // =========================================================================

  let passed = 0;
  let warnings = 0;
  let failed = 0;

  for (const c of checks) {
    if (c.status === CheckStatus.PASSED) passed++;
    else if (c.status === CheckStatus.WARNING) warnings++;
    else if (c.status === CheckStatus.FAILED) failed++;
  }

  let overallStatus = OverallStatus.HEALTHY;
  if (failed > 0) {
    overallStatus = OverallStatus.FAILED;
  } else if (warnings > 0) {
    overallStatus = OverallStatus.DEGRADED;
  }

  const report = {
    timestamp: new Date().toISOString(),
    overallStatus,
    summary: {
      totalChecks: checks.length,
      passed,
      warnings,
      failed,
      durationMs: Date.now() - totalStart
    },
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      env: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3001
    }
  };

  // Log Startup Diagnostic Banner
  if (logToConsole) {
    logVerificationBanner(report);
  }

  return report;
}

/**
 * Format and write verification diagnostic output to console and logger.
 */
function logVerificationBanner(report) {
  const { overallStatus, summary, checks } = report;
  const statusColor = 
    overallStatus === OverallStatus.HEALTHY ? "\x1b[32m" : // Green
    overallStatus === OverallStatus.DEGRADED ? "\x1b[33m" : // Yellow
    "\x1b[31m"; // Red

  console.log("\n" + statusColor + "================================================================================" + "\x1b[0m");
  console.log(statusColor + `[STARTUP CONFIG VERIFICATION] Status: ${overallStatus} (${summary.passed} passed, ${summary.warnings} warnings, ${summary.failed} failed)` + "\x1b[0m");
  console.log(statusColor + "================================================================================" + "\x1b[0m");

  for (const check of checks) {
    const icon = 
      check.status === CheckStatus.PASSED ? "\x1b[32m✓\x1b[0m" :
      check.status === CheckStatus.WARNING ? "\x1b[33m⚠\x1b[0m" :
      "\x1b[31m✗\x1b[0m";

    console.log(`  ${icon} [${check.category}] ${check.name}: ${check.message} (${check.durationMs}ms)`);
  }

  console.log(statusColor + "================================================================================\n" + "\x1b[0m");

  // Also record in central structured logger
  logger.log(
    "Server",
    `Startup configuration access verified: ${overallStatus} (${summary.passed}/${summary.totalChecks} checks passed)`,
    overallStatus === OverallStatus.FAILED ? "ERROR" : overallStatus === OverallStatus.DEGRADED ? "WARN" : "INFO",
    {
      summary,
      failedChecks: checks.filter(c => c.status === CheckStatus.FAILED).map(c => c.name),
      warningChecks: checks.filter(c => c.status === CheckStatus.WARNING).map(c => c.name)
    }
  );
}

// In-memory cached report from startup
let cachedStartupReport = null;

export async function getOrRunStartupReport(forceRefresh = false) {
  if (!cachedStartupReport || forceRefresh) {
    cachedStartupReport = await verifyStartupConfigAccess({ logToConsole: forceRefresh });
  }
  return cachedStartupReport;
}
