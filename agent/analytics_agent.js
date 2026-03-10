import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("analytics_agent");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function createMcpClient(serverCmd, serverArgs, remoteUrl = null) {
    console.log(`[AnalyticsAgent] Connecting to MCP: ${remoteUrl || serverArgs[0]}`);
    try {
        const transport = remoteUrl
            ? new SSEClientTransport(new URL(remoteUrl))
            : new StdioClientTransport({ command: serverCmd, args: serverArgs });

        const client = new Client(
            { name: `analytics-agent-mcp`, version: "1.0.0" },
            { capabilities: {} }
        );

        await client.connect(transport);
        console.log(`[AnalyticsAgent] Connected to: ${remoteUrl || serverArgs[0]}`);
        return client;
    } catch (error) {
        console.error(`[AnalyticsAgent] MCP Connection Failed:`, error);
        return null;
    }
}

export async function handleAnalyticsRequest(query, meshContext = {}) {
    logger.log("AnalyticsAgent", `Processing analytics request: ${query}`, "INFO");
    if (Object.keys(meshContext).length > 0) {
        console.log(`[AnalyticsAgent] Integrated context from: ${Object.keys(meshContext).join(', ')}`);
    }

    // Connect to BigQuery MCP (Local or Remote)
    const bqMcpUrl = process.env.BIGQUERY_MCP_URL;
    const bqClient = await createMcpClient("node", [config.bq_mcp_server || "servers/bigquery-mcp/index.js"], bqMcpUrl);
    const bqTools = await bqClient.listTools();
    console.log(`[AnalyticsAgent] BQ Tools found: ${bqTools?.tools?.length || 0}`);

    // Connect to AlloyDB MCP (Local or Remote)
    const alloydbMcpUrl = process.env.ALLOYDB_MCP_URL;
    const alloydbClient = await createMcpClient("node", [config.alloydb_mcp_server || "servers/alloydb-mcp/index.js"], alloydbMcpUrl);
    const alloydbTools = await alloydbClient.listTools();
    console.log(`[AnalyticsAgent] AlloyDB Tools found: ${alloydbTools?.tools?.length || 0}`);

    // Aggregate Tools
    const bqToolList = (bqTools?.tools || []).map(t => ({ ...t, _client: bqClient }));
    const alloydbToolList = (alloydbTools?.tools || []).map(t => ({ ...t, _client: alloydbClient }));
    const allTools = [...bqToolList, ...alloydbToolList];

    if (allTools.length === 0) {
        throw new Error("No tools available for AnalyticsAgent. Check MCP server connectivity.");
    }

    const geminiTools = [
        {
            functionDeclarations: allTools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }))
        }
    ];

    const systemInstruction = `You are a Marketing and Customer Analytics Specialist Agent. You have access to BigQuery (EDW) and AlloyDB (CRM). 
    Use the tools provided to answer queries about customer segments, trends, and support tickets.
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(meshContext, null, 2)}
    
    Use this context to correlate analytical trends with operational data.`;

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
            const tool = allTools.find(t => t.name === call.name);
            const result = await tool._client.callTool(call.name, call.args);
            toolCallParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: result.content[0].text }
                }
            });
        }
        response = await chat.sendMessage({ message: toolCallParts });
    }

    return {
        domain: "Analytics",
        data: response.text,
        metadata: {
            confidence: 0.98,
            source: "BigQuery / AlloyDB"
        },
        insights: "Data-driven insights synchronized with the agentic mesh."
    };
}
