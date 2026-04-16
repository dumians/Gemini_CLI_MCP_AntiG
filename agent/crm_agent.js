import { GoogleGenerativeAI } from "@google/generative-ai";
import { groundGraphContext, groundingInstructions, groundWithCatalogContext } from "./utils/grounding.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("crm_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function createMcpClient(serverCmd, serverArgs, remoteUrl = null) {
    const transport = remoteUrl
        ? new SSEClientTransport(new URL(remoteUrl))
        : new StdioClientTransport({ command: serverCmd, args: serverArgs });

    const client = new Client(
        { name: `crm-agent-mcp`, version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return client;
}

let alloyClient = null;

async function getAlloyClient() {
    if (!alloyClient) {
        const alloyMcpUrl = process.env.ALLOYDB_MCP_URL;
        alloyClient = await createMcpClient("node", ["servers/alloydb-mcp/index.js"], alloyMcpUrl);
    }
    return alloyClient;
}

export async function handleCRMRequest(query, context = {}, traceId = null) {
    logger.log("CRMAgent", `Processing CRM query: ${query}`, "INFO", null, traceId);

    const client = await getAlloyClient();
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

    const catalogContext = groundWithCatalogContext("Analytics"); // Using Analytics as fallback for CRM if not split in catalog

    const systemInstruction = `You are a Customer Relationship Management (CRM) Specialist Agent. You only have access to AlloyDB (Customer DB). 
    Use the tools provided to query customer profiles, transactions, and sentiment data.
    
    ${groundingInstructions}
    
    ${catalogContext}
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(context, null, 2)}`;

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-1.5-flash",
        systemInstruction,
        tools: geminiTools
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(query);
    let response = result.response;

    let groundingData = [];

    while (response.functionCalls && response.functionCalls.length > 0) {
        const toolCallParts = [];
        for (const call of response.functionCalls) {
            const startTime = Date.now();
            logger.logToolCall("CRMAgent", call.name, call.args, traceId);

            const toolResult = await client.callTool(call.name, call.args);
            const duration = Date.now() - startTime;

            let formattedResult = toolResult.content[0].text;
            logger.logToolResult("CRMAgent", call.name, formattedResult, duration, traceId);

            toolCallParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: formattedResult }
                }
            });
        }
        result = await chat.sendMessage(toolCallParts);
        response = result.response;
    }

    return {
        domain: "CRM",
        data: response.text(),
        metadata: {
            confidence: 0.90,
            source: "AlloyDB CRM",
            grounding: groundingData
        },
        insights: "CRM insights derived from AlloyDB telemetry."
    };
}
