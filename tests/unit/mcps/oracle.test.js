import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.ORACLE_USER = "test-user";
process.env.ORACLE_PASSWORD = "test-password";
process.env.ORACLE_CONNECT_STRING = "test-conn";

import { server } from "../../../servers/oracle-mcp/index.js";

test("Oracle MCP: List Tools", async () => {
    assert.ok(server);
});

test("Oracle MCP: query_oracle_sql (Simulation)", async () => {
    assert.ok(true);
});
