import { AgentRegistry, getDiscoveryTools } from '../agent/utils/catalog.js';

async function verifyFactory() {
    console.log("=== Agent Factory Direct Logic Verification ===");

    console.log("\n1. Current Loaded Agents in Registry:");
    AgentRegistry.forEach(a => console.log(` - [${a.id}] ${a.name} (${a.domain})`));

    console.log("\n2. Injecting dynamic MockAgent...");
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
    console.log("✅ MockAgent inserted in-memory.");

    console.log("\n3. Verifying getDiscoveryTools declaration includes new agent...");
    try {
        const tools = getDiscoveryTools();
        const declarations = tools[0].functionDeclarations;
        const found = declarations.find(d => d.name === "call_risk_agent");
        if (found) {
            console.log("✅ Factory accurately mapped new function declaration!");
        } else {
            console.log("❌ Discovered failure to map dynamically!");
        }
    } catch (err) {
         console.error("❌ Error executing tool discovery logic:", err);
    }
}

verifyFactory();
