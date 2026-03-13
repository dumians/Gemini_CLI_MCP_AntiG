import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AlloyDBAuth } from "@google-cloud/alloydb-auth-library";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// GCP AlloyDB Configuration
const auth = new AlloyDBAuth({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.ALLOYDB_REGION,
    cluster: process.env.ALLOYDB_CLUSTER,
});

const server = new Server(
    {
        name: "alloydb-mcp",
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
                name: "query_alloydb_vector",
                description: "Execute a pgvector query against AlloyDB to find similar items (e.g., support tickets).",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                    },
                    required: ["query"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "query_alloydb_vector") {
        let client;
        try {
            console.error(`[AlloyDB-MCP] Executing Vector SQL: ${args.query}`);
            const { ipAddress } = await auth.getIpAddress(process.env.ALLOYDB_INSTANCE);
            
            client = new pg.Client({
                user: process.env.ALLOYDB_USER,
                password: process.env.ALLOYDB_PASSWORD,
                database: process.env.ALLOYDB_DB,
                host: ipAddress,
                port: 5432,
                ssl: await auth.getSslCertificates(),
            });

            await client.connect();
            const res = await client.query(args.query);
            await client.end();

            return {
                content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }]
            };
        } catch (error) {
            console.error(`[AlloyDB-MCP] Error calling tool '${name}':`, error);
            if (client) await client.end();
            return {
                content: [{
                    type: "text",
                    text: `Error executing AlloyDB query: ${error.message}`
                }]
            };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const requiredVars = ['GCP_PROJECT_ID', 'ALLOYDB_REGION', 'ALLOYDB_CLUSTER', 'ALLOYDB_INSTANCE', 'ALLOYDB_USER', 'ALLOYDB_PASSWORD', 'ALLOYDB_DB'];
    for (const v of requiredVars) {
        if (!process.env[v]) {
            console.error(`${v} environment variable not set. Exiting.`);
            process.exit(1);
        }
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AlloyDB MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
