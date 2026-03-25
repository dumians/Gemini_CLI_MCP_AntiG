import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { handleFinancialRequest } from "./financial_agent.js";
import { handleRetailRequest } from "./retail_agent.js";
import { handleAnalyticsRequest } from "./analytics_agent.js";
import { handleHRTask } from "./hr_agent.js";
import { catalogAgent } from "./catalog_agent.js";
import { validateDataProduct, getDiscoveryTools, AgentRegistry } from "./utils/catalog.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import { kgService } from "./utils/kg_service.js";
import { memoryBankService } from "./utils/memory_bank_service.js";
import GenericAgent from "./utils/generic_agent.js";

dotenv.config();

const genericRunnerMap = {}; // Persistent live cached connectors

const config = configService.getConfig("orchestrator");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = config.system_instruction_prefix + `
  Your job is to receive complex queries and delegate them to domain-expert agents registered in our **Agentic Catalog**.
  
  **Autonomous Discovery & Governance**:
  - You interact with agents that return formal 'Data Products'.
  - Every product is automatically validated against a 'Data Contract'.
  - You maintain a shared 'Mesh Context' to enable Cross-Domain Intelligence.
  - You use the **CatalogAgent** to find where data is located or how schemas relate before querying domain agents.
  
  **Domain Experts**:
  - FinancialAgent (Finance)
  - RetailAgent (Retail)
  - AnalyticsAgent (Analytics)
  - HRAgent (HR)
  - CatalogAgent (Catalog & Metadata)
  
  Break down the user query and call the appropriate tools. Correlate insights to provide a strategic synthesis.`;

// Static getDiscoveryTools load deprecated for dynamic Factory Expansion.

/**
 * Basic Governance Filter to safeguard continuous domain bounds.
 * Limits sensitive payloads bleeding across agents iteratively.
 */
function filterMeshContext(context, targetAgentName) {
    const filtered = { ...context };
    
    // Example Governance Trigger: Limit HR payloads leaking to Finance
    if (targetAgentName === "FinancialAgent") {
        if (filtered["HRAgent"]) {
            filtered["HRAgent"] = { 
                insights: "Access Restricted: HR Data not scoped for financial sync bounds.", 
                summary: "Confidential" 
            };
        }
    }
    return filtered;
}

/**
 * Executes a query through the A2A Orchestrator.
 * @param {string} query The user query.
 * @param {string} userId The user ID for scoping memory.
 * @returns {Promise<{text: string, steps: Array<{agent: string, query: string, result: any}>}>}
 */
export async function askOrchestrator(query, userId = 'admin') {
    const traceId = Math.random().toString(36).substring(2, 10);
    logger.log("Orchestrator", `Received query: ${query} (User: ${userId})`, "INFO", null, traceId);
    
    // 1. Record the User Intent in the Knowledge Graph
    const intentId = kgService.createIntentNode(query, traceId);
    
    // 2. Retrieve Horizontal Context (RAG)
    const horizontalContext = kgService.getHorizontalContextSummary();
    
    // 2b. Retrieve Vertex AI Memories for Personalization
    let vertexMemoriesContext = "";
    let sessionPath = null;
    try {
        const memories = await memoryBankService.retrieveMemories(userId, query);
        if (memories && memories.length > 0) {
            vertexMemoriesContext = `\n\n[VERTEX LONG-TERM MEMORIES]\n` + memories.map(m => `- ${m.fact}`).join('\n');
            logger.log("Orchestrator", `Retrieved ${memories.length} vertex memories`, "INFO", null, traceId);
        }
        sessionPath = await memoryBankService.createSession(userId);
        await memoryBankService.appendEvent(sessionPath, { role: 'USER', text: query });
    } catch (err) {
        logger.log("Orchestrator", `Memory Bank step failed: ${err.message}`, "WARNING", null, traceId);
    }

    const enrichedSystemInstruction = systemInstruction + `\n\n[GLOBAL MESH CONTEXT]\n${horizontalContext}` + vertexMemoriesContext;

    const model = ai.getGenerativeModel({
        model: config.model || "gemini-3.1-flash-preview",
        systemInstruction: enrichedSystemInstruction,
        tools: getDiscoveryTools(), // Dynamically fetch loaded registry items
    });

    const chat = model.startChat();
    const steps = [];
    const meshContext = {}; // The shared intelligence layer

    try {
        let result = await chat.sendMessage(query);
        let response = result.response;

        // Loop while there are function calls
        while (response.functionCalls() && response.functionCalls().length > 0) {
            const toolCallParts = [];
            for (const call of response.functionCalls()) {
                const startTime = Date.now();
                let agentResult = "";
                let agentName = "";
                let subQuery = call.args.query;

                // Map tool call to agent
                const agentDef = AgentRegistry.find(a => a.toolName === call.name);
                if (!agentDef) {
                    logger.log("Orchestrator", `Unknown tool call: ${call.name}`, "ERROR", null, traceId);
                    continue;
                }

                agentName = agentDef.name;
                logger.logDispatch("Orchestrator", agentName, subQuery, traceId);

                try {
                    let rawResult;
                    const filteredContext = filterMeshContext(meshContext, agentName);

                    if (call.name === "call_catalog_agent") {
                        rawResult = await catalogAgent.process(subQuery, filteredContext, traceId);
                    } else {
                        // Dynamic ADK dispatching trigger
                        if (!genericRunnerMap[agentName]) {
                            genericRunnerMap[agentName] = new GenericAgent(agentDef);
                        }
                        rawResult = await genericRunnerMap[agentName].process(subQuery, filteredContext, traceId);
                    }

                    agentResult = validateDataProduct(rawResult, agentName);
                    
                    // Log success with latency
                    logger.logResponse(agentName, agentDef.domain, agentResult.metadata.confidence, Date.now() - startTime, traceId);

                    // Update Mesh Context with this agent's insights for subsequent calls
                    meshContext[agentName] = {
                        insights: agentResult.insights,
                        summary: typeof agentResult.data === 'string' ? agentResult.data.substring(0, 200) : "Complex Data Product"
                    };

                    // 3. Link Data Product to the Intent in the KG
                    const ctxNodeId = kgService.createContextNode('DATA_PRODUCT', {
                        agent: agentName,
                        domain: agentDef.domain,
                        confidence: agentResult.metadata.confidence,
                        traceId
                    });
                    kgService.addEdge(intentId, ctxNodeId, 'SATISFIED_BY', {
                        subQuery: subQuery
                    });

                    steps.push({
                        agent: agentName,
                        query: subQuery,
                        result: agentResult
                    });

                    toolCallParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: agentResult }
                        }
                    });
                } catch (err) {
                    logger.log(agentName, `Execution failed: ${err.message}`, "ERROR");
                    toolCallParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: err.message }
                        }
                    });
                }
            }
            result = await chat.sendMessage(toolCallParts);
            response = result.response;
        }

        logger.log("Orchestrator", `Successfully synthesized result`, "INFO");

        if (sessionPath) {
            try {
                await memoryBankService.appendEvent(sessionPath, { role: 'MODEL', text: response.text() });
                // Trigger background memory generation
                memoryBankService.generateMemories(sessionPath).catch(e => 
                    logger.log("Orchestrator", `Async Memory Gen error: ${e.message}`, "WARNING")
                );
            } catch (err) {
                logger.log("Orchestrator", `Failed to append MODEL event: ${err.message}`, "WARNING");
            }
        }

        return {
            text: response.text(),
            steps: steps
        };
    } catch (err) {
        logger.log("Orchestrator", `Orchestration Error: ${err.message}`, "ERROR");
        throw err;
    }
}

