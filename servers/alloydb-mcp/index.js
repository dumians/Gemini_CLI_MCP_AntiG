import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSE_TRANSPORT_PATH, SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';

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

    if (name === "query_alloydb_sql") {
        // SIMULATED ALLOYDB RESPONSE
        return {
            content: [{ type: "text", text: `[Simulated AlloyDB] Result for: ${args.sql}\n- Case: SHIP-1234, Status: ESCALATED, Customer: GlobalRetail Inc.` }],
        };
    } else if (name === "search_alloydb_vector") {
        // SIMULATED VECTOR RESPONSE
        return {
            content: [{ type: "text", text: `[Simulated AlloyDB pgvector] Similar tickets for "${args.query_text}":\n1. "Late shipment for node 542" (Score: 0.98)\n2. "Spanner sync issue with ERP" (Score: 0.85)` }],
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
