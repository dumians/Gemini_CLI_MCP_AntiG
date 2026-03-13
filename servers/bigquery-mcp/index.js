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

async function run() {
    if (!process.env.GCP_PROJECT_ID) {
        console.error("GCP_PROJECT_ID environment variable not set. Exiting.");
        process.exit(1);
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("BigQuery MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
