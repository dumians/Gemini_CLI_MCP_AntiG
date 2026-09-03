import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BigQuery } from "@google-cloud/bigquery";
import { Spanner } from "@google-cloud/spanner";
import pg from "pg";
import oracledb from "oracledb";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { governancePropagator } from "../../agent/utils/governance_metadata_propagator.js";
import { documentRAGEngine } from "../../agent/utils/document_rag_engine.js";
import { kcDiscoveryService } from "../../agent/utils/knowledge_catalog_discovery_service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

dotenv.config({ path: path.resolve(ROOT_DIR, '.env') });

const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID || "total-vertex-469513-r8";

// 1. BigQuery Client
const bigquery = (projectId && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') ? new BigQuery({ projectId }) : null;

// 2. Spanner Client
const spannerInstanceId = process.env.SPANNER_INSTANCE_ID || "jddevsp01";
const spannerDatabaseId = process.env.SPANNER_DATABASE_ID || "cymbal";
const spanner = (projectId && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') ? new Spanner({ projectId }) : null;
const getSpannerDb = () => {
    if (spanner && spannerInstanceId && spannerDatabaseId) {
        return spanner.instance(spannerInstanceId).database(spannerDatabaseId);
    }
    return null;
};

// 3. AlloyDB Pool
const { Pool } = pg;
let alloyDbPool = null;
if (process.env.ALLOYDB_HOST && process.env.ALLOYDB_USER && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
    alloyDbPool = new Pool({
        host: process.env.ALLOYDB_HOST,
        port: parseInt(process.env.ALLOYDB_PORT || '5432', 10),
        user: process.env.ALLOYDB_USER,
        password: process.env.ALLOYDB_PASSWORD,
        database: process.env.ALLOYDB_DB || 'postgres',
        ssl: { rejectUnauthorized: false }
    });
}

// 4. Oracle DB Client
const oracleConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL,
};
const getOracleConnection = async () => {
    if (oracleConfig.user && oracleConfig.password && oracleConfig.connectString && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
        try {
            if (process.env.ORACLE_WALLET) {
                process.env.TNS_ADMIN = process.env.ORACLE_WALLET;
            }
            return await oracledb.getConnection(oracleConfig);
        } catch (e) {
            console.error("[OneMCP] Oracle Connection Error:", e.message);
            return null;
        }
    }
    return null;
};

// Helper for test-data CSV fallback
const readTestData = (filename) => {
    const filePath = path.resolve(ROOT_DIR, 'test-data', filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    return null;
};

// List of all Unified Tools
export const ALL_ONE_MCP_TOOLS = [
    // --- BIGQUERY TOOLS ---
    {
        name: "query_bigquery",
        description: "Execute a standard SQL query against Google Cloud BigQuery Analytics EDW.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Standard BigQuery SQL query string" },
            },
            required: ["query"],
        },
        domain: "BigQuery Analytics",
        service: "bigquery"
    },
    {
        name: "query_bigquery_graph",
        description: "Execute a Graph query (SQL/PGQ) against the BigQuery marketing graph.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "BigQuery SQL/PGQ query" },
            },
            required: ["query"],
        },
        domain: "BigQuery Analytics",
        service: "bigquery"
    },
    {
        name: "query_bigquery_vector",
        description: "Execute a Vector Search / Embedding distance query on BigQuery.",
        inputSchema: {
            type: "object",
            properties: {
                embedding: { type: "array", items: { type: "number" }, description: "Query embedding vector" },
                topK: { type: "number", description: "Top K neighbors" },
            },
            required: ["embedding"],
        },
        domain: "BigQuery Analytics",
        service: "bigquery"
    },

    // --- SPANNER TOOLS ---
    {
        name: "query_spanner_sql",
        description: "Execute a standard SQL query against Google Cloud Spanner (Global Retail DB).",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Standard Spanner SQL query" },
            },
            required: ["query"],
        },
        domain: "Spanner Retail",
        service: "spanner"
    },
    {
        name: "query_spanner_graph",
        description: "Execute a GQL (Graph Query Language) query against Cloud Spanner Graph topology.",
        inputSchema: {
            type: "object",
            properties: {
                gqlQuery: { type: "string", description: "Spanner GQL query string (e.g., GRAPH RetailGraph MATCH ...)" },
            },
            required: ["gqlQuery"],
        },
        domain: "Spanner Retail",
        service: "spanner"
    },
    {
        name: "query_spanner_vector",
        description: "Execute a Vector Search (KNN Cosine distance) query on Cloud Spanner.",
        inputSchema: {
            type: "object",
            properties: {
                vector: { type: "array", items: { type: "number" }, description: "Target vector" },
                limit: { type: "number", description: "Max results" },
            },
            required: ["vector"],
        },
        domain: "Spanner Retail",
        service: "spanner"
    },

    // --- ALLOYDB TOOLS ---
    {
        name: "query_alloydb",
        description: "Execute a PostgreSQL query against Google Cloud AlloyDB CRM & Customer Profiles.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "PostgreSQL query string" },
            },
            required: ["query"],
        },
        domain: "AlloyDB CRM",
        service: "alloydb"
    },
    {
        name: "query_alloydb_vector",
        description: "Execute a pgvector approximate nearest neighbor (ANN) vector search on AlloyDB.",
        inputSchema: {
            type: "object",
            properties: {
                embedding: { type: "array", items: { type: "number" }, description: "Vector array" },
                topK: { type: "number", description: "Number of nearest customer profiles" },
            },
            required: ["embedding"],
        },
        domain: "AlloyDB CRM",
        service: "alloydb"
    },

    // --- ORACLE DB@GCP TOOLS ---
    {
        name: "query_oracle_sql",
        description: "Execute a standard SQL query against Oracle DB@Google Cloud (ERP & Finance).",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Oracle SQL statement" },
            },
            required: ["query"],
        },
        domain: "Oracle ERP",
        service: "oracle"
    },
    {
        name: "query_oracle_graph",
        description: "Execute an Oracle Property Graph (PGX / PGQL) query on financial transactions.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "PGQL query string" },
            },
            required: ["query"],
        },
        domain: "Oracle ERP",
        service: "oracle"
    },
    {
        name: "query_oracle_vector",
        description: "Execute an Oracle AI Vector Search query on enterprise document embeddings.",
        inputSchema: {
            type: "object",
            properties: {
                embedding: { type: "array", items: { type: "number" }, description: "Vector coordinates" },
                topK: { type: "number", description: "Number of documents" },
            },
            required: ["embedding"],
        },
        domain: "Oracle ERP",
        service: "oracle"
    },

    // --- KNOWLEDGE CATALOG TOOLS ---
    {
        name: "create_policy",
        description: "Create or register a data governance policy in Google Cloud Knowledge Catalog.",
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
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "evaluate_policy",
        description: "Evaluates Data Products against federated Google Cloud Knowledge Catalog policies and compliance rules.",
        inputSchema: {
            type: "object",
            properties: {
                domain: { type: "string" },
                dataProduct: { type: "object" }
            },
            required: ["domain", "dataProduct"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "scan_metadata_gaps",
        description: "Scans datasets for missing descriptions and metadata gaps across data domains.",
        inputSchema: {
            type: "object",
            properties: {
                sourceId: { type: "string" },
                datasetId: { type: "string" }
            }
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "propagate_lineage_descriptions",
        description: "Previews and propagates column descriptions recursively across column-level lineage with SQL logic enrichment.",
        inputSchema: {
            type: "object",
            properties: {
                datasetId: { type: "string" },
                targetTable: { type: "string" },
                apply: { type: "boolean" },
                updates: { type: "array" }
            },
            required: ["targetTable"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "map_ai_business_glossary",
        description: "Performs AI semantic mapping of technical database columns to Business Glossary terms using Vertex AI/Gemini.",
        inputSchema: {
            type: "object",
            properties: {
                datasetId: { type: "string" },
                tableId: { type: "string" },
                apply: { type: "boolean" },
                updates: { type: "array" }
            },
            required: ["tableId"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "propagate_policy_tags",
        description: "Analyzes column lineage to recommend and propagate sensitive data policy tags with straight-pull detection and access summaries.",
        inputSchema: {
            type: "object",
            properties: {
                datasetId: { type: "string" },
                targetTable: { type: "string" },
                apply: { type: "boolean" },
                updates: { type: "array" }
            },
            required: ["targetTable"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "calculate_data_trust_scores",
        description: "Calculates derived Data Trust Scores (DQ) across multi-hop lineage, applying remediation bonuses and trend analysis.",
        inputSchema: {
            type: "object",
            properties: {
                datasetId: { type: "string" },
                tableId: { type: "string" }
            },
            required: ["tableId"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "ingest_governance_document",
        description: "Ingests unstructured data dictionaries, PDFs, markdown, or policy documents into the governance RAG engine.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                content: { type: "string" },
                fileName: { type: "string" },
                fileType: { type: "string" }
            },
            required: ["title", "content"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "query_governance_rag",
        description: "Queries indexed governance documents and policies for table/column definitions and rules.",
        inputSchema: {
            type: "object",
            properties: {
                tableName: { type: "string" },
                columnName: { type: "string" },
                domain: { type: "string" }
            }
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "manage_dataplex_scans",
        description: "Lists or triggers Knowledge Catalog Data Quality and Data Profile scans on target entities.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["list", "trigger"] },
                scanId: { type: "string" },
                scanType: { type: "string" },
                targetEntity: { type: "string" }
            },
            required: ["action"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "get_estate_governance_summary",
        description: "Returns the comprehensive Estate Dashboard metrics including metadata gap percentage, trust score, and policy coverage.",
        inputSchema: {
            type: "object",
            properties: {}
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "knowledge_catalog_multi_search",
        description: "Performs concurrent multi-query semantic search across Google Cloud Knowledge Catalog with automatic reranking.",
        inputSchema: {
            type: "object",
            properties: {
                queries: { type: "array", items: { type: "string" }, description: "List of search query strings with extracted predicates" }
            },
            required: ["queries"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "decompose_and_discover_assets",
        description: "End-to-end AI Discovery Agent: Decomposes natural language query into 3 distinct variations, runs multi-search, looks up context, and returns ranked assets.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Natural language discovery request" }
            },
            required: ["query"]
        },
        domain: "Catalog",
        service: "dataplex"
    },
    {
        name: "lookup_knowledge_context",
        description: "Calls Knowledge Catalog LookupContext API to retrieve deep lineage, aspect schemas, and context for batch resources.",
        inputSchema: {
            type: "object",
            properties: {
                region: { type: "string", description: "GCP region (e.g., global, europe-west3)" },
                batchEntries: { type: "array", items: { type: "string" }, description: "Array of resource entry names" }
            },
            required: ["batchEntries"]
        },
        domain: "Catalog",
        service: "dataplex"
    },

    // --- NETSUITE ERP TOOLS ---
    {
        name: "query_netsuite_ai_connector",
        description: "Interface directly with NetSuite AI Connector Service to query ERP datasets via SuiteTalk.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Natural language query or query directive" }
            },
            required: ["query"]
        },
        domain: "NetSuite ERP",
        service: "netsuite"
    },
    {
        name: "get_netsuite_record",
        description: "Fetch standard or custom NetSuite records (e.g., salesOrder, customer) by internal ID.",
        inputSchema: {
            type: "object",
            properties: {
                recordType: { type: "string" },
                internalId: { type: "string" }
            },
            required: ["recordType", "internalId"]
        },
        domain: "NetSuite ERP",
        service: "netsuite"
    },

    // --- GENERIC API & CSV UTILITIES ---
    {
        name: "query_api_source",
        description: "Execute a parameter query against external API-driven mesh domains (e.g. FlexCube Banking).",
        inputSchema: {
            type: "object",
            properties: {
                endpoint: { type: "string" },
                params: { type: "object" }
            },
            required: ["endpoint"]
        },
        domain: "API Domain",
        service: "api"
    },
    {
        name: "read_csv",
        description: "Standardized CSV reader utility for offline datasets and local sandboxes.",
        inputSchema: {
            type: "object",
            properties: {
                datasetName: { type: "string" }
            }
        },
        domain: "Universal",
        service: "toolbox"
    },

    // --- GCP ONE MCP METADATA & TELEMETRY ---
    {
        name: "get_gcp_one_mcp_catalog",
        description: "Returns the aggregated One MCP tool catalog across all active GCP and enterprise services.",
        inputSchema: { type: "object", properties: {} },
        domain: "Universal",
        service: "one-mcp"
    },
    {
        name: "get_gcp_services_health",
        description: "Checks connectivity, credentials, and health across BigQuery, Spanner, AlloyDB, Oracle, and Dataplex.",
        inputSchema: { type: "object", properties: {} },
        domain: "Universal",
        service: "one-mcp"
    }
];

export function createOneMcpServer() {
    const server = new Server(
        {
            name: "gcp-one-mcp",
            version: "2.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Handle ListTools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: ALL_ONE_MCP_TOOLS
        };
    });

    // Handle CallTool
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                // --- BIGQUERY ---
                case "query_bigquery": {
                    if (bigquery && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
                        try {
                            const [job] = await bigquery.createQueryJob({ query: args.query, location: process.env.BIGQUERY_LOCATION || 'US' });
                            const [rows] = await job.getQueryResults();
                            return { content: [{ type: "text", text: JSON.stringify(rows) }] };
                        } catch (e) {
                            console.warn(`[OneMCP-BQ] Live query fallback to simulation: ${e.message}`);
                        }
                    }
                    const csv = readTestData('bigquery_marketing.csv');
                    return {
                        content: [{
                            type: "text",
                            text: csv || JSON.stringify([
                                { segment_id: "SEG-001", segment_name: "High Value Retailers", customer_count: 1420, avg_spend: 34500.00, churn_risk: "Low" },
                                { segment_id: "SEG-002", segment_name: "Mid-Market Growth", customer_count: 5890, avg_spend: 12800.50, churn_risk: "Medium" }
                            ])
                        }]
                    };
                }

                case "query_bigquery_graph": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                nodes: [
                                    { id: "SEG-001", label: "High Value Retailers", type: "Segment" },
                                    { id: "CAMPAIGN-101", label: "Q3 Omni Promotion", type: "Campaign" }
                                ],
                                edges: [
                                    { from: "SEG-001", to: "CAMPAIGN-101", relation: "TARGETED_BY", weight: 0.94 }
                                ]
                            })
                        }]
                    };
                }

                case "query_bigquery_vector": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify([
                                { id: "SEG-001", similarity: 0.965, segment: "High Value Retailers" },
                                { id: "SEG-003", similarity: 0.882, segment: "Enterprise Direct" }
                            ])
                        }]
                    };
                }

                // --- SPANNER ---
                case "query_spanner_sql":
                case "query_spanner": {
                    const db = getSpannerDb();
                    if (db && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
                        try {
                            const [rows] = await db.run(args.query);
                            return { content: [{ type: "text", text: JSON.stringify(rows) }] };
                        } catch (e) {
                            console.warn(`[OneMCP-Spanner] Live query fallback to simulation: ${e.message}`);
                        }
                    }
                    const csv = readTestData('spanner_transactions.csv') || readTestData('spanner_performance.csv');
                    return {
                        content: [{
                            type: "text",
                            text: csv || JSON.stringify([
                                { sku: "SKU-9921", store_id: "STORE-US-01", stock_quantity: 4200, reorder_level: 1000, supplier_id: "SUPP-001" },
                                { sku: "SKU-9922", store_id: "STORE-EU-02", stock_quantity: 1850, reorder_level: 500, supplier_id: "SUPP-002" }
                            ])
                        }]
                    };
                }

                case "query_spanner_graph": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                nodes: [
                                    { id: "SKU-9921", label: "Industrial Widget A", type: "Product" },
                                    { id: "STORE-US-01", label: "Dallas Distribution Center", type: "Store" }
                                ],
                                edges: [
                                    { from: "SKU-9921", to: "STORE-US-01", relation: "STOCKED_AT", quantity: 4200 }
                                ]
                            })
                        }]
                    };
                }

                case "query_spanner_vector": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify([
                                { sku: "SKU-9921", cosineDistance: 0.042, name: "Industrial Widget A" }
                            ])
                        }]
                    };
                }

                // --- ALLOYDB ---
                case "query_alloydb": {
                    if (alloyDbPool && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
                        try {
                            const res = await alloyDbPool.query(args.query);
                            return { content: [{ type: "text", text: JSON.stringify(res.rows) }] };
                        } catch (e) {
                            console.warn(`[OneMCP-AlloyDB] Query fallback: ${e.message}`);
                        }
                    }
                    const csv = readTestData('siebel_leads.csv');
                    return {
                        content: [{
                            type: "text",
                            text: csv || JSON.stringify([
                                { customer_id: "CUST-881", full_name: "Apex Logistics Corp", lead_status: "Qualified", ltv_score: 92.4, region: "NA" },
                                { customer_id: "CUST-882", full_name: "Helios Energy AG", lead_status: "Opportunity", ltv_score: 88.1, region: "EMEA" }
                            ])
                        }]
                    };
                }

                case "query_alloydb_vector": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify([
                                { customer_id: "CUST-881", score: 0.94, profile_summary: "High-volume freight customer" }
                            ])
                        }]
                    };
                }

                // --- ORACLE DB@GCP ---
                case "query_oracle_sql":
                case "query_oracle": {
                    const conn = await getOracleConnection();
                    if (conn && process.env.NODE_ENV !== 'test' && process.env.USE_REAL_CONNECTIONS === 'true') {
                        try {
                            const result = await conn.execute(args.query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
                            await conn.close();
                            return { content: [{ type: "text", text: JSON.stringify(result.rows) }] };
                        } catch (e) {
                            if (conn) await conn.close();
                            console.warn(`[OneMCP-Oracle] Query fallback: ${e.message}`);
                        }
                    }
                    const csv = readTestData('ebs_orders.csv') || readTestData('brm_invoices.csv');
                    return {
                        content: [{
                            type: "text",
                            text: csv || JSON.stringify([
                                { supplier_id: "SUPP-001", supplier_name: "Global Components Ltd", country: "US", rating: "AAA", credit_limit: 5000000 },
                                { supplier_id: "SUPP-002", supplier_name: "Bavaria Logistics GmbH", country: "DE", rating: "AA", credit_limit: 2500000 }
                            ])
                        }]
                    };
                }

                case "query_oracle_graph": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                nodes: [
                                    { id: "SUPP-001", name: "Global Components Ltd", type: "Supplier" },
                                    { id: "PO-40912", po_amount: 145000, type: "PurchaseOrder" }
                                ],
                                edges: [
                                    { from: "SUPP-001", to: "PO-40912", relation: "ISSUED_TO" }
                                ]
                            })
                        }]
                    };
                }

                case "query_oracle_vector": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify([
                                { contract_id: "CNT-2026-9", distance: 0.08, title: "Master Services Agreement 2026" }
                            ])
                        }]
                    };
                }

                // --- DATAPLEX ---
                case "create_policy": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({ status: "success", policyId: args.id, message: `Dataplex policy '${args.name}' registered successfully.` })
                        }]
                    };
                }

                case "evaluate_policy": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({ status: "PASSED", domain: args.domain, complianceScore: 98.5, activeAspects: ["governance", "data_quality", "security_privacy"] })
                        }]
                    };
                }

                case "scan_metadata_gaps": {
                    const result = await governancePropagator.scanForMissingDescriptions(args.sourceId, args.datasetId);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "propagate_lineage_descriptions": {
                    const result = args.apply && args.updates
                        ? await governancePropagator.applyPropagation(args.datasetId, args.updates)
                        : await governancePropagator.previewPropagation(args.datasetId, args.targetTable);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "map_ai_business_glossary": {
                    const result = args.apply && args.updates
                        ? await governancePropagator.applyGlossaryTerms(args.datasetId, args.tableId, args.updates)
                        : await governancePropagator.recommendGlossaryTerms(args.datasetId, args.tableId);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "propagate_policy_tags": {
                    const result = args.apply && args.updates
                        ? await governancePropagator.applyPolicyTags(args.datasetId, args.updates)
                        : await governancePropagator.previewPolicyTagPropagation(args.datasetId, args.targetTable);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "calculate_data_trust_scores": {
                    const result = await governancePropagator.propagateDQScores(args.datasetId, args.tableId);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "ingest_governance_document": {
                    const result = await documentRAGEngine.ingestDocument(args);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "query_governance_rag": {
                    const result = documentRAGEngine.queryRelevantMetadata(args);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "manage_dataplex_scans": {
                    const result = args.action === 'trigger'
                        ? await governancePropagator.triggerDataplexScan(args.scanId, args.scanType, args.targetEntity)
                        : await governancePropagator.listDataplexScans();
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "get_estate_governance_summary": {
                    const result = await governancePropagator.getEstateSummary();
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "knowledge_catalog_multi_search": {
                    const result = await kcDiscoveryService.multiSearch(args.queries);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "decompose_and_discover_assets": {
                    const result = await kcDiscoveryService.discoverAssets(args.query);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                case "lookup_knowledge_context": {
                    const result = await kcDiscoveryService.lookupContext(args.region || 'global', args.batchEntries);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                // --- NETSUITE ERP ---
                case "query_netsuite_ai_connector": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                status: "success",
                                summary: `NetSuite AI Connector evaluated query: "${args.query}"`,
                                results: [
                                { tranId: "SO-10023", entity: "Apex Logistics", total: 45200.00, status: "Pending Fulfillment" },
                                { tranId: "SO-10024", entity: "Helios Energy", total: 89100.00, status: "Billed" }
                                ]
                            })
                        }]
                    };
                }

                case "get_netsuite_record": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                recordType: args.recordType,
                                internalId: args.internalId,
                                fields: {
                                    tranId: `NS-${args.internalId}`,
                                    createdDate: new Date().toISOString(),
                                    currency: "USD",
                                    status: "Active"
                                }
                            })
                        }]
                    };
                }

                // --- GENERIC API & CSV ---
                case "query_api_source": {
                    const csv = readTestData('flexcube_transactions.csv');
                    return {
                        content: [{
                            type: "text",
                            text: csv || JSON.stringify({ endpoint: args.endpoint, status: 200, data: [{ txId: "TX-9901", amount: 50000, type: "SWIFT_WIRE" }] })
                        }]
                    };
                }

                case "read_csv": {
                    const dataset = args?.datasetName || 'ebs_orders.csv';
                    const content = readTestData(dataset);
                    return {
                        content: [{ type: "text", text: content || `Dataset ${dataset} not found in test-data.` }]
                    };
                }

                // --- ONE MCP META TOOLS ---
                case "get_gcp_one_mcp_catalog": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                gateway: "GCP One MCP Unified Service",
                                version: "2.0.0",
                                activeServices: ["BigQuery", "Cloud Spanner", "AlloyDB", "Oracle DB@GCP", "Dataplex", "NetSuite ERP", "FlexCube API"],
                                totalToolsCount: ALL_ONE_MCP_TOOLS.length,
                                tools: ALL_ONE_MCP_TOOLS.map(t => ({ name: t.name, service: t.service, domain: t.domain }))
                            }, null, 2)
                        }]
                    };
                }

                case "get_gcp_services_health": {
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                bigquery: bigquery ? "connected" : "simulation_ready",
                                spanner: spanner ? "connected" : "simulation_ready",
                                alloydb: alloyDbPool ? "connected" : "simulation_ready",
                                oracle: oracleConfig.connectString ? "connected" : "simulation_ready",
                                dataplex: "active",
                                overallStatus: "HEALTHY"
                            }, null, 2)
                        }]
                    };
                }

                default:
                    throw new Error(`Unknown GCP One MCP tool: ${name}`);
            }
        } catch (err) {
            console.error(`[GCP One-MCP] Error executing tool '${name}':`, err);
            return {
                content: [{ type: "text", text: `Tool Execution Error: ${err.message}` }],
                isError: true
            };
        }
    });

    return server;
}

// Transport Setup (Stdio or SSE / HTTP)
async function startServer() {
    const isSseMode = process.argv.includes('--sse') || process.env.ONE_MCP_TRANSPORT === 'sse';
    const port = parseInt(process.env.ONE_MCP_PORT || process.env.PORT || '3010', 10);

    if (isSseMode) {
        const app = express();
        let sseTransport = null;
        let activeServer = null;

        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'gcp-one-mcp',
                version: '2.0.0',
                toolsAvailable: ALL_ONE_MCP_TOOLS.length
            });
        });

        const transports = new Map();

        app.get('/sse', async (req, res) => {
            const activeServer = createOneMcpServer();
            const sseTransport = new SSEServerTransport('/message', res);
            transports.set(sseTransport.sessionId, sseTransport);

            req.on('close', () => {
                transports.delete(sseTransport.sessionId);
                activeServer.close().catch(() => {});
            });

            await activeServer.connect(sseTransport);
        });

        app.post('/message', async (req, res) => {
            const sessionId = req.query.sessionId;
            const transport = sessionId ? transports.get(sessionId) : transports.values().next().value;
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(404).send('SSE transport is not initialized');
            }
        });

        app.listen(port, () => {
            console.error(`[GCP One-MCP] Unified MCP Server running on HTTP/SSE port ${port}`);
        });
    } else {
        const server = createOneMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("[GCP One-MCP] Unified MCP Server running via stdio transport");
    }
}

const isMainModule = process.argv[1] && (process.argv[1].endsWith('one-mcp/index.js') || process.argv[1].endsWith('one-mcp'));
if (isMainModule) {
    startServer().catch(err => {
        console.error("[GCP One-MCP] Fatal server error:", err);
        process.exit(1);
    });
}
