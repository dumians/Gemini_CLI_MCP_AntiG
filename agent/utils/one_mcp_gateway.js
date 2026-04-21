import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./logging_service.js";
import dotenv from "dotenv";

dotenv.config();

class OneMCPGateway {
    constructor() {
        this.clients = {}; // Cache of MCP clients by server name
        this.domainAccessMap = {
            "Oracle ERP": ["oracle"],
            "Spanner Retail": ["spanner"],
            "BigQuery Analytics": ["bigquery", "alloydb"],
            "Oracle HR": ["oracle_hr"],
            "AlloyDB CRM": ["alloydb"],
            "Warehouse": ["oracle_warehouse"]
        };
    }

    async createTransport(serverConfig) {
        let url = serverConfig.mcpUrl;
        if (url && url.startsWith("process.env.")) {
            const envVar = url.replace("process.env.", "");
            url = process.env[envVar];
        }

        if (url) {
            return new SSEClientTransport(new URL(url));
        } else {
            const path = await import('path');
            const absoluteArgs = (serverConfig.serverArgs || []).map(arg => {
                if (arg.startsWith('servers/')) {
                    const rootDir = process.cwd().endsWith('server') ? path.resolve(process.cwd(), '..') : process.cwd();
                    return path.resolve(rootDir, arg);
                }
                return arg;
            });
            return new StdioClientTransport({
                command: serverConfig.serverCmd || "node",
                args: absoluteArgs
            });
        }
    }

    async connect(serverConfig) {
        const key = serverConfig.name;
        if (!this.clients[key]) {
            logger.log("OneMCPGateway", `Establishing unified transport to: ${key}`, "INFO");
            try {
                const transport = await this.createTransport(serverConfig);
                const client = new Client(
                    { name: `gateway-${key}`, version: "1.0.0" },
                    { capabilities: {} }
                );
                await client.connect(transport);
                this.clients[key] = client;
                logger.log("OneMCPGateway", `Successfully connected to MCP server: ${key}`, "INFO");
            } catch (error) {
                logger.log("OneMCPGateway", `Failed to connect to ${key}: ${error.stack || error.message}`, "ERROR");
                throw error;
            }
        }
        return this.clients[key];
    }

    /**
     * Lists tools accessible to a specific domain (Zero-Trust Access Control).
     */
    async listTools(domain, mcpServers = []) {
        const allowedServers = this.domainAccessMap[domain] || [];
        const tools = [];

        for (const serverConfig of mcpServers) {
            // Enforce Gateway routing based on domain scope
            if (allowedServers.includes(serverConfig.name) || allowedServers.length === 0) {
                try {
                    const client = await this.connect(serverConfig);
                    const listResponse = await client.listTools();
                    if (listResponse && listResponse.tools) {
                        for (const t of listResponse.tools) {
                            tools.push({
                                ...t,
                                _client: client,
                                _serverName: serverConfig.name
                            });
                        }
                    }
                } catch (error) {
                    logger.log("OneMCPGateway", `Warning: Skipping tools for ${serverConfig.name}`, "WARNING");
                }
            } else {
                logger.log("OneMCPGateway", `Governance block: Domain '${domain}' cannot access server '${serverConfig.name}'`, "WARNING");
            }
        }

        return tools;
    }

    async callTool(tool, args, traceId = null) {
        const startTime = Date.now();
        logger.log("OneMCPGateway", `Executing tool ${tool.name} via gateway`, "DEBUG", null, traceId);
        try {
            const result = await tool._client.callTool(tool.name, args);
            logger.log("OneMCPGateway", `Tool ${tool.name} executed successfully in ${Date.now() - startTime}ms`, "INFO", null, traceId);
            return result;
        } catch (error) {
            logger.log("OneMCPGateway", `Tool execution failed: ${error.stack || error.message}`, "ERROR", null, traceId);
            throw error;
        }
    }
}

export const gateway = new OneMCPGateway();
