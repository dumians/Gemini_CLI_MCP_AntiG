import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.ORACLE_USER = "test-user";
process.env.ORACLE_PASSWORD = "test-password";
process.env.ORACLE_CONNECT_STRING = "test-conn";

import { server } from "../../../servers/oracle-mcp/index.js";

test("Oracle MCP: List Tools", async () => {
    const handler = server._requestHandlers.get("tools/list");
    const result = await handler({ method: "tools/list" });
    assert.ok(result.tools.some(t => t.name === "query_oracle_sql"));
});

test("Oracle MCP: query_oracle_sql (Simulation)", async () => {
    const handler = server._requestHandlers.get("tools/call");
    const result = await handler({
        method: "tools/call",
        params: {
            name: "query_oracle_sql",
            arguments: { sql: "SELECT * FROM ERP_INVOICES FETCH FIRST 1 ROWS ONLY" }
        }
    });
    assert.ok(result.content[0].text.includes("Simulated Oracle SQL result"));
});
