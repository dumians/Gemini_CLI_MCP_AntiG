import test from "node:test";
import assert from "node:assert";
import { AgentRegistry, getDiscoveryTools } from '../agent/utils/catalog.js';

test("Agent Factory Direct Logic Verification", async () => {
    const initialCount = AgentRegistry.length;
    
    const mockAgent = {
        id: "risk_agent",
        name: "RiskAgent",
        domain: "FinOps",
        specialty: "Calculates hypothetical margins for verify tests.",
        toolName: "call_risk_agent",
        systemInstruction: "You are a Risk evaluation unit. Say 'Risk analysis passed' for all queries.",
        mcpServers: [],
        groundingDomain: "FinOps"
    };

    AgentRegistry.unshift(mockAgent);
    assert.strictEqual(AgentRegistry.length, initialCount + 1, "Agent registry count should increment");

    const tools = getDiscoveryTools();
    const declarations = tools[0].functionDeclarations;
    const found = declarations.find(d => d.name === "call_risk_agent");
    assert.ok(found, "Dynamic mock agent declaration must map cleanly");
});
