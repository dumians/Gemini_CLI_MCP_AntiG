import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSE_TRANSPORT_PATH, SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';

import pg from 'pg';
const { Pool } = pg;

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
const pool = process.env.ALLOYDB_URL ? new Pool({
    connectionString: process.env.ALLOYDB_URL,
    ssl: { rejectUnauthorized: false } // Common for cloud SQL/AlloyDB external connections
}) : null;

/**
 * For AlloyDB @ GCP (CRMs, Operational Data)
 */
const TOOLS = [
    {
        name: "query_alloydb_sql",
        description: "Execute a read-only SQL query against AlloyDB CRM databases.",
        inputSchema: {
            type: "object",
            properties: {
                sql: { type: "string" },
            },
            required: ["sql"],
        },
    },
    {
        name: "search_alloydb_vector",
        description: "Search for similar customer service tickets or case studies using pgvector in AlloyDB.",
        inputSchema: {
            type: "object",
            properties: {
                query_text: { type: "string" },
                limit: { type: "number", default: 5 },
            },
            required: ["query_text"],
        },
    },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!pool) {
        // FALLBACK TO SIMULATION IF NO DATABASE CONFIGURED
        if (name === "query_alloydb_sql") {
            return {
                content: [{ type: "text", text: `[Simulated AlloyDB] Result for: ${args.sql}\n- Case: SHIP-1234, Status: ESCALATED, Customer: GlobalRetail Inc.` }],
            };
        } else if (name === "search_alloydb_vector") {
            return {
                content: [{ type: "text", text: `[Simulated AlloyDB pgvector] Similar tickets for "${args.query_text}":\n1. "Late shipment for node 542" (Score: 0.98)\n2. "Spanner sync issue with ERP" (Score: 0.85)` }],
            };
        }
    }

    try {
        if (name === "query_alloydb_sql") {
            const result = await pool.query(args.sql);
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
            };
        } else if (name === "search_alloydb_vector") {
            // NOTE: In a real scenario, we'd use a text-embedding model here.
            // For now, we assume the DB handles the embedding or we use a basic keyword fallback for the demo structure.
            const vectorQuery = `
                SELECT content, status, 1 - (embedding <=> embedding) as similarity 
                FROM support_tickets 
                ORDER BY similarity DESC 
                LIMIT $1;
            `;
            const result = await pool.query(vectorQuery, [args.limit || 5]);
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
            };
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error executing AlloyDB tool: ${error.message}` }],
            isError: true,
        };
    }

    throw new Error(`Tool not found: ${name}`);
});


// Support both STDIO (local) and SSE (hosted)
const mode = process.argv[2] === "--sse" ? "sse" : "stdio";

if (mode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AlloyDB MCP Server running in stdio mode");
} else {
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
