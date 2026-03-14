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


// Database Connection
const getConnection = async () => {
    if (process.env.ORACLE_URL && process.env.ORACLE_USER && process.env.ORACLE_PASS) {
        try {
            return await oracledb.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASS,
                connectString: process.env.ORACLE_URL
            });
        } catch (e) {
            console.error("Oracle Connection Error:", e.message);
            return null;
        }
    }
    return null;
};

// We define tools that the agent can call
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
                content: [{ type: "text", text: `Simulated Oracle Graph result for: ${args.match_clause}\n[{ "network_depth": 3, "connected_entities": ["SupplierA", "SupplierC"] }]` }]
            };
        } else if (name === "query_oracle_vector") {
            return {
                content: [{ type: "text", text: `Simulated Oracle Vector Search result for: ${args.search_term}\n[{ "metadata": "High value anomaly detected", "distance": 0.12 }]` }]
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
            // Oracle Graph queries typically use PGQL or standard SQL with operators depending on version
            const result = await connection.execute(args.match_clause, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await connection.close();
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        } else if (name === "query_oracle_vector") {
            // Real vector search logic would involve TO_VECTOR and VECTOR_DISTANCE
            const vectorQuery = `SELECT * FROM transactions WHERE VECTOR_DISTANCE(vec, TO_VECTOR(:search)) < 0.5`;
            const result = await connection.execute(vectorQuery, { search: args.search_term }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            await connection.close();
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
            };
        }
    } catch (error) {
        if (connection) await connection.close();
        return {
            content: [{ type: "text", text: `Error executing Oracle tool: ${error.message}` }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});



// Support both STDIO (local) and SSE (hosted)
const mode = process.argv.includes("--sse") ? "sse" : "stdio";
const portArg = process.argv.find(arg => arg.startsWith("--port="));
const defaultPort = portArg ? parseInt(portArg.split('=')[1]) : 3003;

if (mode === "stdio") {
    const requiredVars = ['ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING'];
    for (const v of requiredVars) {
        if (!process.env[v]) {
            console.error(`${v} environment variable not set. Exiting.`);
            process.exit(1);
        }
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Oracle MCP Server running in stdio mode");
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

    const port = process.env.PORT || defaultPort;
    app.listen(port, () => {
        console.error(`Oracle MCP Server running on port ${port} (SSE)`);
    });
}

