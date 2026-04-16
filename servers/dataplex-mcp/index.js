import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { dataplex } from "../../agent/utils/dataplex.js";
import { DataplexAgent } from "../../agent/dataplex_agent.js";
import dotenv from "dotenv";
import express from 'express';

dotenv.config();

const dataplexAgent = new DataplexAgent();

const server = new Server(
    {
        name: "dataplex-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "create_policy",
                description: "Create a governance policy in Dataplex.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        status: { type: "string" },
                        domain: { type: "string" },
                        classification: { type: "string" },
                        dataplexAspect: { type: "string" },
                        maskingRule: { type: "string" }
                    },
                    required: ["id", "name", "status", "domain"],
                },
            },
            {
                name: "evaluate_policy",
                description: "Evaluates standard Data Product objects against federated Dataplex policies",
                inputSchema: {
                    type: "object",
                    properties: {
                        domain: { type: "string" },
                        dataProduct: { type: "object" }
                    },
                    required: ["domain", "dataProduct"],
                },
            },
            {
                name: "track_lineage",
                description: "Tracks Data Lineage relationship between source and target entities",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        relationship: { type: "string" }
                    },
                    required: ["source", "target"],
                },
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "create_policy") {
            console.error(`[Dataplex-MCP] Creating Policy: ${args.name}`);
            const result = await dataplex.createGovernancePolicy(args);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        } else if (name === "evaluate_policy") {
            console.error(`[Dataplex-MCP] Evaluating Policy for domain: ${args.domain}`);
            const result = await dataplexAgent.evaluatePolicy(args.domain, args.dataProduct, "mcp-trace");
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        } else if (name === "track_lineage") {
            console.error(`[Dataplex-MCP] Tracking Lineage: ${args.source} -> ${args.target}`);
            const result = await dataplexAgent.trackLineage(args.source, args.target, args.relationship, "mcp-trace");
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    } catch (error) {
        console.error(`[Dataplex-MCP] Error calling tool '${name}':`, error);
        return {
            content: [{
                type: "text",
                text: `Error executing Dataplex tool: ${error.message}`
            }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

const SSE_TRANSPORT_PATH = "/sse";

async function run() {
    let mode = "sse"; // Default to SSE for integration tests
    let port = process.env.PORT || 3007;

    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i] === "--transport" && process.argv[i+1]) {
            mode = process.argv[i+1];
            i++;
        } else if (process.argv[i] === "--port" && process.argv[i+1]) {
            port = parseInt(process.argv[i+1], 10);
            i++;
        }
    }

    if (mode === "stdio") {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Dataplex MCP Server running in stdio mode");
    } else {
        const app = express();
        let transport;

        app.get(SSE_TRANSPORT_PATH, async (req, res) => {
            transport = new SSEServerTransport(SSE_TRANSPORT_PATH, res);
            await server.connect(transport);
        });

        app.post(SSE_TRANSPORT_PATH, async (req, res) => {
            if (transport) {
                await transport.handlePostMessage(req, res);
            }
        });

        app.listen(port, () => {
            console.error(`Dataplex MCP Server running on port ${port} (SSE)`);
        });
    }
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});

export { server };
