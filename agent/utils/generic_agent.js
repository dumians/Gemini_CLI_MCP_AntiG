import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./logging_service.js";
import { groundGraphContext, groundingInstructions, groundWithCatalogContext } from "./grounding.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GenericAgent {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.domain = config.domain;
        this.systemInstruction = config.systemInstruction || "";
        this.mcpServers = config.mcpServers || []; // Array of { name, mcpUrl, serverCmd, serverArgs }
        this.groundingDomain = config.groundingDomain || config.domain;
        
        // Transport Singletons cache
        this.clientInstances = {};
    }

    async createMcpClient(serverCmd, serverArgs, remoteUrl = null) {
        const transport = remoteUrl
            ? new SSEClientTransport(new URL(remoteUrl))
            : new StdioClientTransport({ command: serverCmd, args: serverArgs });

        const client = new Client(
            { name: `${this.id}-mcp`, version: "1.0.0" },
            { capabilities: {} }
        );

        await client.connect(transport);
        return client;
    }

    async getClient(serverConfig) {
        const key = serverConfig.mcpUrl || serverConfig.serverArgs?.join('-') || serverConfig.name;
        if (!this.clientInstances[key]) {
            // Resolve URLs from environment if needed
            let url = serverConfig.mcpUrl;
            if (url && url.startsWith("process.env.")) {
                const envVar = url.replace("process.env.", "");
                url = process.env[envVar];
            }

            logger.log(this.name, `Connecting to MCP server ${serverConfig.name}`, "DEBUG");
            this.clientInstances[key] = await this.createMcpClient(
                serverConfig.serverCmd || "node",
                serverConfig.serverArgs || [],
                url
            );
        }
        return this.clientInstances[key];
    }

    async process(query, meshContext = {}, traceId = null) {
        logger.log(this.name, `Processing query: ${query}`, "INFO", null, traceId);

        // 1. Connect to all MCP servers and fetch tools
        const allTools = [];
        const clientMappings = []; // Store link to client for execution mapping

        for (const serverConfig of this.mcpServers) {
            try {
                const client = await this.getClient(serverConfig);
                const listResponse = await client.listTools();
                const tools = listResponse.tools || [];
                
                for (const t of tools) {
                    allTools.push({
                        ...t,
                        _client: client // Reference for loop call dispatch
                    });
                }
            } catch (err) {
                logger.log(this.name, `Failed to fetch tools from server ${serverConfig.name}: ${err.message}`, "WARNING", null, traceId);
            }
        }

        if (allTools.length === 0) {
            throw new Error(`No tools available for ${this.name}. Check MCP server connectivity.`);
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

        const catalogContext = groundWithCatalogContext(this.groundingDomain);

        const finalInstruction = `${this.systemInstruction}
        
        ${groundingInstructions}
        
        ${catalogContext}
        
        Current Mesh Context (Data from other domains):
        ${JSON.stringify(meshContext, null, 2)}
        
        Use this context to enrich your analysis if relevant.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Default mapping fallback
            systemInstruction: finalInstruction,
            tools: geminiTools
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(query);
        let response = result.response;

        let groundingData = [];

        // Tool Call Iteration Dispatch loops
        while (response.functionCalls && response.functionCalls.length > 0) {
            const toolCallParts = [];
            for (const call of response.functionCalls) {
                const startTime = Date.now();
                logger.logToolCall(this.name, call.name, call.args, traceId);

                const tool = allTools.find(t => t.name === call.name);
                if (!tool) {
                     throw new Error(`Gemini called unknown tool: ${call.name}`);
                }

                const toolResult = await tool._client.callTool(call.name, call.args);
                const duration = Date.now() - startTime;

                let formattedResult = toolResult.content[0].text;
                logger.logToolResult(this.name, call.name, formattedResult, duration, traceId);

                if (call.name.includes("graph")) {
                    groundingData.push(formattedResult);
                    formattedResult = groundGraphContext(this.groundingDomain, [formattedResult]);
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
            domain: this.domain,
            data: response.text,
            metadata: {
                confidence: 0.95,
                source: this.name,
                grounding: groundingData
            },
            insights: `${this.name} analysis complete.`
        };
    }
}

export default GenericAgent;
