import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.GCP_PROJECT_ID = "test-project";

import { server } from "../../../servers/bigquery-mcp/index.js";

test("BigQuery MCP: List Tools", async () => {
    const handler = server._requestHandlers.get("tools/list");
    const result = await handler({ method: "tools/list" });
    assert.ok(result.tools.some(t => t.name === "query_bigquery"));
});

test("BigQuery MCP: query_bigquery (Simulation)", async () => {
    const handler = server._requestHandlers.get("tools/call");
    const result = await handler({
        method: "tools/call",
        params: {
            name: "query_bigquery",
            arguments: { query: "SELECT * FROM dataset.table LIMIT 1" }
        }
    });
    assert.ok(result.content[0].text.includes("Simulated BigQuery result"));
});
