import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";
import express from 'express';

dotenv.config();

// GCP BigQuery Configuration
const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const datasetId = process.env.BIGQUERY_DATASET_ID;
const location = process.env.BIGQUERY_LOCATION; // e.g. 'US'

// BigQuery client will only be instantiated if credentials/configuration are present
// During testing, we keep this null to trigger simulation mode.
const bigquery = (projectId && (process.env.NODE_ENV !== 'test' || process.env.USE_REAL_CONNECTIONS === 'true')) ? new BigQuery({ projectId }) : null;

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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "query_bigquery") {
        const query = args.query || args.sql || "";
        const isTest = process.env.NODE_ENV === 'test' && process.env.USE_REAL_CONNECTIONS !== 'true';
        if (!bigquery || isTest) {
            // FALLBACK TO SIMULATION
            try {
                const csvPath = path.resolve(__dirname, '../../test-data/bigquery_segments.csv');
                const fileContent = fs.readFileSync(csvPath, 'utf-8');
                const lines = fileContent.trim().split('\n');
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj = {};
                        headers.forEach((h, i) => {
                            obj[h] = values[i] ? values[i].trim() : null;
                        });
                        return obj;
                    });
                    return {
                        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
                    };
                }
            } catch (e) {
                console.error("Error reading simulation CSV:", e);
                return {
                    content: [{ type: "text", text: `Simulated BigQuery result for: ${query}\n[{ "segment": "VIP", "customer_id": "CUST-999" }]` }]
                };
            }
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



export { server };

const SSE_TRANSPORT_PATH = "/sse";

async function run() {
    let mode = "stdio";
    let port = process.env.PORT || 8084;

    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i] === "--transport" && process.argv[i+1] === "sse") {
            mode = "sse";
            i++;
        } else if (process.argv[i] === "--port" && process.argv[i+1]) {
            port = parseInt(process.argv[i+1], 10);
            i++;
        }
    }

    if (true) { // Force run when executed
        if (!process.env.GCP_PROJECT_ID && !process.env.PROJECT_ID) {
            console.error("GCP_PROJECT_ID or PROJECT_ID environment variable not set. Running in simulation mode if tools are called.");
        }
        
        if (mode === "stdio") {
            const transport = new StdioServerTransport();
            await server.connect(transport);
            console.error("BigQuery MCP Server running in stdio mode");
        } else {
            const app = express();
            let transport;

            app.get(SSE_TRANSPORT_PATH, async (req, res) => {
                transport = new SSEServerTransport(SSE_TRANSPORT_PATH, res);
                await server.connect(transport);
            });

            app.post(SSE_TRANSPORT_PATH, async (req, res) => {
                if (transport) {
                    await transport.handlePostMessage(req, res);
                }
            });
        
            app.listen(port, () => {
                console.error(`BigQuery MCP Server running on port ${port} (SSE)`);
            });
        }
    }
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
