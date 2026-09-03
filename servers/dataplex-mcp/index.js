import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { dataplex } from "../../agent/utils/dataplex.js";
import { DataplexAgent } from "../../agent/dataplex_agent.js";
import { governancePropagator } from "../../agent/utils/governance_metadata_propagator.js";
import { documentRAGEngine } from "../../agent/utils/document_rag_engine.js";
import { kcDiscoveryService } from "../../agent/utils/knowledge_catalog_discovery_service.js";
import dotenv from "dotenv";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dataplexAgent = new DataplexAgent();

const server = new Server(
    {
        name: "dataplex-mcp",
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
                name: "create_policy",
                description: "Create a governance policy in Dataplex.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        status: { type: "string" },
                        domain: { type: "string" },
                        classification: { type: "string" },
                        dataplexAspect: { type: "string" },
                        maskingRule: { type: "string" }
                    },
                    required: ["id", "name", "status", "domain"],
                },
            },
            {
                name: "evaluate_policy",
                description: "Evaluates standard Data Product objects against federated Dataplex policies",
                inputSchema: {
                    type: "object",
                    properties: {
                        domain: { type: "string" },
                        dataProduct: { type: "object" }
                    },
                    required: ["domain", "dataProduct"],
                },
            },
            {
                name: "track_lineage",
                description: "Tracks Data Lineage relationship between source and target entities",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        relationship: { type: "string" }
                    },
                    required: ["source", "target"],
                },
            },
            {
                name: "scan_metadata_gaps",
                description: "Scans datasets for missing descriptions and metadata gaps across data domains",
                inputSchema: {
                    type: "object",
                    properties: {
                        sourceId: { type: "string" },
                        datasetId: { type: "string" }
                    }
                }
            },
            {
                name: "propagate_lineage_descriptions",
                description: "Previews and propagates column descriptions recursively across column-level lineage with SQL logic enrichment",
                inputSchema: {
                    type: "object",
                    properties: {
                        datasetId: { type: "string" },
                        targetTable: { type: "string" },
                        apply: { type: "boolean" },
                        updates: { type: "array" }
                    },
                    required: ["targetTable"]
                }
            },
            {
                name: "map_ai_business_glossary",
                description: "Performs AI semantic mapping of technical database columns to Business Glossary terms using Vertex AI/Gemini",
                inputSchema: {
                    type: "object",
                    properties: {
                        datasetId: { type: "string" },
                        tableId: { type: "string" },
                        apply: { type: "boolean" },
                        updates: { type: "array" }
                    },
                    required: ["tableId"]
                }
            },
            {
                name: "propagate_policy_tags",
                description: "Analyzes column lineage to recommend and propagate sensitive data policy tags with straight-pull detection and access summaries",
                inputSchema: {
                    type: "object",
                    properties: {
                        datasetId: { type: "string" },
                        targetTable: { type: "string" },
                        apply: { type: "boolean" },
                        updates: { type: "array" }
                    },
                    required: ["targetTable"]
                }
            },
            {
                name: "calculate_data_trust_scores",
                description: "Calculates derived Data Trust Scores (DQ) across multi-hop lineage, applying remediation bonuses and trend analysis",
                inputSchema: {
                    type: "object",
                    properties: {
                        datasetId: { type: "string" },
                        tableId: { type: "string" }
                    },
                    required: ["tableId"]
                }
            },
            {
                name: "ingest_governance_document",
                description: "Ingests unstructured data dictionaries, PDFs, markdown, or policy documents into the governance RAG engine",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        fileName: { type: "string" },
                        fileType: { type: "string" }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "query_governance_rag",
                description: "Queries indexed governance documents and policies for table/column definitions and rules",
                inputSchema: {
                    type: "object",
                    properties: {
                        tableName: { type: "string" },
                        columnName: { type: "string" },
                        domain: { type: "string" }
                    }
                }
            },
            {
                name: "manage_dataplex_scans",
                description: "Lists or triggers Dataplex Data Quality and Data Profile scans on target entities",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["list", "trigger"] },
                        scanId: { type: "string" },
                        scanType: { type: "string" },
                        targetEntity: { type: "string" }
                    },
                    required: ["action"]
                }
            },
            {
                name: "get_estate_governance_summary",
                description: "Returns the comprehensive Estate Dashboard metrics including metadata gap percentage, trust score, and policy coverage",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            },
            {
                name: "knowledge_catalog_multi_search",
                description: "Performs concurrent multi-query semantic search across Google Cloud Knowledge Catalog / Dataplex with automatic reranking",
                inputSchema: {
                    type: "object",
                    properties: {
                        queries: { type: "array", items: { type: "string" }, description: "List of search query strings with extracted predicates" }
                    },
                    required: ["queries"]
                }
            },
            {
                name: "decompose_and_discover_assets",
                description: "End-to-end AI Discovery Agent: Decomposes natural language query into 3 distinct variations, runs multi-search, looks up context, and returns ranked assets",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Natural language discovery request" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "lookup_knowledge_context",
                description: "Calls Knowledge Catalog LookupContext API to retrieve deep lineage, aspect schemas, and context for batch resources",
                inputSchema: {
                    type: "object",
                    properties: {
                        region: { type: "string", description: "GCP region (e.g., global, europe-west3)" },
                        batchEntries: { type: "array", items: { type: "string" }, description: "Array of resource entry names" }
                    },
                    required: ["batchEntries"]
                }
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "create_policy") {
            const result = await dataplex.createGovernancePolicy(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "evaluate_policy") {
            const result = await dataplexAgent.evaluatePolicy(args.domain, args.dataProduct, "mcp-trace");
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "track_lineage") {
            const result = await dataplexAgent.trackLineage(args.source, args.target, args.relationship, "mcp-trace");
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "scan_metadata_gaps") {
            const result = await governancePropagator.scanForMissingDescriptions(args.sourceId, args.datasetId);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "propagate_lineage_descriptions") {
            const result = args.apply && args.updates
                ? await governancePropagator.applyPropagation(args.datasetId, args.updates)
                : await governancePropagator.previewPropagation(args.datasetId, args.targetTable);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "map_ai_business_glossary") {
            const result = args.apply && args.updates
                ? await governancePropagator.applyGlossaryTerms(args.datasetId, args.tableId, args.updates)
                : await governancePropagator.recommendGlossaryTerms(args.datasetId, args.tableId);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "propagate_policy_tags") {
            const result = args.apply && args.updates
                ? await governancePropagator.applyPolicyTags(args.datasetId, args.updates)
                : await governancePropagator.previewPolicyTagPropagation(args.datasetId, args.targetTable);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "calculate_data_trust_scores") {
            const result = await governancePropagator.propagateDQScores(args.datasetId, args.tableId);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "ingest_governance_document") {
            const result = await documentRAGEngine.ingestDocument(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "query_governance_rag") {
            const result = documentRAGEngine.queryRelevantMetadata(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "manage_dataplex_scans") {
            const result = args.action === 'trigger'
                ? await governancePropagator.triggerDataplexScan(args.scanId, args.scanType, args.targetEntity)
                : await governancePropagator.listDataplexScans();
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "get_estate_governance_summary") {
            const result = await governancePropagator.getEstateSummary();
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "knowledge_catalog_multi_search") {
            const result = await kcDiscoveryService.multiSearch(args.queries);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "decompose_and_discover_assets") {
            const result = await kcDiscoveryService.discoverAssets(args.query);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        } else if (name === "lookup_knowledge_context") {
            const result = await kcDiscoveryService.lookupContext(args.region || 'global', args.batchEntries);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    } catch (error) {
        console.error(`[Dataplex-MCP] Error calling tool '${name}':`, error);
        return {
            content: [{
                type: "text",
                text: `Error executing Dataplex tool: ${error.message}`
            }],
            isError: true
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

const SSE_TRANSPORT_PATH = "/sse";

async function run() {
    let mode = "sse";
    let port = process.env.PORT || 3007;

    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i] === "--transport" && process.argv[i+1]) {
            mode = process.argv[i+1];
            i++;
        } else if (process.argv[i] === "--port" && process.argv[i+1]) {
            port = parseInt(process.argv[i+1], 10);
            i++;
        }
    }

    if (mode === "stdio") {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Dataplex MCP Server running in stdio mode");
    } else {
        const app = express();
        let transport;

        app.get("/", (req, res) => res.json({ status: "ok", service: "dataplex-mcp" }));
        app.get("/health", (req, res) => res.json({ status: "ok" }));

        app.get(SSE_TRANSPORT_PATH, async (req, res) => {
            transport = new SSEServerTransport(SSE_TRANSPORT_PATH, res);
            await server.connect(transport);
        });

        app.post(SSE_TRANSPORT_PATH, async (req, res) => {
            if (transport) {
                await transport.handlePostMessage(req, res);
            }
        });

        app.listen(port, "0.0.0.0", () => {
            console.error(`Dataplex MCP Server running on port ${port} (SSE)`);
        });
    }
}

const isMainModule = process.argv[1] && (process.argv[1].endsWith('dataplex-mcp/index.js') || process.argv[1].endsWith('dataplex-mcp'));
if (isMainModule) {
    run().catch((error) => {
        console.error("Error running server:", error);
        process.exit(1);
    });
}

export { server };
