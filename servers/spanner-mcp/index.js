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

// Database Connection
const spanner = new Spanner({
    projectId: process.env.PROJECT_ID
});
const instanceId = process.env.SPANNER_INSTANCE;
const databaseId = process.env.SPANNER_DATABASE;

const getDb = () => {
    if (instanceId && databaseId) {
        return spanner.instance(instanceId).database(databaseId);
    }
    return null;
};

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

    if (!db) {
        // FALLBACK TO SIMULATION
        if (name === "query_spanner_sql") {
            return {
                content: [{ type: "text", text: `Simulated Spanner SQL result for: ${args.query}\n[{ "store_id": "NYC-01", "stock_level": 4500 }]` }]
            };
        } else if (name === "query_spanner_graph") {
            return {
                content: [{ type: "text", text: `Simulated Spanner GQL result for: ${args.gql_match}\n[{ "path": ["SupplierA", "WarehouseB", "Store NYC-01"] }]` }]
            };
        }
    }

    try {
        if (name === "query_spanner_sql") {
            const [rows] = await db.run(args.query);
            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        } else if (name === "query_spanner_graph") {
            // Spanner Graph (GQL) uses the same run method or runPartitionedQuery depending on size, 
            // but for standard agentic usage, run() is sufficient.
            const [rows] = await db.run(args.gql_match);
            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error executing Spanner tool: ${error.message}` }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});



// Support both STDIO (local) and SSE (hosted)
const mode = process.argv.includes("--sse") ? "sse" : "stdio";
const portArg = process.argv.find(arg => arg.startsWith("--port="));
const defaultPort = portArg ? parseInt(portArg.split('=')[1]) : 3002;

if (mode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Spanner MCP Server running in stdio mode");
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
        console.error(`Spanner MCP Server running on port ${port} (SSE)`);
    });
}

