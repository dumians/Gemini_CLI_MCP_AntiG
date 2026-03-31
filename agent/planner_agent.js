import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import { AgentRegistry } from "./utils/catalog.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("planner_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a plan for a complex query.
 * @param {string} query The user query.
 * @param {string} traceId Trace ID for logging.
 * @returns {Promise<Array<{step: number, agent: string, subQuery: string}>>}
 */
export async function generatePlan(query, traceId = null) {
    logger.log("PlannerAgent", `Generating plan for: ${query}`, "INFO", null, traceId);

    const availableAgents = AgentRegistry.map(a => `- **${a.name}**: Specialist for ${a.domain} domain. Tool: ${a.toolName}`).join('\n');

    const systemInstruction = `You are a Strategic Planner Agent for an enterprise data mesh.
    Your job is to break down complex user queries into a sequence of steps or sub-queries that can be handled by domain-expert agents.
    
    Available Agents:
    ${availableAgents}
    
    Rules:
    1. Output a JSON array of objects representing the plan.
    2. Each object must have: \`step\` (number), \`agent\` (string, matching an available agent name or 'Orchestrator' for final synthesis), and \`subQuery\` (string, the specific query for that agent).
    3. If steps are independent, they can have the same step number or be marked for parallel execution (though the orchestrator will handle execution). Try to order them logically.
    4. Provide only the JSON array in your response. No markdown formatting except the JSON block if needed, but preferred pure JSON string.
    
    Example Output:
    [
      { "step": 1, "agent": "FinancialAgent", "subQuery": "Get revenue for Q1" },
      { "step": 1, "agent": "RetailAgent", "subQuery": "Get inventory levels for top products" },
      { "step": 2, "agent": "Orchestrator", "subQuery": "Combine revenue and inventory to find correlation" }
    ]`;

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-2.5-flash",
        systemInstruction,
        generationConfig: { responseMimeType: "application/json" } // Force JSON output
    });

    try {
        const result = await model.generateContent(query);
        const responseText = result.response.text();
        logger.log("PlannerAgent", `Plan generated raw: ${responseText}`, "DEBUG", null, traceId);
        
        const plan = JSON.parse(responseText);
        return plan;
    } catch (err) {
        logger.log("PlannerAgent", `Failed to generate plan: ${err.message}`, "ERROR", null, traceId);
        // Fallback: return a single step plan with the original query for the orchestrator to handle dynamically
        return [
            { step: 1, agent: "DynamicDiscovery", subQuery: query }
        ];
    }
}
