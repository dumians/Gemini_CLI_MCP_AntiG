import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logging_service.js';
import { governancePropagator } from './utils/governance_metadata_propagator.js';
import { documentRAGEngine } from './utils/document_rag_engine.js';
import { dataplex } from './utils/dataplex.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DataplexAgent {
    constructor() {
        this.policiesPath = path.join(__dirname, '../config/policies.json');
    }

    getTools() {
        return [
            {
                name: "evaluate_policy",
                description: "Evaluates standard Data Product objects against federated Dataplex policies",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        domain: { type: "STRING" },
                        dataProduct: { type: "OBJECT" }
                    },
                    required: ["domain", "dataProduct"]
                }
            },
            {
                name: "tag_entity",
                description: "Tags a mesh entity with governance metadata (e.g., PII, Sensitive, Confidential)",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        entityId: { type: "STRING" },
                        tag: { type: "STRING" }
                    },
                    required: ["entityId", "tag"]
                }
            },
            {
                name: "track_lineage",
                description: "Tracks Data Lineage relationship between source and target entities",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        source: { type: "STRING" },
                        target: { type: "STRING" },
                        relationship: { type: "STRING" }
                    },
                    required: ["source", "target"]
                }
            },
            {
                name: "scan_metadata_gaps",
                description: "Scans datasets and entities for missing descriptions and metadata gaps across data domains",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        sourceId: { type: "STRING", description: "Optional data source ID (e.g., bigquery, spanner, oracle)" },
                        datasetId: { type: "STRING", description: "Optional dataset ID" }
                    }
                }
            },
            {
                name: "propagate_lineage_descriptions",
                description: "Previews and propagates column descriptions recursively across column-level lineage with SQL logic enrichment",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        datasetId: { type: "STRING" },
                        targetTable: { type: "STRING" },
                        apply: { type: "BOOLEAN", description: "If true, applies the propagation updates" },
                        updates: { type: "ARRAY", description: "Array of updates to apply" }
                    },
                    required: ["targetTable"]
                }
            },
            {
                name: "map_ai_business_glossary",
                description: "Performs AI semantic mapping of technical database columns to Business Glossary terms using Vertex AI/Gemini",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        datasetId: { type: "STRING" },
                        tableId: { type: "STRING" },
                        apply: { type: "BOOLEAN", description: "If true, persists mappings to native Dataplex EntryLinks" },
                        updates: { type: "ARRAY", description: "List of glossary mappings to apply" }
                    },
                    required: ["tableId"]
                }
            },
            {
                name: "propagate_policy_tags",
                description: "Analyzes column lineage to recommend and propagate sensitive data policy tags with straight-pull detection and access summaries",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        datasetId: { type: "STRING" },
                        targetTable: { type: "STRING" },
                        apply: { type: "BOOLEAN" },
                        updates: { type: "ARRAY" }
                    },
                    required: ["targetTable"]
                }
            },
            {
                name: "calculate_data_trust_scores",
                description: "Calculates derived Data Trust Scores (DQ) across multi-hop lineage, applying remediation bonuses and trend analysis",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        datasetId: { type: "STRING" },
                        tableId: { type: "STRING" }
                    },
                    required: ["tableId"]
                }
            },
            {
                name: "ingest_governance_document",
                description: "Ingests unstructured data dictionaries, PDFs, markdown, or policy documents into the governance RAG engine",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        content: { type: "STRING" },
                        fileName: { type: "STRING" },
                        fileType: { type: "STRING" }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "query_governance_rag",
                description: "Queries indexed governance documents and policies for table/column definitions and rules",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tableName: { type: "STRING" },
                        columnName: { type: "STRING" },
                        domain: { type: "STRING" }
                    }
                }
            },
            {
                name: "manage_dataplex_scans",
                description: "Lists or triggers Dataplex Data Quality and Data Profile scans on target entities",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        action: { type: "STRING", description: "'list' or 'trigger'" },
                        scanId: { type: "STRING" },
                        scanType: { type: "STRING", description: "'DATA_QUALITY' or 'DATA_PROFILE'" },
                        targetEntity: { type: "STRING" }
                    },
                    required: ["action"]
                }
            },
            {
                name: "get_estate_governance_summary",
                description: "Returns the comprehensive Estate Dashboard metrics including metadata gap percentage, trust score, and policy coverage",
                parameters: {
                    type: "OBJECT",
                    properties: {}
                }
            }
        ];
    }

    async callTool(toolName, args, traceId) {
        logger.log('DataplexAgent', `Invoked tool ${toolName}`, 'INFO', args, traceId);
        
        switch (toolName) {
            case "evaluate_policy":
                return this.evaluatePolicy(args.domain, args.dataProduct, traceId);
            case "tag_entity":
                return this.tagEntity(args.entityId, args.tag, traceId);
            case "track_lineage":
                return this.trackLineage(args.source, args.target, args.relationship, traceId);
            case "scan_metadata_gaps":
                return governancePropagator.scanForMissingDescriptions(args.sourceId, args.datasetId);
            case "propagate_lineage_descriptions":
                if (args.apply && args.updates) {
                    return governancePropagator.applyPropagation(args.datasetId, args.updates);
                }
                return governancePropagator.previewPropagation(args.datasetId, args.targetTable);
            case "map_ai_business_glossary":
                if (args.apply && args.updates) {
                    return governancePropagator.applyGlossaryTerms(args.datasetId, args.tableId, args.updates);
                }
                return governancePropagator.recommendGlossaryTerms(args.datasetId, args.tableId);
            case "propagate_policy_tags":
                if (args.apply && args.updates) {
                    return governancePropagator.applyPolicyTags(args.datasetId, args.updates);
                }
                return governancePropagator.previewPolicyTagPropagation(args.datasetId, args.targetTable);
            case "calculate_data_trust_scores":
                return governancePropagator.propagateDQScores(args.datasetId, args.tableId);
            case "ingest_governance_document":
                return documentRAGEngine.ingestDocument(args);
            case "query_governance_rag":
                return documentRAGEngine.queryRelevantMetadata(args);
            case "manage_dataplex_scans":
                if (args.action === 'trigger') {
                    return governancePropagator.triggerDataplexScan(args.scanId, args.scanType, args.targetEntity);
                }
                return governancePropagator.listDataplexScans();
            case "get_estate_governance_summary":
                return governancePropagator.getEstateSummary();
            default:
                throw new Error(`Tool ${toolName} not found in DataplexAgent`);
        }
    }

    async evaluatePolicy(domain, dataProduct, traceId) {
        let policies = { rules: [] };
        if (fs.existsSync(this.policiesPath)) {
            policies = JSON.parse(fs.readFileSync(this.policiesPath, 'utf8'));
        }

        const domainRule = policies.rules.find((r) => r.domain === domain);
        if (!domainRule) {
            return { status: "PASSED", reason: "No specific policy for this domain. Standard policy applied." };
        }

        if (domainRule.maskFields && dataProduct) {
            const ruleType = domainRule.maskingRule || 'redact';
            domainRule.maskFields.forEach((field) => {
                if (dataProduct[field] !== undefined && dataProduct[field] !== null) {
                    if (ruleType === 'hash') {
                        dataProduct[field] = `[HASHED_${Buffer.from(String(dataProduct[field])).toString('hex').slice(0, 8)}]`;
                    } else if (ruleType === 'nullify') {
                        dataProduct[field] = null;
                    } else {
                        dataProduct[field] = "****MASKED****";
                    }
                }
            });
            return { status: "MODIFIED", reason: `Applied '${ruleType}' policy masking to sensitive fields: ${domainRule.maskFields.join(', ')}`, dataProduct };
        }

        return { status: "PASSED", reason: "All policies satisfied." };
    }

    async tagEntity(entityId, tag, traceId) {
        logger.log('DataplexAgent', `Tagged ${entityId} with ${tag}`, 'INFO', null, traceId);
        return { message: `Entity ${entityId} tagged with ${tag}` };
    }

    async trackLineage(source, target, relationship, traceId) {
        logger.log('DataplexAgent', `Tracked Lineage: ${source} -> ${target} (${relationship || 'accessed'})`, 'INFO', null, traceId);
        
        try {
            const lineagePath = path.join(__dirname, '../config/lineage.json');
            let lineageData = { edges: [] };
            if (fs.existsSync(lineagePath)) {
                lineageData = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
            }
            
            const exists = lineageData.edges.find((e) => e.source === source && e.target === target);
            if (!exists) {
                lineageData.edges.push({
                    source,
                    target,
                    relationship: relationship || 'accessed',
                    timestamp: new Date().toISOString()
                });
                fs.writeFileSync(lineagePath, JSON.stringify(lineageData, null, 2));
            }
            
            return { status: "SUCCESS", message: `Lineage recorded from ${source} to ${target}` };
        } catch (error) {
            logger.log('DataplexAgent', `Failed to record lineage: ${error.message}`, 'ERROR', null, traceId);
            return { status: "ERROR", message: `Failed to record lineage: ${error.message}` };
        }
    }
}
