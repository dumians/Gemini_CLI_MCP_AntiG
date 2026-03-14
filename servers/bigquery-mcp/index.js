import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BigQuery } from "@google-cloud/bigquery";

const server = new Server(
    {
        name: "bigquery-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Database Connection
const bigquery = process.env.PROJECT_ID ? new BigQuery({
    projectId: process.env.PROJECT_ID
}) : null;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_bigquery",
                description: "Execute a standard SQL query against BigQuery Enterprise Data Warehouse.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                    },
                    required: ["query"],
                },
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!bigquery) {
        // FALLBACK TO SIMULATION
        if (name === "query_bigquery") {
            return {
                content: [{ type: "text", text: `Simulated BigQuery result for: ${args.query}\n[{ "segment": "VIP", "customer_id": "CUST-999" }]` }]
            };
        }
    }

    try {
        if (name === "query_bigquery") {
            const [job] = await bigquery.createQueryJob({ query: args.query });
            const [rows] = await job.getQueryResults();
            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error executing BigQuery tool: ${error.message}` }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});



// Support both STDIO (local) and SSE (hosted)
const mode = process.argv.includes("--sse") ? "sse" : "stdio";
const portArg = process.argv.find(arg => arg.startsWith("--port="));
const defaultPort = portArg ? parseInt(portArg.split('=')[1]) : 3004;

if (mode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("BigQuery MCP Server running in stdio mode");
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
        console.error(`BigQuery MCP Server running on port ${port} (SSE)`);
    });
}

