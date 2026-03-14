import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import { AlloyDBAuth } from "@google-cloud/alloydb-auth-library";
import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;
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

// Database Connection
const pool = (process.env.ALLOYDB_URL && process.env.NODE_ENV !== 'test') ? new Pool({
    connectionString: process.env.ALLOYDB_URL,
    ssl: { rejectUnauthorized: false }
}) : null;

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
        const canConnect = pool || (process.env.ALLOYDB_INSTANCE && process.env.ALLOYDB_USER);
        if (!canConnect) {
            return {
                content: [{ type: "text", text: `Simulated AlloyDB Vector result for: ${args.query}\n[{ "ticket_id": 1, "similarity": 0.98 }]` }]
            };
        }
        let client;
        try {
            console.error(`[AlloyDB-MCP] Executing Vector SQL: ${args.query}`);
            
            // Use pool if available, otherwise create a manual client
            if (pool) {
                const res = await pool.query(args.query);
                return {
                    content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }]
                };
            }

            // Manual connection via AlloyDB Auth Proxy library logic
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
            if (client) {
                try { await client.end(); } catch (e) { /* ignore */ }
            }
            return {
                content: [{
                    type: "text",
                    text: `Error executing AlloyDB query: ${error.message}`
                }],
                isError: true,
            };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});



import { fileURLToPath } from "url";

export { server };

async function run() {
    // Support both STDIO (local) and SSE (hosted)
const mode = process.argv[2] === "--sse" ? "sse" : "stdio";

    const requiredVars = ['GCP_PROJECT_ID', 'ALLOYDB_REGION', 'ALLOYDB_CLUSTER', 'ALLOYDB_INSTANCE', 'ALLOYDB_USER', 'ALLOYDB_PASSWORD', 'ALLOYDB_DB'];
    for (const v of requiredVars) {
             if (!process.env[v]) {
            console.error(`${v} environment variable not set. Exiting.`);
            process.exit(1);
        }
    }

    if (import.meta.url === fileURLToPath(`file:///${process.argv[1].replace(/\\/g, '/')}`)) {
        const requiredVars = ['GCP_PROJECT_ID', 'ALLOYDB_REGION', 'ALLOYDB_CLUSTER', 'ALLOYDB_INSTANCE', 'ALLOYDB_USER', 'ALLOYDB_PASSWORD', 'ALLOYDB_DB'];
        const missingVars = requiredVars.filter(v => !process.env[v]);
        
        if (missingVars.length > 0 && !process.env.ALLOYDB_URL) {
            console.error(`Missing environment variables: ${missingVars.join(', ')}. Running in simulation mode if tools are called.`);
        }
if (mode === "stdio") 
    {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("AlloyDB MCP Server running on stdio");
    }
} 
else 
{
    const app = express();
    let transport;

    app.get("/sse", async (req, res) => {
        transport = new SSEServerTransport(SSE_TRANSPORT_PATH, res);
        await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
        if (transport) {
            await transport.handlePostMessage(req, res);
        }
    });
 
    const port = process.env.PORT || 8084;
    app.listen(port, () => {
        console.error(`AlloyDB MCP Server running on port ${port} (SSE)`);
    });
}   

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
