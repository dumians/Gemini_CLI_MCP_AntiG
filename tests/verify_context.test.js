import test from "node:test";
import assert from "node:assert";
import dotenv from "dotenv";
import { askOrchestrator } from "../agent/orchestrator.js";

dotenv.config();

test("Verify askOrchestrator returns context", async () => {
    console.log("Calling askOrchestrator...");
    const result = await askOrchestrator('Test query to check context return');
    assert.ok(result.context, "Result should have context");
    assert.ok(result.context.horizontal, "Context should have horizontal");
    assert.ok(result.context.plan, "Context should have plan");
});
