import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.GCP_PROJECT_ID = "test-project";
process.env.SPANNER_INSTANCE_ID = "test-instance";
process.env.SPANNER_DATABASE_ID = "test-db";

import { server } from "../../../servers/spanner-mcp/index.js";

test("Spanner MCP: List Tools", async () => {
    const handler = server._requestHandlers.get("tools/list");
    const result = await handler({ method: "tools/list" });
    assert.ok(result.tools.some(t => t.name === "query_spanner_sql"));
});

test("Spanner MCP: query_spanner_sql (Simulation)", async () => {
    const handler = server._requestHandlers.get("tools/call");
    const result = await handler({
        method: "tools/call",
        params: {
            name: "query_spanner_sql",
            arguments: { sql: "SELECT * FROM Singers LIMIT 1" }
        }
    });
    assert.ok(result.content[0].text.includes("Simulated Spanner SQL result"));
});

test("Spanner MCP: query_spanner_graph (Simulation)", async () => {
    const handler = server._requestHandlers.get("tools/call");
    const result = await handler({
        method: "tools/call",
        params: {
            name: "query_spanner_graph",
            arguments: { gql_match: "MATCH (n) RETURN n LIMIT 1" }
        }
    });
    assert.ok(result.content[0].text.includes("Simulated Spanner GQL result"));
});
