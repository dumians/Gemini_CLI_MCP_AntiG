import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import dotenv from "dotenv";

dotenv.config();

const config = configService.getConfig("analytics_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

export async function handleAnalyticsRequest(query, meshContext = {}, traceId = null) {
    logger.log("AnalyticsAgent", `Processing analytics request: ${query}`, "INFO", null, traceId);
    if (Object.keys(meshContext).length > 0) {
        logger.log("AnalyticsAgent", `Integrated context from: ${Object.keys(meshContext).join(', ')}`, "INFO", null, traceId);
    }

    // Connect to BigQuery MCP (Local or Remote)
    const bqMcpUrl = process.env.BIGQUERY_MCP_URL;
    const bqClient = await createMcpClient("node", [config.bq_mcp_server || "servers/bigquery-mcp/index.js"], bqMcpUrl);
    const bqTools = await bqClient.listTools();
    logger.log("AnalyticsAgent", `BQ Tools found: ${bqTools?.tools?.length || 0}`, "DEBUG", null, traceId);

    // Connect to AlloyDB MCP (Local or Remote)
    const alloydbMcpUrl = process.env.ALLOYDB_MCP_URL;
    const alloydbClient = await createMcpClient("node", [config.alloydb_mcp_server || "servers/alloydb-mcp/index.js"], alloydbMcpUrl);
    const alloydbTools = await alloydbClient.listTools();
    logger.log("AnalyticsAgent", `AlloyDB Tools found: ${alloydbTools?.tools?.length || 0}`, "DEBUG", null, traceId);

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

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-1.5-flash",
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
            logger.logToolCall("AnalyticsAgent", call.name, call.args, traceId);

            const tool = allTools.find(t => t.name === call.name);
            const result = await tool._client.callTool(call.name, call.args);
            const duration = Date.now() - startTime;
            
            const resultText = result.content[0].text;
            logger.logToolResult("AnalyticsAgent", call.name, resultText, duration, traceId);

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
