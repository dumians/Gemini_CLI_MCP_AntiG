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
const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const datasetId = process.env.BIGQUERY_DATASET_ID;
const location = process.env.BIGQUERY_LOCATION; // e.g. 'US'

// BigQuery client will only be instantiated if credentials/configuration are present
// During testing, we keep this null to trigger simulation mode.
const bigquery = (projectId && process.env.NODE_ENV !== 'test') ? new BigQuery({ projectId }) : null;

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

    if (name === "query_bigquery") {
        const query = args.query || args.sql || "";
        const isTest = process.env.NODE_ENV === 'test';
        if (!bigquery || isTest) {
            // FALLBACK TO SIMULATION
            return {
                content: [{ type: "text", text: `Simulated BigQuery result for: ${query}\n[{ "segment": "VIP", "customer_id": "CUST-999" }]` }]
            };
        }

        try {
            console.error(`[BigQuery-MCP] Executing SQL: ${args.query}`);
            const options = {
                query: args.query,
            };
            
            if (location) options.location = location;
            if (datasetId) options.defaultDataset = { datasetId };

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
                }],
                isError: true
            };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});

import { fileURLToPath } from "url";

export { server };

async function run() {
    if (import.meta.url === fileURLToPath(`file:///${process.argv[1].replace(/\\/g, '/')}`)) {
        if (!process.env.GCP_PROJECT_ID && !process.env.PROJECT_ID) {
            console.error("GCP_PROJECT_ID or PROJECT_ID environment variable not set. Running in simulation mode if tools are called.");
        }
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("BigQuery MCP Server running in stdio mode");
    }
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
