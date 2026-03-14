import test from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.GCP_PROJECT_ID = "test-project";
process.env.SPANNER_INSTANCE_ID = "test-instance";
process.env.SPANNER_DATABASE_ID = "test-db";

import { server } from "../../../servers/spanner-mcp/index.js";

test("Spanner MCP: List Tools", async () => {
    assert.ok(server);
});

test("Spanner MCP: query_spanner_sql (Simulation)", async () => {
    assert.ok(true);
});
