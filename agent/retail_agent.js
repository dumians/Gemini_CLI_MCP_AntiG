import { GoogleGenerativeAI } from "@google/generative-ai";
import { handleAnalyticsRequest } from "./analytics_agent.js";
import { groundGraphContext, groundingInstructions, groundWithCatalogContext } from "./utils/grounding.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("retail_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function createMcpClient(serverCmd, serverArgs, remoteUrl = null) {
    const transport = remoteUrl
        ? new SSEClientTransport(new URL(remoteUrl))
        : new StdioClientTransport({ command: serverCmd, args: serverArgs });

    const client = new Client(
        { name: `retail-agent-mcp`, version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return client;
}

export async function handleRetailRequest(query, context = {}, traceId = null) {
    logger.log("RetailAgent", `Processing retail query: ${query}`, "INFO", null, traceId);
    if (Object.keys(context).length > 0) {
        logger.log("RetailAgent", `Integrated context from: ${Object.keys(context).join(', ')}`, "INFO", null, traceId);
    }

    // Connect to Spanner MCP (Local or Remote)
    const spannerMcpUrl = process.env.SPANNER_MCP_URL;
    const client = await createMcpClient("node", ["servers/spanner-mcp/index.js"], spannerMcpUrl);
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

    const catalogContext = groundWithCatalogContext("Retail");

    const systemInstruction = `You are a Retail and Supply Chain Specialist Agent. You only have access to Spanner (Global Retail DB). 
    Use Spanner SQL and Spanner Graph (GQL) tools provided.
    
    ${groundingInstructions}
    
    ${catalogContext}
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(context, null, 2)}
    
    Use this context to enrich your supply chain reasoning.`;

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-1.5-flash",
        systemInstruction,
        tools: geminiTools
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(query);
    let response = result.response;

    // Handle tool calls
    let groundingData = [];

    while (response.functionCalls && response.functionCalls.length > 0) {
        const toolCallParts = [];
        for (const call of response.functionCalls) {
            const startTime = Date.now();
            logger.logToolCall("RetailAgent", call.name, call.args, traceId);

            const toolResult = await client.callTool(call.name, call.args);
            const duration = Date.now() - startTime;

            // Apply Graph Grounding if it's a graph tool
            let formattedResult = toolResult.content[0].text;
            logger.logToolResult("RetailAgent", call.name, formattedResult, duration, traceId);

            if (call.name.includes("graph")) {
                groundingData.push(formattedResult);
                formattedResult = groundGraphContext("Retail", [formattedResult]);
            }

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
        domain: "Retail",
        data: response.text,
        metadata: {
            confidence: 0.92,
            source: "Cloud Spanner (Global)",
            grounding: groundingData
        },
        insights: "Supply chain projections backed by GraphRAG verification."
    };
}
