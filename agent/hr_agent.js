import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { GoogleGenAI } from "@google/genai";
import { configService } from "./utils/config_service.js";
import { groundingInstructions, groundWithCatalogContext } from "./utils/grounding.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("hr_agent");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ... (createMcpClient remains same)

/**
 * HR Agent specialized in Oracle DB @ GCP HR Schema.
 * Handles employee data, recruitment pipelines, and department structures.
 */
export async function handleHRTask(query, meshContext = {}) {
    console.log(`[HRAgent] Processing request: ${query}`);

    // Connect to Oracle HR MCP (Local or Remote)
    const hrMcpUrl = process.env.HR_MCP_URL || process.env.ORACLE_MCP_URL;
    const client = await createMcpClient("node", ["servers/oracle-mcp/index.js"], hrMcpUrl);

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


    const chat = ai.chats.create({
        model: config.model || "gemini-3.1-flash-preview",
        config: {
            systemInstruction,
            tools: geminiTools
        }
    });

    let response = await chat.sendMessage({ message: query });

    // Handle tool calls
    while (response.functionCalls && response.functionCalls.length > 0) {
        const toolCallParts = [];
        for (const call of response.functionCalls) {
            const toolResult = await client.callTool(call.name, call.args);
            toolCallParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: toolResult.content[0].text }
                }
            });
        }
        response = await chat.sendMessage({ message: toolCallParts });
    }

    return {
        domain: config.domain || "HR",
        data: response.text,
        metadata: {
            confidence: 0.90,
            source: config.source || "Oracle DB @ GCP (HR)"
        },
        insights: "HR pipeline and employee metrics synthesized using latest Gemini capabilities."
    };
}
