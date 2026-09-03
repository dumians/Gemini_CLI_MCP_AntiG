import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "./logging_service.js";
import dotenv from "dotenv";
import { verifyAgentToken } from "./identity_service.js";
import path from "path";
import { GoogleAuth } from "google-auth-library";

dotenv.config();

const gAuth = new GoogleAuth();

/**
 * Enterprise GCP One-MCP Gateway
 * Implements Unified and Microservices Multi-Transport MCP Routing for Google Cloud Data Mesh.
 */
class OneMCPGateway {
    constructor() {
        this.clients = {}; // Cache of MCP clients by server name
        this.runtimeMode = process.env.ONE_MCP_MODE || (process.env.GCP_ONE_MCP_ENABLED === 'true' ? 'unified' : 'microservices');
        
        // Domain to allowed MCP server names mapping
        this.domainAccessMap = {
            "Oracle ERP": ["oracle", "gcp-one-mcp"],
            "Spanner Retail": ["spanner", "gcp-one-mcp", "cloud_api_registry"],
            "BigQuery Analytics": ["bigquery", "alloydb", "gcp-one-mcp", "cloud_api_registry"],
            "Oracle HR": ["oracle_hr", "oracle", "gcp-one-mcp"],
            "AlloyDB CRM": ["alloydb", "gcp-one-mcp"],
            "Warehouse": ["oracle_warehouse", "oracle", "spanner", "gcp-one-mcp"],
            "NetSuite ERP": ["netsuite", "gcp-one-mcp"],
            "Catalog": ["dataplex", "gcp-one-mcp"],
            "Universal": ["*"]
        };

        // Tool keyword filters when operating under unified One-MCP mode
        this.domainToolFilterMap = {
            "Oracle ERP": ["oracle", "read_csv", "get_gcp_services_health"],
            "Spanner Retail": ["spanner", "read_csv", "get_gcp_services_health"],
            "BigQuery Analytics": ["bigquery", "alloydb", "read_csv", "get_gcp_services_health"],
            "Oracle HR": ["oracle", "read_csv", "get_gcp_services_health"],
            "AlloyDB CRM": ["alloydb", "read_csv", "get_gcp_services_health"],
            "Warehouse": ["oracle", "spanner", "read_csv", "get_gcp_services_health"],
            "NetSuite ERP": ["netsuite", "read_csv", "get_gcp_services_health"],
            "Catalog": ["dataplex", "policy", "aspect", "catalog", "get_gcp_services_health"],
            "Universal": ["*"]
        };

        let oneMcpUrl = process.env.ONE_MCP_URL;
        if (oneMcpUrl && oneMcpUrl.startsWith("process.env.")) {
            oneMcpUrl = process.env[oneMcpUrl.replace("process.env.", "")];
        }

        this.unifiedServerConfig = {
            name: "gcp-one-mcp",
            mcpUrl: (oneMcpUrl && oneMcpUrl.startsWith("http")) ? oneMcpUrl : null,
            serverArgs: ["servers/one-mcp/index.js"]
        };

        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            modeSwitches: 0
        };
    }

    /**
     * Get active Gateway operation mode: 'unified' | 'microservices' | 'local' | 'toolbox'
     */
    getMode() {
        return this.runtimeMode;
    }

    /**
     * Update active Gateway operation mode dynamically
     */
    setMode(newMode) {
        const validModes = ['unified', 'microservices', 'local', 'toolbox'];
        if (!validModes.includes(newMode)) {
            throw new Error(`Invalid One-MCP mode: ${newMode}. Must be one of: ${validModes.join(', ')}`);
        }
        const oldMode = this.runtimeMode;
        this.runtimeMode = newMode;
        this.metrics.modeSwitches++;
        logger.log("OneMCPGateway", `Switched One-MCP Gateway mode from '${oldMode}' to '${newMode}'`, "INFO");
        return { success: true, mode: this.runtimeMode, previousMode: oldMode };
    }

    async createTransport(serverConfig) {
        let url = serverConfig.mcpUrl;
        if (url && url.startsWith("process.env.")) {
            const envVar = url.replace("process.env.", "");
            url = process.env[envVar];
        }

        if (url && url.startsWith("http")) {
            const urlObj = new URL(url);
            const requestHeaders = {};
            if (url.includes('run.app')) {
                try {
                    const client = await gAuth.getIdTokenClient(urlObj.origin);
                    const gHeaders = await client.getRequestHeaders();
                    if (gHeaders && gHeaders['Authorization']) {
                        requestHeaders['Authorization'] = gHeaders['Authorization'];
                    }
                } catch (e) {
                    try {
                        const metaRes = await fetch(`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(urlObj.origin)}`, {
                            headers: { 'Metadata-Flavor': 'Google' },
                            signal: AbortSignal.timeout(1500)
                        });
                        if (metaRes.ok) {
                            const token = await metaRes.text();
                            requestHeaders['Authorization'] = `Bearer ${token.trim()}`;
                        }
                    } catch (_) {}
                }
            }
            return new SSEClientTransport(urlObj, {
                requestInit: {
                    headers: requestHeaders
                }
            });
        } else {
            const rootDir = process.cwd().endsWith('server') ? path.resolve(process.cwd(), '..') : process.cwd();
            const absoluteArgs = (serverConfig.serverArgs || []).map(arg => {
                if (arg.startsWith('servers/')) {
                    return path.resolve(rootDir, arg);
                }
                return arg;
            });
            return new StdioClientTransport({
                command: serverConfig.serverCmd || "node",
                args: absoluteArgs,
                env: {
                    ...process.env
                }
            });
        }
    }

    async connect(serverConfig) {
        const key = serverConfig.name;
        if (!this.clients[key]) {
            logger.log("OneMCPGateway", `Establishing transport to MCP server: ${key} [Mode: ${this.runtimeMode}]`, "INFO");
            try {
                const transport = await this.createTransport(serverConfig);
                const client = new Client(
                    { name: `gateway-${key}`, version: "2.0.0" },
                    { capabilities: {} }
                );
                await client.connect(transport);
                this.clients[key] = client;
                logger.log("OneMCPGateway", `Successfully connected to MCP server: ${key}`, "INFO");
            } catch (error) {
                if (serverConfig.mcpUrl && serverConfig.serverArgs) {
                    logger.log("OneMCPGateway", `SSE transport failed for ${key} (${error.message}). Attempting stdio fallback...`, "WARNING");
                    try {
                        const fallbackTransport = await this.createTransport({ ...serverConfig, mcpUrl: null });
                        const client = new Client(
                            { name: `gateway-${key}`, version: "2.0.0" },
                            { capabilities: {} }
                        );
                        await client.connect(fallbackTransport);
                        this.clients[key] = client;
                        logger.log("OneMCPGateway", `Successfully connected via stdio fallback to: ${key}`, "INFO");
                        return this.clients[key];
                    } catch (fallbackErr) {
                        logger.log("OneMCPGateway", `Stdio fallback also failed for ${key}: ${fallbackErr.message}`, "ERROR");
                    }
                }
                logger.log("OneMCPGateway", `Failed to connect to ${key}: ${error.stack || error.message}`, "ERROR");
                throw error;
            }
        }
        return this.clients[key];
    }

    /**
     * Lists tools accessible to a specific domain (Zero-Trust Access Control & Scoping).
     */
    async listTools(domain, mcpServers = [], identityToken = null) {
        if (identityToken) {
            const agentContext = verifyAgentToken(identityToken);
            if (!agentContext) {
                logger.log("OneMCPGateway", `Identity verification failed: invalid token. Access Denied.`, "ERROR");
                return [];
            }
            logger.log("OneMCPGateway", `Identity verified: Agent '${agentContext.agentName}' (${agentContext.serviceAccount}) listing tools for domain '${domain}'.`, "INFO");
        }

        const tools = [];

        // --- UNIFIED GCP ONE-MCP MODE ---
        if (this.runtimeMode === 'unified' || process.env.GCP_ONE_MCP_ENABLED === 'true') {
            try {
                logger.log("OneMCPGateway", `Routing tool discovery through GCP One-MCP Unified Gateway for domain '${domain}'`, "DEBUG");
                const unifiedClient = await this.connect(this.unifiedServerConfig);
                const listResponse = await unifiedClient.listTools();

                if (listResponse && listResponse.tools) {
                    const allowedKeywords = this.domainToolFilterMap[domain] || ["*"];
                    const isUnrestricted = allowedKeywords.includes("*") || !domain;

                    for (const t of listResponse.tools) {
                        const isAllowed = isUnrestricted || allowedKeywords.some(kw => 
                            t.name.toLowerCase().includes(kw.toLowerCase()) || 
                            (t.domain && t.domain.toLowerCase().includes(kw.toLowerCase())) ||
                            (t.service && t.service.toLowerCase().includes(kw.toLowerCase()))
                        );

                        if (isAllowed) {
                            tools.push({
                                ...t,
                                _client: unifiedClient,
                                _serverName: "gcp-one-mcp"
                            });
                        }
                    }
                }
                logger.log("OneMCPGateway", `GCP One-MCP Gateway resolved ${tools.length} scoped tools for domain '${domain}'`, "INFO");
                return tools;
            } catch (err) {
                logger.log("OneMCPGateway", `GCP One-MCP Gateway connection failed: ${err.message}. Falling back to microservices.`, "WARNING");
            }
        }

        // --- MICROSERVICES / INDIVIDUAL MCP MODE ---
        const allowedServers = this.domainAccessMap[domain] || [];

        for (const serverConfig of mcpServers) {
            if (allowedServers.includes(serverConfig.name) || allowedServers.includes("*") || allowedServers.length === 0) {
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

    async callTool(tool, args, traceId = null, identityToken = null) {
        if (identityToken) {
            const agentContext = verifyAgentToken(identityToken);
            if (!agentContext) {
                throw new Error(`Security Exception: Access Denied due to invalid or expired Agent Workload Identity token.`);
            }
            logger.log("OneMCPGateway", `Identity verified: Agent '${agentContext.agentName}' (${agentContext.serviceAccount}) executing tool '${tool.name}'.`, "INFO", null, traceId);
        }
        const startTime = Date.now();
        this.metrics.totalCalls++;

        logger.log("OneMCPGateway", `Executing tool ${tool.name} via gateway [Target: ${tool._serverName || 'gateway'}]`, "DEBUG", null, traceId);
        try {
            const result = await tool._client.callTool({ name: tool.name, arguments: args });
            this.metrics.successfulCalls++;
            logger.log("OneMCPGateway", `Tool ${tool.name} executed successfully in ${Date.now() - startTime}ms`, "INFO", null, traceId);
            return result;
        } catch (error) {
            this.metrics.failedCalls++;
            logger.log("OneMCPGateway", `Tool execution failed: ${error.stack || error.message}`, "ERROR", null, traceId);
            throw error;
        }
    }

    /**
     * Returns real-time health, connected endpoints, and metrics for GCP One-MCP Gateway
     */
    async getGatewayStatus() {
        const connectedServers = Object.keys(this.clients);
        let unifiedToolsCount = 0;

        try {
            if (this.clients['gcp-one-mcp']) {
                const tools = await this.clients['gcp-one-mcp'].listTools();
                unifiedToolsCount = tools?.tools?.length || 0;
            }
        } catch (e) {
            // Ignore error in status probe
        }

        return {
            status: "ONLINE",
            mode: this.runtimeMode,
            gcpOneMcpEnabled: this.runtimeMode === 'unified' || process.env.GCP_ONE_MCP_ENABLED === 'true',
            activeClientsCount: connectedServers.length,
            connectedClients: connectedServers,
            unifiedToolsAvailable: unifiedToolsCount,
            supportedServices: [
                "Google Cloud BigQuery",
                "Google Cloud Spanner",
                "Google Cloud AlloyDB",
                "Oracle Database@Google Cloud",
                "Google Cloud Dataplex (Knowledge Catalog)",
                "Oracle NetSuite ERP (AI Connector)",
                "External REST APIs & CSV Fallbacks"
            ],
            metrics: this.metrics
        };
    }

    /**
     * Closes all active client connections
     */
    async closeAll() {
        for (const [key, client] of Object.entries(this.clients)) {
            try {
                await client.close();
            } catch (e) {
                // ignore
            }
        }
        this.clients = {};
    }
}

export const gateway = new OneMCPGateway();
