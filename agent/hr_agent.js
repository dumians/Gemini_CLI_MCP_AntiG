import { createAuthenticatedMcpClient } from "./utils/mcp_client_helper.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { configService } from "./utils/config_service.js";
import { groundingInstructions, groundWithCatalogContext } from "./utils/grounding.js";
import { logger } from "./utils/logging_service.js";
import { validateDataProduct } from "./utils/catalog.js";
import { resolveGeminiModel } from "./utils/ai_retry_helper.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("hr_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let hrClient = null;

async function getHrClient() {
    if (!hrClient) {
        const hrMcpUrl = process.env.HR_MCP_URL || process.env.ORACLE_MCP_URL;
        hrClient = await createAuthenticatedMcpClient("hr-agent-mcp", "node", ["servers/oracle-mcp/index.js"], hrMcpUrl);
    }
    return hrClient;
}

/**
 * HR Agent specialized in Oracle DB @ GCP HR Schema.
 * Handles employee data, recruitment pipelines, and department structures.
 */
export async function handleHRTask(query, meshContext = {}, traceId = null) {
    logger.log("HRAgent", `Processing HR task: ${query}`, "INFO", null, traceId);

    // Connect to Oracle HR MCP (Cached)
    const client = await getHrClient();

    const listResponse = await client.listTools();

    const geminiTools = [
        {
            functionDeclarations: listResponse.tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }))
        }
    ];

    const catalogContext = groundWithCatalogContext("HR");

    const systemInstruction = `You are an HR Data Specialist for the Enterprise Nexus.
    You have access to the Oracle DB @ GCP HR Schema.
    
    ${groundingInstructions}
    
    ${catalogContext}

    Current Mesh Context (Data from other domains):
    ${JSON.stringify(meshContext, null, 2)}

    Use the provided tools to fetch and analyze HR data.`;


    const model = genAI.getGenerativeModel({
        model: resolveGeminiModel(config.model),
        systemInstruction,
        tools: geminiTools
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(query);
    let response = result.response;

    // Handle tool calls
    while (response.functionCalls && response.functionCalls.length > 0) {
        const toolCallParts = [];
        for (const call of response.functionCalls) {
            const startTime = Date.now();
            logger.logToolCall("HRAgent", call.name, call.args, traceId);

            const toolResult = await client.callTool(call.name, call.args);
            const duration = Date.now() - startTime;
            
            const resultText = toolResult.content[0].text;
            logger.logToolResult("HRAgent", call.name, resultText, duration, traceId);

            toolCallParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: resultText }
                }
            });
        }
        result = await chat.sendMessage(toolCallParts);
        response = result.response;
    }

    const dataProduct = {
        domain: config.domain || "HR",
        data: response.text(),
        metadata: {
            confidence: 0.90,
            source: config.source || "Oracle DB @ GCP (HR)"
        },
        insights: "HR pipeline and employee metrics synthesized using latest Gemini capabilities."
    };

    logger.logResponse("HRAgent", "HR", dataProduct.metadata.confidence, 0, traceId); // Duration not tracked here yet
    return validateDataProduct(dataProduct, 'HRAgent');
}
