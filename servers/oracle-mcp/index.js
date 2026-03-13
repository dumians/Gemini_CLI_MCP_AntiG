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
    connectString: process.env.ORACLE_CONNECT_STRING, // e.g., "your-host:1521/your-service"
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
    const toolNames = ["query_oracle_sql", "query_oracle_graph", "query_oracle_vector"];

    if (toolNames.includes(name)) {
        let connection;
        try {
            console.error(`[Oracle-MCP] Executing ${name}: ${args.query}`);
            connection = await oracledb.getConnection(dbConfig);
            const result = await connection.execute(args.query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        } catch (error) {
            console.error(`[Oracle-MCP] Error calling tool '${name}':`, error);
            return {
                content: [{
                    type: "text",
                    text: `Error executing Oracle query: ${error.message}`
                }]
            };
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error("Error closing Oracle connection:", err);
                }
            }
        }
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const requiredVars = ['ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING'];
    for (const v of requiredVars) {
        if (!process.env[v]) {
            console.error(`${v} environment variable not set. Exiting.`);
            process.exit(1);
        }
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Oracle MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
