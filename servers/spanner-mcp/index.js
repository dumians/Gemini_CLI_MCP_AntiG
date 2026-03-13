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
const spanner = new Spanner({ projectId: process.env.GCP_PROJECT_ID });
const instance = spanner.instance(process.env.SPANNER_INSTANCE_ID || 'global-retail-instance');
const database = instance.database(process.env.SPANNER_DATABASE_ID || 'global-retail-db');

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

    try {
        if (name === "query_spanner_sql") {
            console.error(`[Spanner-MCP] Executing SQL: ${args.query}`);
            const [rows] = await database.run(args.query);
            const results = rows.map(row => row.toJSON());
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        } else if (name === "query_spanner_graph") {
            // Note: Spanner Graph is a preview feature and might require specific client library versions or query syntax.
            // This example uses standard SQL to query graph-like relationships, which is a common pattern.
            // The agent's prompt should be engineered to generate a valid SQL query for this tool.
            console.error(`[Spanner-MCP] Executing Graph (SQL): ${args.gql_match}`);
            const [rows] = await database.run(args.gql_match);
            const results = rows.map(row => row.toJSON());
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        }
    } catch (error) {
        console.error(`[Spanner-MCP] Error calling tool '${name}':`, error);
        // Return a structured error message to the agent
        return {
            content: [{
                type: "text",
                text: `Error executing Spanner query: ${error.message}`
            }]
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    if (!process.env.GCP_PROJECT_ID) {
        console.error("GCP_PROJECT_ID environment variable not set. Exiting.");
        process.exit(1);
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Spanner MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
