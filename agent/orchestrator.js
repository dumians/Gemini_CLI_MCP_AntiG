import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { handleFinancialRequest } from "./financial_agent.js";
import { handleRetailRequest } from "./retail_agent.js";
import { handleAnalyticsRequest } from "./analytics_agent.js";
import { handleHRTask } from "./hr_agent.js";
import { validateDataProduct, getDiscoveryTools } from "./utils/catalog.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";

dotenv.config();

const config = configService.getConfig("orchestrator");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = config.system_instruction_prefix + `
  Your job is to receive complex queries and delegate them to domain-expert agents registered in our **Agentic Catalog**.
  
  **Autonomous Discovery & Governance**:
  - You interact with agents that return formal 'Data Products'.
  - Every product is automatically validated against a 'Data Contract'.
  - You maintain a shared 'Mesh Context' to enable Cross-Domain Intelligence.
  
  **Domain Experts**:
  - FinancialAgent (Finance)
  - RetailAgent (Retail)
  - AnalyticsAgent (Analytics)
  - HRAgent (HR)
  
  Break down the user query and call the appropriate tools. Correlate insights to provide a strategic synthesis.`;

const geminiTools = getDiscoveryTools();

/**
 * Executes a query through the A2A Orchestrator.
 * @param {string} query The user query.
 * @returns {Promise<{text: string, steps: Array<{agent: string, query: string, result: any}>}>}
 */
export async function askOrchestrator(query) {
    logger.log("Orchestrator", `Received query: ${query}`, "INFO");
    const model = ai.getGenerativeModel({
        model: config.model || "gemini-3.1-flash-preview",
        systemInstruction,
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
                let agentResult = "";
                let agentName = "";

                if (call.name === "call_financial_agent") {
                    agentName = "FinancialAgent";
                    logger.log("Orchestrator", `Delegating to ${agentName}`, "REASONING");
                    const rawResult = await handleFinancialRequest(call.args.query, meshContext);
                    agentResult = validateDataProduct(rawResult, agentName);
                } else if (call.name === "call_retail_agent") {
                    agentName = "RetailAgent";
                    const rawResult = await handleRetailRequest(call.args.query, meshContext);
                    agentResult = validateDataProduct(rawResult, agentName);
                } else if (call.name === "call_analytics_agent") {
                    agentName = "AnalyticsAgent";
                    const rawResult = await handleAnalyticsRequest(call.args.query, meshContext);
                    agentResult = validateDataProduct(rawResult, agentName);
                } else if (call.name === "call_hr_agent") {
                    agentName = "HRAgent";
                    const rawResult = await handleHRTask(call.args.query, meshContext);
                    agentResult = validateDataProduct(rawResult, agentName);
                }

                // Update Mesh Context with this agent's insights for subsequent calls
                meshContext[agentName] = {
                    insights: agentResult.insights,
                    summary: agentResult.data.substring(0, 200) // Keep context concise
                };

                steps.push({
                    agent: agentName,
                    query: call.args.query,
                    result: agentResult
                });

                toolCallParts.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: agentResult }
                    }
                });
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
        console.error("Orchestration Error:", err);
        throw err;
    }
}
