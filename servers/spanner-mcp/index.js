import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Spanner } from "@google-cloud/spanner";
import dotenv from "dotenv";

dotenv.config();

// GCP Spanner Configuration
const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const instanceId = process.env.SPANNER_INSTANCE_ID || process.env.SPANNER_INSTANCE;
const databaseId = process.env.SPANNER_DATABASE_ID || process.env.SPANNER_DATABASE;

const spanner = (projectId && process.env.NODE_ENV !== 'test') ? new Spanner({ projectId }) : null;

const getDb = () => {
    if (spanner && instanceId && databaseId) {
        return spanner.instance(instanceId).database(databaseId);
    }
    return null;
};

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
    const db = getDb();
    const isTest = process.env.NODE_ENV === 'test';

    if (!db || isTest) {
        // FALLBACK TO SIMULATION
        if (name === "query_spanner_sql") {
            const query = args.query || args.sql || "";
            return {
                content: [{ type: "text", text: `Simulated Spanner SQL result for: ${query}\n[{ "store_id": "NYC-01", "stock_level": 4500 }]` }]
            };
        } else if (name === "query_spanner_graph") {
            const gql = args.gql_match || args.query || "";
            return {
                content: [{ type: "text", text: `Simulated Spanner GQL result for: ${gql}\n[{ "path": ["SupplierA", "WarehouseB", "Store NYC-01"] }]` }]
            };
        }
    }

    try {
        if (name === "query_spanner_sql") {
            console.error(`[Spanner-MCP] Executing SQL: ${args.query}`);
            const [rows] = await db.run(args.query);
            const results = rows.map(row => row.toJSON());
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        } else if (name === "query_spanner_graph") {
            console.error(`[Spanner-MCP] Executing Graph (GQL): ${args.gql_match}`);
            const [rows] = await db.run(args.gql_match);
            const results = rows.map(row => row.toJSON());
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        }
    } catch (error) {
        console.error(`[Spanner-MCP] Error calling tool '${name}':`, error);
        return {
            content: [{
                type: "text",
                text: `Error executing Spanner query: ${error.message}`
            }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

import { fileURLToPath } from "url";

export { server };

async function run() {
    if (import.meta.url === fileURLToPath(`file:///${process.argv[1].replace(/\\/g, '/')}`)) {
        if (!projectId || !instanceId || !databaseId) {
            console.error("Spanner environment variables not fully set. Running in simulation mode if tools are called.");
        }
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Spanner MCP Server running in stdio mode");
    }
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
