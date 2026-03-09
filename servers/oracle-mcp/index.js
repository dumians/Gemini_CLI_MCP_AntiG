import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import oracledb from "oracledb";

const server = new Server(
    {
        name: "oracle-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// We define tools that the agent can call
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_oracle_sql",
                description: "Execute a standard SQL query against the ERP Oracle DB (e.g. Purchase Orders, Invoices).",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "query_oracle_graph",
                description: "Execute an Oracle Graph query to find complex supplier networks.",
                inputSchema: {
                    type: "object",
                    properties: {
                        match_clause: { type: "string" },
                    },
                    required: ["match_clause"],
                },
            },
            {
                name: "query_oracle_vector",
                description: "Execute an Oracle AI Vector Search against transaction metadata.",
                inputSchema: {
                    type: "object",
                    properties: {
                        search_term: { type: "string" },
                    },
                    required: ["search_term"],
                },
            }
        ],
    };
});

// Tool execution logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "query_oracle_sql") {
        // In a real environment, we would connect to Oracle via ADC
        return {
            content: [{ type: "text", text: `Simulated Oracle SQL result for: ${args.query}\n[{ "supplier_id": 1001, "total_invoices": 50000 }]` }]
        };
    } else if (name === "query_oracle_graph") {
        return {
            content: [{ type: "text", text: `Simulated Oracle Graph result for: ${args.match_clause}\n[{ "network_depth": 3, "connected_entities": ["SupplierA", "SupplierC"] }]` }]
        };
    } else if (name === "query_oracle_vector") {
        return {
            content: [{ type: "text", text: `Simulated Oracle Vector Search result for: ${args.search_term}\n[{ "metadata": "High value anomaly detected", "distance": 0.12 }]` }]
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Oracle MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
