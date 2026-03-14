import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";

dotenv.config();

// GCP BigQuery Configuration
const bigquery = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
const datasetId = process.env.BIGQUERY_DATASET_ID;
const location = process.env.BIGQUERY_LOCATION; // e.g. 'US'

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
                description: "Execute a standard SQL query against the BigQuery data warehouse.",
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
    if (name === "query_bigquery") {
        try {
            console.error(`[BigQuery-MCP] Executing SQL: ${args.query}`);
            const options = {
                query: args.query,
                location,
            };
            if (datasetId) {
                options.defaultDataset = { datasetId };
            }

            const [job] = await bigquery.createQueryJob(options);
            const [rows] = await job.getQueryResults();

            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        } catch (error) {
            console.error(`[BigQuery-MCP] Error calling tool '${name}':`, error);
            return {
                content: [{
                    type: "text",
                    text: `Error executing BigQuery query: ${error.message}`
                }]
            };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});



// Support both STDIO (local) and SSE (hosted)
const mode = process.argv.includes("--sse") ? "sse" : "stdio";
const portArg = process.argv.find(arg => arg.startsWith("--port="));
const defaultPort = portArg ? parseInt(portArg.split('=')[1]) : 3004;

if (mode === "stdio") {
    if (!process.env.GCP_PROJECT_ID) {
        console.error("GCP_PROJECT_ID environment variable not set. Exiting.");
        process.exit(1);
    }
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

