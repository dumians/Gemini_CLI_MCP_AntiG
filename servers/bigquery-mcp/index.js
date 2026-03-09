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

/*
// In a real environment with ADC:
const bigquery = new BigQuery();
*/

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

    if (name === "query_bigquery") {
        /*
        // Real API call:
        const [job] = await bigquery.createQueryJob(args.query);
        const [rows] = await job.getQueryResults();
        return { content: [{ type: "text", text: JSON.stringify(rows) }] };
        */
        return {
            content: [{ type: "text", text: `Simulated BigQuery result for: ${args.query}\n[{ "segment": "VIP", "customer_id": "CUST-999" }]` }]
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("BigQuery MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
