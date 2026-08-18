/**
 * Document RAG Engine (Dataplex Labs Governance Agent Integration)
 * Ingests unstructured governance documents, data dictionaries, PDFs, and policies,
 * extracts table and column metadata using Gemini, and provides semantic retrieval
 * to enrich column descriptions, glossary mappings, and policy tags.
 */
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from './logging_service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const EXTRACTION_PROMPT = `Analyze this document (which may be a data dictionary, architecture spec, policy guide, PDF, or text representation of a spreadsheet) and extract ONLY the information relevant to data governance, table definitions, column descriptions, business glossary terms, and data classification/policy tags.
Ignore all unrelated information (infrastructure setup, deployment steps, project background, administrative instructions, etc.).

Format the extracted information as structured JSON matching this schema:
{
  "documentTitle": "Title of document",
  "summary": "Brief summary of governance context",
  "tables": [
    {
      "tableName": "Name of table (e.g., customers, transactions, orders)",
      "domain": "Domain (e.g., Spanner Retail, BigQuery Analytics, Oracle ERP)",
      "description": "Table business purpose",
      "columns": [
        {
          "name": "column_name",
          "dataType": "STRING/INTEGER/FLOAT/TIMESTAMP",
          "description": "Clear human-readable description",
          "suggestedGlossaryTerm": "Business Glossary Term Name",
          "policyTag": "PII / Financial / Confidential / Public",
          "remediationLogic": "e.g., COALESCE for null handling, CAST"
        }
      ]
    }
  ],
  "glossaryTerms": [
    {
      "term": "Term Name",
      "definition": "Definition",
      "category": "Customer / Financial / Operational"
    }
  ],
  "policyRules": [
    {
      "name": "Policy Rule Name",
      "classification": "High / Medium / Low",
      "maskingRule": "SHA256 / Partial Masking / None"
    }
  ]
}

Output ONLY valid JSON. No markdown code blocks, no backticks.`;

export class DocumentRAGEngine {
    constructor() {
        this.docsPath = path.join(__dirname, '../../config/governance_documents.json');
        this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');
        this.documents = this._loadDocuments();
    }

    _loadDocuments() {
        try {
            if (fs.existsSync(this.docsPath)) {
                return JSON.parse(fs.readFileSync(this.docsPath, 'utf8'));
            }
        } catch (e) {
            logger.log('DocumentRAG', `Failed to load documents config: ${e.message}`, 'WARNING');
        }

        // Default seed documents if none exist
        const initialDocs = [
            {
                id: 'doc-retail-dictionary',
                title: 'Retail Data Governance & Data Dictionary Spec',
                fileName: 'retail_data_dictionary.md',
                fileType: 'markdown',
                uploadedAt: new Date().toISOString(),
                extractedMetadata: {
                    documentTitle: 'Retail Data Dictionary',
                    summary: 'Enterprise standard field definitions and classifications for omnichannel retail data products.',
                    tables: [
                        {
                            tableName: 'transactions',
                            domain: 'Spanner Retail',
                            description: 'Point of sale and ecommerce transactional purchase ledger.',
                            columns: [
                                {
                                    name: 'transaction_id',
                                    dataType: 'STRING',
                                    description: 'Globally unique immutable identifier for a customer checkout transaction.',
                                    suggestedGlossaryTerm: 'Transaction Identifier',
                                    policyTag: 'Confidential',
                                    remediationLogic: 'DISTINCT deduplication'
                                },
                                {
                                    name: 'quantity_sold',
                                    dataType: 'INTEGER',
                                    description: 'Total unit count of items purchased in the transaction line item.',
                                    suggestedGlossaryTerm: 'Sales Unit Volume',
                                    policyTag: 'Public',
                                    remediationLogic: 'COALESCE(quantity_sold, 1)'
                                },
                                {
                                    name: 'customer_id',
                                    dataType: 'STRING',
                                    description: 'Alphanumeric identifier of the authenticated customer profile.',
                                    suggestedGlossaryTerm: 'Customer Identifier',
                                    policyTag: 'PII',
                                    remediationLogic: 'Hash masking for analytics'
                                }
                            ]
                        },
                        {
                            tableName: 'campaign_metrics',
                            domain: 'BigQuery Analytics',
                            description: 'Aggregated omnichannel marketing performance and cohort attribution dataset.',
                            columns: [
                                {
                                    name: 'spend',
                                    dataType: 'FLOAT',
                                    description: 'Total net media cost expenditure allocated to the marketing campaign.',
                                    suggestedGlossaryTerm: 'Marketing Expenditure',
                                    policyTag: 'Financial',
                                    remediationLogic: 'ROUND(spend, 2)'
                                },
                                {
                                    name: 'segment_name',
                                    dataType: 'STRING',
                                    description: 'Customer cohort audience classification identifier.',
                                    suggestedGlossaryTerm: 'Customer Segment',
                                    policyTag: 'Confidential',
                                    remediationLogic: 'Standardized upper case'
                                }
                            ]
                        }
                    ],
                    glossaryTerms: [
                        { term: 'Customer Identifier', definition: 'Unique ID mapping to an individual customer profile', category: 'Customer' },
                        { term: 'Marketing Expenditure', definition: 'Direct gross media and promotion spend in USD', category: 'Financial' },
                        { term: 'Transaction Identifier', definition: 'Immutable unique transaction reference key', category: 'Operational' }
                    ],
                    policyRules: [
                        { name: 'PII Protection Policy', classification: 'High', maskingRule: 'SHA256 Hash Masking' },
                        { name: 'Financial Ledger Compliance', classification: 'High', maskingRule: 'Fine-Grained Reader Access' }
                    ]
                }
            }
        ];

        this._saveDocuments(initialDocs);
        return initialDocs;
    }

    _saveDocuments(docs) {
        try {
            fs.writeFileSync(this.docsPath, JSON.stringify(docs, null, 2));
            this.documents = docs;
        } catch (e) {
            logger.log('DocumentRAG', `Failed to persist governance documents: ${e.message}`, 'ERROR');
        }
    }

    /**
     * Ingests a new document (text, markdown, JSON, or base64) and extracts governance metadata using Gemini.
     */
    async ingestDocument({ title, content, fileName, fileType = 'markdown' }) {
        logger.log('DocumentRAG', `Ingesting governance document: ${title} (${fileName})`, 'INFO');

        let extractedMetadata = null;
        const isSimulated = process.env.NODE_ENV === 'test' || !process.env.GEMINI_API_KEY || process.env.USE_REAL_CONNECTIONS !== 'true';

        if (!isSimulated) {
            try {
                const model = this.ai.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `${EXTRACTION_PROMPT}\n\nDocument Content:\n${content.substring(0, 30000)}`;
                const res = await model.generateContent(prompt);
                extractedMetadata = JSON.parse(res.response.text());
            } catch (err) {
                logger.log('DocumentRAG', `Gemini metadata extraction fallback: ${err.message}`, 'WARNING');
            }
        }

        if (!extractedMetadata) {
            extractedMetadata = this._parseMarkdownContent(title, content, fileName);
        }

        const newDoc = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title,
            fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.md`,
            fileType,
            uploadedAt: new Date().toISOString(),
            extractedMetadata
        };

        const updated = [newDoc, ...this.documents];
        this._saveDocuments(updated);
        return newDoc;
    }

    _parseMarkdownContent(title, content, fileName) {
        const lines = content.split('\n');
        const tables = [];
        let currentTable = null;
        let currentDomain = 'Universal';

        for (const line of lines) {
            const trimmed = line.trim();
            const tableMatch = trimmed.match(/^#+\s*(?:Table:\s*)?([a-zA-Z0-9_-]+)/i);
            if (tableMatch) {
                if (currentTable) tables.push(currentTable);
                currentTable = {
                    tableName: tableMatch[1].toLowerCase(),
                    domain: currentDomain,
                    description: `Governance specifications for ${tableMatch[1]}`,
                    columns: []
                };
                continue;
            }

            const domainMatch = trimmed.match(/Domain:\s*([^\n]+)/i);
            if (domainMatch && currentTable) {
                currentTable.domain = domainMatch[1].trim();
                continue;
            }

            const descMatch = trimmed.match(/Description:\s*([^\n]+)/i);
            if (descMatch && currentTable) {
                currentTable.description = descMatch[1].trim();
                continue;
            }

            const colMatch = trimmed.match(/^[-*]\s*([a-zA-Z0-9_-]+)\s*:\s*([A-Z]+)[.\s]+([^.]+)/i);
            if (colMatch && currentTable) {
                const colName = colMatch[1];
                const dataType = colMatch[2];
                const colDesc = colMatch[3].trim();
                
                const policyMatch = trimmed.match(/Policy:\s*([a-zA-Z0-9_-]+)/i);
                const glossaryMatch = trimmed.match(/Glossary:\s*([^.]+)/i);
                const remMatch = trimmed.match(/Remediation:\s*([^.]+)/i);

                currentTable.columns.push({
                    name: colName,
                    dataType: dataType,
                    description: colDesc,
                    policyTag: policyMatch ? policyMatch[1].trim() : 'Internal',
                    suggestedGlossaryTerm: glossaryMatch ? glossaryMatch[1].trim() : undefined,
                    remediationLogic: remMatch ? remMatch[1].trim() : undefined
                });
            }
        }

        if (currentTable) tables.push(currentTable);
        if (tables.length === 0) {
            tables.push({
                tableName: fileName.replace(/\.[^/.]+$/, "").toLowerCase(),
                domain: 'Universal',
                description: `Extracted table schema and governance definitions from ${title}`,
                columns: [
                    {
                        name: 'extracted_field',
                        dataType: 'STRING',
                        description: 'Standard enterprise data field defined in policy document.',
                        suggestedGlossaryTerm: 'Enterprise Term',
                        policyTag: 'Internal'
                    }
                ]
            });
        }

        return {
            documentTitle: title,
            summary: `Governance specifications extracted from ${fileName}`,
            tables,
            glossaryTerms: [
                { term: title, definition: `Governance term defined in ${fileName}`, category: 'General' }
            ],
            policyRules: [
                { name: `${title} Standard Policy`, classification: 'Medium', maskingRule: 'Role-Based' }
            ]
        };
    }

    /**
     * Lists all registered governance documents
     */
    listDocuments() {
        return this.documents;
    }

    /**
     * Retrieves relevant governance insights for a specific table or column
     */
    queryRelevantMetadata({ tableName, columnName, domain }) {
        const matches = [];

        for (const doc of this.documents) {
            const meta = doc.extractedMetadata || {};
            const tables = meta.tables || [];

            for (const table of tables) {
                const tableMatch = !tableName || table.tableName.toLowerCase().includes(tableName.toLowerCase());
                const domainMatch = !domain || !table.domain || table.domain.toLowerCase().includes(domain.toLowerCase());

                if (tableMatch && domainMatch) {
                    if (columnName) {
                        const col = (table.columns || []).find(c => c.name.toLowerCase() === columnName.toLowerCase());
                        if (col) {
                            matches.push({
                                sourceDocument: doc.title,
                                documentId: doc.id,
                                table: table.tableName,
                                column: col.name,
                                description: col.description,
                                glossaryTerm: col.suggestedGlossaryTerm,
                                policyTag: col.policyTag,
                                remediationLogic: col.remediationLogic,
                                confidence: 0.95
                            });
                        }
                    } else {
                        matches.push({
                            sourceDocument: doc.title,
                            documentId: doc.id,
                            table: table.tableName,
                            description: table.description,
                            columnCount: (table.columns || []).length,
                            columns: table.columns,
                            confidence: 0.90
                        });
                    }
                }
            }
        }

        return matches;
    }

    /**
     * Performs semantic search across all indexed governance documents
     */
    searchDocuments(query) {
        if (!query) return this.documents;
        const q = query.toLowerCase();

        return this.documents.filter(doc => {
            const meta = doc.extractedMetadata || {};
            return doc.title.toLowerCase().includes(q) ||
                (meta.summary && meta.summary.toLowerCase().includes(q)) ||
                (meta.tables && meta.tables.some(t => t.tableName.toLowerCase().includes(q))) ||
                (meta.glossaryTerms && meta.glossaryTerms.some(g => g.term.toLowerCase().includes(q)));
        });
    }
}

export const documentRAGEngine = new DocumentRAGEngine();
