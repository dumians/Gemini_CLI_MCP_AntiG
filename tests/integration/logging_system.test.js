import test from "node:test";
import assert from "node:assert";
import jwt from "../../server/node_modules/jsonwebtoken/index.js";
import { logger, LogLevels, LogTypes } from "../../agent/utils/logging_service.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-mesh-os";

test("Logging Service: Structured Logging & Domain Resolution", () => {
  const traceId = "trace-test-unit-001";
  logger.clearLogs();

  logger.info("RetailAgent", "Order processed #12345", { orderId: 12345, amount: 99.99 }, traceId);
  logger.warn("CRMAgent", "High churn risk detected", { customerId: "C-99" }, traceId);
  logger.error("AnalyticsAgent", "Query timeout in BigQuery", { queryId: "bq-404" }, traceId);
  logger.debug("Orchestrator", "Evaluating synthesis branches", { branches: 3 }, traceId);

  const logs = logger.getLogs({ traceId });
  assert.strictEqual(logs.length, 4);

  const retailLog = logs.find(l => l.agent === "RetailAgent");
  assert.ok(retailLog);
  assert.strictEqual(retailLog.domain, "Spanner Retail");
  assert.strictEqual(retailLog.level, LogLevels.INFO);
  assert.strictEqual(retailLog.traceId, traceId);
  assert.strictEqual(retailLog.source, "backend");

  const crmLog = logs.find(l => l.agent === "CRMAgent");
  assert.strictEqual(crmLog.level, LogLevels.WARN);
  assert.strictEqual(crmLog.domain, "AlloyDB CRM");

  const analyticsLog = logs.find(l => l.agent === "AnalyticsAgent");
  assert.strictEqual(analyticsLog.level, LogLevels.ERROR);

  const orchLog = logs.find(l => l.agent === "Orchestrator");
  assert.strictEqual(orchLog.level, LogLevels.DEBUG);
});

test("Logging Service: Filtering, Search, and Pagination", () => {
  logger.clearLogs();
  logger.info("RetailAgent", "Inventory check for SKU-ABC", { sku: "SKU-ABC" }, "tr-1");
  logger.error("HRAgent", "Payroll calculation failed", { dept: "Sales" }, "tr-2");
  logger.info("WarehouseAgent", "Pallet dispatched to bay 4", { bay: 4 }, "tr-3");

  // Filter by level
  const errorLogs = logger.getLogs({ level: "ERROR" });
  assert.strictEqual(errorLogs.length, 1);
  assert.strictEqual(errorLogs[0].agent, "HRAgent");

  // Filter by agent
  const retailLogs = logger.getLogs({ agent: "RetailAgent" });
  assert.strictEqual(retailLogs.length, 1);

  // Search keyword in message
  const searchLogs = logger.getLogs({ search: "payroll" });
  assert.strictEqual(searchLogs.length, 1);
  assert.strictEqual(searchLogs[0].agent, "HRAgent");

  // Search keyword in metadata
  const metaSearch = logger.getLogs({ search: "SKU-ABC" });
  assert.strictEqual(metaSearch.length, 1);

  // Stats validation
  const stats = logger.getStats();
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.errors, 1);
  assert.strictEqual(stats.byLevel.INFO, 2);
  assert.strictEqual(stats.byLevel.ERROR, 1);
});

test("Logging Service: PubSub and Real-Time SSE Broadcasting", (t, done) => {
  let received = null;
  const unsubscribe = logger.subscribe((entry) => {
    received = entry;
  });

  logger.info("RetailAgent", "Realtime stream test event", { val: 42 });
  unsubscribe();

  assert.ok(received);
  assert.strictEqual(received.message, "Realtime stream test event");
  assert.strictEqual(received.agent, "RetailAgent");
  done();
});

test("API Server: HTTP Request Tracing & Logging Endpoints", async () => {
  const { app } = await import("../../server/server.js");
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const token = jwt.sign({ username: "admin", role: "admin" }, process.env.JWT_SECRET);
    const customTrace = "custom-trace-" + Date.now();

    // 1. Check HTTP request tracing header propagation
    const healthRes = await fetch(`http://localhost:${port}/health`, {
      headers: {
        "x-trace-id": customTrace
      }
    });
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.headers.get("x-trace-id"), customTrace);

    // 2. Client log ingestion endpoint
    const clientRes = await fetch(`http://localhost:${port}/api/admin/logs/client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "WARN",
        message: "UI component render timeout warning",
        meta: { component: "DataLineageGraph" },
        traceId: customTrace
      })
    });
    assert.strictEqual(clientRes.status, 200);
    const clientData = await clientRes.json();
    assert.strictEqual(clientData.success, true);

    // Verify it was logged with source=client
    const clientLogs = logger.getLogs({ traceId: customTrace, source: "client" });
    assert.strictEqual(clientLogs.length, 1);
    assert.strictEqual(clientLogs[0].source, "client");
    assert.strictEqual(clientLogs[0].agent, "UIX-Client");

    // 3. Admin logs query endpoint
    const logsRes = await fetch(`http://localhost:${port}/api/admin/logs?traceId=${customTrace}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.strictEqual(logsRes.status, 200);
    const logsBody = await logsRes.json();
    assert.ok(Array.isArray(logsBody.logs));
    assert.strictEqual(logsBody.total, 1);

    // 4. Admin stats endpoint
    const statsRes = await fetch(`http://localhost:${port}/api/admin/logs/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.strictEqual(statsRes.status, 200);
    const statsBody = await statsRes.json();
    assert.ok(typeof statsBody.total === "number");

    // 5. Admin export endpoint (JSON)
    const exportJsonRes = await fetch(`http://localhost:${port}/api/admin/logs/export?format=json&traceId=${customTrace}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.strictEqual(exportJsonRes.status, 200);
    const exportJson = await exportJsonRes.json();
    assert.ok(Array.isArray(exportJson));
    assert.strictEqual(exportJson.length, 1);

    // 6. Admin export endpoint (CSV)
    const exportCsvRes = await fetch(`http://localhost:${port}/api/admin/logs/export?format=csv&traceId=${customTrace}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.strictEqual(exportCsvRes.status, 200);
    const exportCsv = await exportCsvRes.text();
    assert.ok(exportCsv.includes("timestamp"));
    assert.ok(exportCsv.includes(customTrace));

  } finally {
    server.close();
  }
});
