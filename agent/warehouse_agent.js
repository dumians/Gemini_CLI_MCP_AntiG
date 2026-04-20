import { GoogleGenerativeAI } from "@google/generative-ai";
import { groundGraphContext, groundingInstructions, groundWithCatalogContext } from "./utils/grounding.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import { memoryBankService } from "./utils/memory_bank_service.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function createMcpClient(serverCmd, serverArgs, remoteUrl = null) {
    const transport = remoteUrl
        ? new SSEClientTransport(new URL(remoteUrl))
        : new StdioClientTransport({ command: serverCmd, args: serverArgs });

    const client = new Client(
        { name: `warehouse-agent-mcp`, version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return client;
}

let warehouseClient = null;

async function getWarehouseClient() {
    if (!warehouseClient) {
        const warehouseMcpUrl = process.env.WAREHOUSE_MCP_URL;
        warehouseClient = await createMcpClient("node", ["servers/oracle-mcp/index.js"], warehouseMcpUrl);
    }
    return warehouseClient;
}

export async function handleWarehouseRequest(query, context = {}, traceId = null) {
    logger.log("WarehouseAgent", `Processing warehouse query: ${query}`, "INFO", null, traceId);
    
    let memoriesContext = "";
    try {
        const memories = await memoryBankService.retrieveMemories('admin', query);
        if (memories && memories.length > 0) {
            memoriesContext = `\n\n[RETRIEVED WAREHOUSE MEMORIES]\n` + memories.map(m => `- ${m.fact}`).join('\n');
            logger.log("WarehouseAgent", `Retrieved ${memories.length} memories`, "INFO", null, traceId);
        }
    } catch (err) {
        logger.log("WarehouseAgent", `Failed to retrieve memories: ${err.message}`, "WARNING", null, traceId);
    }

    if (Object.keys(context).length > 0) {
        logger.log("WarehouseAgent", `Integrated context from: ${Object.keys(context).join(', ')}`, "INFO", null, traceId);
    }

    const client = await getWarehouseClient();
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

    const catalogContext = groundWithCatalogContext("Warehouse");

    const systemInstruction = `You are a Warehouse and Supply Chain Specialist Agent based on the Oracle Agent Java model.
    You have access to the supply chain graph and inventory risk schemas.
    Use standard SQL, Property Graph, and Select AI tools provided for Oracle.
    
    ${groundingInstructions}
    
    ${catalogContext}
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(context, null, 2)}
    ${memoriesContext}
    
    Use this context to enrich your analysis if relevant.`;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
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
            logger.logToolCall("WarehouseAgent", call.name, call.args, traceId);
            
            const toolResult = await client.callTool(call.name, call.args);
            const duration = Date.now() - startTime;
            
            let formattedResult = toolResult.content[0].text;
            logger.logToolResult("WarehouseAgent", call.name, formattedResult, duration, traceId);

            if (call.name.includes("graph")) {
                groundingData.push(formattedResult);
                formattedResult = groundGraphContext("Warehouse", [formattedResult]);
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
        domain: "Warehouse",
        data: response.text(),
        metadata: {
            confidence: 0.95,
            source: "Oracle DB @ GCP (Warehouse/Supply Chain)",
            grounding: groundingData
        },
        insights: "Warehouse supply chain data synthesized with spatial hotspot and graph profiling."
    };
}
