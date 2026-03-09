import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Spanner } from "@google-cloud/spanner";

const server = new Server(
    {
        name: "spanner-mcp",
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
                name: "query_spanner_sql",
                description: "Execute a standard SQL query against Spanner Global Retail DB.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "query_spanner_graph",
                description: "Execute a Spanner Graph (GQL) query to find supply chain dependencies across global stores.",
                inputSchema: {
                    type: "object",
                    properties: {
                        gql_match: { type: "string" },
                    },
                    required: ["gql_match"],
                },
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "query_spanner_sql") {
        return {
            content: [{ type: "text", text: `Simulated Spanner SQL result for: ${args.query}\n[{ "store_id": "NYC-01", "stock_level": 4500 }]` }]
        };
    } else if (name === "query_spanner_graph") {
        return {
            content: [{ type: "text", text: `Simulated Spanner GQL result for: ${args.gql_match}\n[{ "path": ["SupplierA", "WarehouseB", "Store NYC-01"] }]` }]
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Spanner MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
