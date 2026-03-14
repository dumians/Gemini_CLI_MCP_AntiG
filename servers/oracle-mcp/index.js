import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

// Oracle DB@GCP Configuration
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL,
};

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

const getConnection = async () => {
    if (dbConfig.user && dbConfig.password && dbConfig.connectString && process.env.NODE_ENV !== 'test') {
        try {
            return await oracledb.getConnection(dbConfig);
        } catch (e) {
            console.error("Oracle Connection Error:", e.message);
            return null;
        }
    }
    return null;
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_oracle_sql",
                description: "Execute a standard SQL query against the Oracle ERP database.",
                inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
            },
            {
                name: "query_oracle_graph",
                description: "Execute a Graph (PGQL) query against the Oracle ERP database.",
                inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
            },
            {
                name: "query_oracle_vector",
                description: "Execute a Vector Search query against Oracle AI Vector Search.",
                inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const connection = await getConnection();

    if (!connection) {
        // FALLBACK TO SIMULATION
        if (name === "query_oracle_sql") {
            return {
                content: [{ type: "text", text: `Simulated Oracle SQL result for: ${args.query}\n[{ "supplier_id": 1001, "total_invoices": 50000 }]` }]
            };
        } else if (name === "query_oracle_graph") {
            return {
                content: [{ type: "text", text: `Simulated Oracle Graph result for: ${args.query}\n[{ "network_depth": 3, "connected_entities": ["SupplierA", "SupplierC"] }]` }]
            };
        } else if (name === "query_oracle_vector") {
            return {
                content: [{ type: "text", text: `Simulated Oracle Vector Search result for: ${args.query}\n[{ "metadata": "High value anomaly detected", "distance": 0.12 }]` }]
            };
        }
    }

    try {
        if (name === "query_oracle_sql") {
            const result = await connection.execute(args.query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await connection.close();
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        } else if (name === "query_oracle_graph") {
            const result = await connection.execute(args.query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await connection.close();
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        } else if (name === "query_oracle_vector") {
            const vectorQuery = `SELECT * FROM transactions WHERE VECTOR_DISTANCE(vec, TO_VECTOR(:search)) < 0.5`;
            const result = await connection.execute(vectorQuery, { search: args.query }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await connection.close();
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        }
    } catch (error) {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
        return {
            content: [{ type: "text", text: `Error executing Oracle tool: ${error.message}` }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

import { fileURLToPath } from "url";

export { server };

async function run() {
    if (import.meta.url === fileURLToPath(`file:///${process.argv[1].replace(/\\/g, '/')}`)) {
        if (!dbConfig.user || !dbConfig.password || !dbConfig.connectString) {
            console.error("Oracle environment variables not set. Running in simulation mode if tools are called.");
        }
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Oracle MCP Server running in stdio mode");
    }
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
