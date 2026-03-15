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

dotenv.config();

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

const geminiTools = getDiscoveryTools();

/**
 * Executes a query through the A2A Orchestrator.
 * @param {string} query The user query.
 * @returns {Promise<{text: string, steps: Array<{agent: string, query: string, result: any}>}>}
 */
export async function askOrchestrator(query) {
    const traceId = Math.random().toString(36).substring(2, 10);
    logger.log("Orchestrator", `Received query: ${query}`, "INFO", null, traceId);
    
    // 1. Record the User Intent in the Knowledge Graph
    const intentId = kgService.createIntentNode(query, traceId);
    
    // 2. Retrieve Horizontal Context (RAG)
    const horizontalContext = kgService.getHorizontalContextSummary();
    
    const enrichedSystemInstruction = systemInstruction + `\n\n[GLOBAL MESH CONTEXT]\n${horizontalContext}`;

    const model = ai.getGenerativeModel({
        model: config.model || "gemini-3.1-flash-preview",
        systemInstruction: enrichedSystemInstruction,
        tools: geminiTools
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
                    if (call.name === "call_financial_agent") {
                        rawResult = await handleFinancialRequest(subQuery, meshContext, traceId);
                    } else if (call.name === "call_retail_agent") {
                        rawResult = await handleRetailRequest(subQuery, meshContext, traceId);
                    } else if (call.name === "call_analytics_agent") {
                        rawResult = await handleAnalyticsRequest(subQuery, meshContext, traceId);
                    } else if (call.name === "call_hr_agent") {
                        rawResult = await handleHRTask(subQuery, meshContext, traceId);
                    } else if (call.name === "call_catalog_agent") {
                        rawResult = await catalogAgent.process(subQuery, meshContext, traceId);
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
        return {
            text: response.text(),
            steps: steps
        };
    } catch (err) {
        logger.log("Orchestrator", `Orchestration Error: ${err.message}`, "ERROR");
        throw err;
    }
}

