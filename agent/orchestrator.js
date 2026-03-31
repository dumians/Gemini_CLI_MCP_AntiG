import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { handleFinancialRequest } from "./financial_agent.js";
import { handleRetailRequest } from "./retail_agent.js";
import { handleAnalyticsRequest } from "./analytics_agent.js";
import { handleHRTask } from "./hr_agent.js";
import { catalogAgent } from "./catalog_agent.js";
import { generatePlan } from "./planner_agent.js";
import { validateDataProduct, getDiscoveryTools, AgentRegistry } from "./utils/catalog.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import { kgService } from "./utils/kg_service.js";
import { memoryBankService } from "./utils/memory_bank_service.js";
import GenericAgent from "./utils/generic_agent.js";

dotenv.config();

class MeshAgentFactory {
    constructor() {
        this.cache = {};
    }

    async runAgent(agentDef, query, context, traceId) {
        const agentName = agentDef.name;
        if (!this.cache[agentName]) {
            logger.log("AgentFactory", `Spawning dynamic ADK agent: ${agentName} [${agentDef.domain}]`, "INFO", null, traceId);
            this.cache[agentName] = new GenericAgent(agentDef);
        }
        return await this.cache[agentName].process(query, context, traceId);
    }
}

const meshAgentFactory = new MeshAgentFactory();

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
 * Maps business terms in the query to technical schema columns.
 */
async function mapBusinessTerms(query, traceId) {
    logger.log("Orchestrator", `Mapping business terms for: ${query}`, "INFO", null, traceId);
    
    const entitiesSummary = [];
    if (metadataCatalog && metadataCatalog.entities) {
        for (const [id, entity] of Object.entries(metadataCatalog.entities)) {
            if (entity.type !== 'TABLE') continue;
            const attrs = entity.attributes.map(a => `${a.name} (${a.dataType})`).join(', ');
            entitiesSummary.push(`- Table: ${id}, Columns: [${attrs}]`);
        }
    }

    const systemInstruction = `You are a Data Architect analyzing a user query for a data mesh.
    Your job is to identify business terms in the query and map them to technical schema columns found in the catalog.
    
    Output a JSON object mapping the found business term to the technical column name (e.g., 'revenue' -> 'invoice_amount').
    If no mapping is needed or found, return an empty object.
    
    Available Schemas:
    ${entitiesSummary.join('\n')}
    
    Output ONLY the JSON object.`;

    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
    });

    try {
        const result = await model.generateContent(query);
        const responseText = result.response.text();
        const mapping = JSON.parse(responseText);
        logger.log("Orchestrator", `Mapped terms: ${responseText}`, "DEBUG", null, traceId);
        return mapping;
    } catch (err) {
        logger.log("Orchestrator", `Failed to map business terms: ${err.message}`, "WARNING", null, traceId);
        return {};
    }
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

    const mapping = await mapBusinessTerms(query, traceId);
    let enrichedQuery = query;
    if (Object.keys(mapping).length > 0) {
        enrichedQuery += `\n(Mapped Terms: ${JSON.stringify(mapping)})`;
    }

    const plan = await generatePlan(enrichedQuery, traceId);
    const planContext = `\n\n[STRATEGIC PLAN]\n` + JSON.stringify(plan, null, 2);
    const enrichedSystemInstruction = systemInstruction + `\n\n[GLOBAL MESH CONTEXT]\n${horizontalContext}` + vertexMemoriesContext + planContext;

    const model = ai.getGenerativeModel({
        model: config.model || "gemini-2.5-flash",
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
            const promises = [];

            for (const call of response.functionCalls()) {
                const agentDef = AgentRegistry.find(a => a.toolName === call.name);
                if (!agentDef) {
                    logger.log("Orchestrator", `Unknown tool call: ${call.name}`, "ERROR", null, traceId);
                    continue;
                }

                const agentName = agentDef.name;
                const subQuery = call.args.query;
                const filteredContext = filterMeshContext(meshContext, agentName);

                logger.logDispatch("Orchestrator", agentName, subQuery, traceId);

                const promise = (async () => {
                    const startTime = Date.now();
                    let rawResult;
                    try {
                        if (call.name === "call_catalog_agent") {
                            rawResult = await catalogAgent.process(subQuery, filteredContext, traceId);
                        } else {
                            // Dynamic ADK dispatching trigger
                            rawResult = await meshAgentFactory.runAgent(agentDef, subQuery, filteredContext, traceId);
                            
                            try {
                                const { DataplexAgent } = await import('./dataplex_agent.js');
                                const dataplex = new DataplexAgent();
                                await dataplex.trackLineage(agentName, 'MeshLineage', 'processed_query', traceId);
                            } catch (err) {
                                logger.log("Orchestrator", `Failed to log lineage: ${err.message}`, "WARNING", null, traceId);
                            }
                        }

                        const agentResult = validateDataProduct(rawResult, agentName);
                        
                        // Log success with latency
                        logger.logResponse(agentName, agentDef.domain, agentResult.metadata.confidence, Date.now() - startTime, traceId);

                        return { agentName, agentResult, subQuery, callName: call.name, domain: agentDef.domain };
                    } catch (err) {
                        logger.log(agentName, `Execution failed: ${err.message}`, "ERROR");
                        return { agentName, error: err.message, subQuery, callName: call.name };
                    }
                })();
                promises.push(promise);
            }

            const results = await Promise.all(promises);

            for (const res of results) {
                const { agentName, agentResult, subQuery, callName, domain, error } = res;
                if (error) {
                    toolCallParts.push({
                        functionResponse: {
                            name: callName,
                            response: { error: error }
                        }
                    });
                    continue;
                }

                // Update Mesh Context with this agent's insights
                meshContext[agentName] = {
                    insights: agentResult.insights,
                    summary: typeof agentResult.data === 'string' ? agentResult.data.substring(0, 200) : "Complex Data Product"
                };

                // Link Data Product to the Intent in the KG
                const ctxNodeId = kgService.createContextNode('DATA_PRODUCT', {
                    agent: agentName,
                    domain: domain,
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
                        name: callName,
                        response: { result: agentResult }
                    }
                });
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

        // Phase 3: Reflection / Self-Correction
        logger.log("Orchestrator", `Reflecting on synthesis...`, "INFO");
        const reflectionPrompt = `Act as a critic. Reflect on the following answer generated for the original query: "${query}".
        
        Answer:
        ${response.text()}
        
        Does this answer fully and accurately address the query based on the steps taken? 
        If yes, respond with 'APPROVED'.
        If no, provide a 'REVISED_ANSWER:' followed by the corrected answer.
        Output ONLY 'APPROVED' or 'REVISED_ANSWER: <content>'.`;

        const reflectionModel = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const reflectionResult = await reflectionModel.generateContent(reflectionPrompt);
        const reflectionText = reflectionResult.response.text();
        
        let finalAnswer = response.text();
        if (reflectionText.includes('REVISED_ANSWER:')) {
            logger.log("Orchestrator", `Reflection triggered correction.`, "WARNING");
            finalAnswer = reflectionText.split('REVISED_ANSWER:')[1].trim();
        } else {
            logger.log("Orchestrator", `Reflection approved answer.`, "INFO");
        }

        // Phase 4: Human-in-the-Loop (Simulation for Demo)
        logger.log("Orchestrator", `[HUMAN-IN-THE-LOOP] Simulating human approval for synthesis result...`, "INFO");
        logger.log("Orchestrator", `[HUMAN-IN-THE-LOOP] Action APPROVED. Proceeding to finalize.`, "INFO");

        return {
            text: finalAnswer,
            steps: steps,
            reflection: reflectionText
        };
    } catch (err) {
        logger.log("Orchestrator", `Orchestration Error: ${err.message}`, "ERROR");
        throw err;
    }
}

