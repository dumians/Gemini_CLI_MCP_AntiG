import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
    {
        name: "api-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// In-memory session store for simulation
const activeSessions = new Set();

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "login",
                description: "Simulate login to Oracle EBS and get an access token.",
                inputSchema: {
                    type: "object",
                    properties: {
                        username: { type: "string" },
                        password: { type: "string" },
                    },
                    required: ["username", "password"],
                },
            },
            {
                name: "get_transactions",
                description: "Fetch simulated Flexcube transactions from API. Requires valid session token.",
                inputSchema: {
                    type: "object",
                    properties: {
                        token: { type: "string" },
                        ac_no: { type: "string", description: "Optional account number filter" },
                    },
                    required: ["token"],
                },
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "login") {
        const { username, password } = args;
        // Simple mock authentication
        if (username === "admin" && password === "welcome1") {
            const token = `mcp_token_${Math.random().toString(36).substring(2)}`;
            activeSessions.add(token);
            return {
                content: [{ type: "text", text: JSON.stringify({ status: "success", accessToken: token }) }]
            };
        } else {
            return {
                content: [{ type: "text", text: `Authentication failed` }],
                isError: true
            };
        }
    }

    if (name === "get_transactions") {
        const { token, ac_no } = args;
        if (!activeSessions.has(token)) {
            return {
                content: [{ type: "text", text: `Unauthorized: Invalid or missing token` }],
                isError: true
            };
        }

        try {
            const csvPath = path.resolve(__dirname, '../../test-data/flexcube_transactions.csv');
            const fileContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = fileContent.trim().split('\n');
            let rows = [];
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim());
                rows = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h] = values[i] ? values[i].trim() : null;
                    });
                    return obj;
                });
            }

            if (ac_no) {
                rows = rows.filter(r => r.ac_no === ac_no);
            }

            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        } catch (e) {
            console.error("Error reading flexcube CSV:", e);
            return {
                content: [{ type: "text", text: `Error reading data: ${e.message}` }],
                isError: true
            };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("API MCP Server running in stdio mode");
}

run().catch((error) => {
    console.error("Error running server:", error);
    process.exit(1);
});
