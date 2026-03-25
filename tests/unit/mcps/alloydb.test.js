import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.GCP_PROJECT_ID = "test-project";
process.env.ALLOYDB_REGION = "test-region";
process.env.ALLOYDB_CLUSTER = "test-cluster";
process.env.ALLOYDB_INSTANCE = "test-instance";
process.env.ALLOYDB_USER = "test-user";
process.env.ALLOYDB_PASSWORD = "test-password";
process.env.ALLOYDB_DB = "test-db";

import { server } from "../../../servers/alloydb-mcp/index.js";

test("AlloyDB MCP: List Tools", async () => {
    const handler = server._requestHandlers.get("tools/list");
    const result = await handler({ method: "tools/list" });
    assert.ok(result.tools.some(t => t.name === "query_alloydb_vector"));
});

test("AlloyDB MCP: query_alloydb_vector (Simulation)", async () => {
    const handler = server._requestHandlers.get("tools/call");
    const result = await handler({
        method: "tools/call",
        params: {
            name: "query_alloydb_vector",
            arguments: { query: "SELECT * FROM tickets LIMIT 1" }
        }
    });
    // The simulation yields a JSON string containing ticket data parsed from alloydb_tickets.csv
    assert.ok(result.content[0].text.includes("Delayed shipment"));
});
