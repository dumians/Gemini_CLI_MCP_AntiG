/**
 * Knowledge Catalog Discovery Service (Dataplex Labs Integration)
 * Implements AI-powered semantic decomposition, multi-query generation,
 * predicate extraction, concurrent Knowledge Catalog search, lookup_context,
 * and result reranking.
 */
import { v1 as dataplexv1 } from '@google-cloud/dataplex';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from './logging_service.js';
import { metadataCatalog } from './catalog.js';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID || 'total-vertex-469513-r8';

export class KnowledgeCatalogDiscoveryService {
    constructor() {
        this.projectId = projectId;
        this.location = process.env.DATAPLEX_ZONE_ID || 'europe-west3';
        this.isSimulationMode = !projectId || process.env.NODE_ENV === 'test' || process.env.USE_REAL_CONNECTIONS !== 'true';

        this.dataplexClient = (!this.isSimulationMode)
            ? new dataplexv1.CatalogServiceClient({ clientOptions: { apiEndpoint: "dataplex.googleapis.com" } })
            : null;
            
        this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');
    }

    /**
     * Step 1 & 2: Semantic Decomposition & Generating Variations + Predicates
     */
    async decomposeQuery(naturalQuery) {
        if (!naturalQuery) return { originalQuery: '', variations: [], predicates: [] };

        const isSimulated = this.isSimulationMode || !process.env.GEMINI_API_KEY;

        if (!isSimulated) {
            try {
                const model = this.ai.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `You are an expert Google Cloud Knowledge Catalog Search assistant.
Analyze this user discovery query: "${naturalQuery}".
Break it down into:
1. "predicates": Extracted Knowledge Catalog filters (e.g. "type=table", "system=bigquery", "projectid=${this.projectId}").
2. "variations": Generate exactly 3 distinct search variations to cast a wide net:
   - Variation 1 (Direct & Synonyms): Core business terms and synonyms.
   - Variation 2 (Data Source Translation): Database technical schema/column naming (e.g. translate "customer acquisition" to "user_signups OR revenue_ledger").
   - Variation 3 (Broader System/Category): Broad category context.
Ensure each query variation incorporates any relevant predicates.

Return JSON format:
{
  "predicates": ["type=table", "projectid=${this.projectId}"],
  "variations": [
    "query variation 1",
    "query variation 2",
    "query variation 3"
  ]
}
Output ONLY valid JSON.`;

                const res = await model.generateContent(prompt);
                const parsed = JSON.parse(res.response.text());
                const combinedPredicates = new Set(parsed.predicates || []);
                const lower = naturalQuery.toLowerCase();
                if (lower.includes('table') || lower.includes('view')) combinedPredicates.add('type=table');
                if (lower.includes('bigquery') || lower.includes('edw')) combinedPredicates.add('system=bigquery');
                if (lower.includes('spanner') || lower.includes('retail')) combinedPredicates.add('system=spanner');
                if (lower.includes('alloydb') || lower.includes('crm')) combinedPredicates.add('system=alloydb');
                if (lower.includes('oracle') || lower.includes('erp')) combinedPredicates.add('system=oracle');
                return {
                    originalQuery: naturalQuery,
                    predicates: Array.from(combinedPredicates),
                    variations: parsed.variations || [naturalQuery]
                };
            } catch (err) {
                logger.log('DiscoveryService', `Gemini decomposition fallback: ${err.message}`, 'WARNING');
            }
        }

        // Rule-based semantic decomposition fallback
        const lower = naturalQuery.toLowerCase();
        const predicates = [];

        if (lower.includes('table') || lower.includes('view')) predicates.push('type=table');
        if (lower.includes('bigquery') || lower.includes('edw')) predicates.push('system=bigquery');
        if (lower.includes('spanner') || lower.includes('retail')) predicates.push('system=spanner');
        if (lower.includes('alloydb') || lower.includes('crm')) predicates.push('system=alloydb');
        if (lower.includes('oracle') || lower.includes('erp')) predicates.push('system=oracle');
        if (this.projectId) predicates.push(`projectid=${this.projectId}`);

        const variations = [
            naturalQuery,
            this._translateToTechnicalSchema(naturalQuery),
            this._broadenCategoryTerms(naturalQuery)
        ];

        return {
            originalQuery: naturalQuery,
            predicates,
            variations: [...new Set(variations)]
        };
    }

    _translateToTechnicalSchema(query) {
        const map = {
            'revenue': 'spend OR total_amount OR gross_revenue',
            'customer': 'customer_id OR customer_profile OR crm_contact',
            'transaction': 'transactions OR order_line_items',
            'campaign': 'campaign_metrics OR ad_spend',
            'inventory': 'warehouse_stock OR product_inventory',
            'employee': 'employee_id OR hr_directory'
        };

        let technical = query.toLowerCase();
        for (const [biz, tech] of Object.entries(map)) {
            if (technical.includes(biz)) {
                technical = technical.replace(biz, tech);
            }
        }
        return technical;
    }

    _broadenCategoryTerms(query) {
        const lower = query.toLowerCase();
        if (lower.includes('retail') || lower.includes('sales')) return 'omnichannel retail sales transaction store';
        if (lower.includes('customer') || lower.includes('crm')) return 'customer accounts contacts lifetime value';
        if (lower.includes('finance') || lower.includes('invoice') || lower.includes('ledger')) return 'financial accounting invoices ledger';
        return `${query} data asset entity`;
    }

    /**
     * Calls LookupContext API via Knowledge Catalog SDK
     */
    async lookupContext(region = 'global', batchEntries = []) {
        if (!batchEntries || batchEntries.length === 0) return { context: "No entries provided" };

        if (this.isSimulationMode || !this.dataplexClient) {
            // Simulated context lookup
            return {
                region,
                batchEntries,
                context: `Context for ${batchEntries.join(', ')}: Verified asset in ${this.projectId} with Dataplex aspect schemas (governance, data_quality, security_privacy). Upstream lineage connected.`,
                aspects: ["governance", "data_quality", "security_privacy"],
                trustScore: 0.96
            };
        }

        try {
            const parentName = `projects/${this.projectId}/locations/${region}`;
            const [response] = await this.dataplexClient.lookupContext({
                name: parentName,
                resources: batchEntries
            });
            return {
                region,
                batchEntries,
                context: response.context || "Context retrieved successfully",
                raw: response
            };
        } catch (err) {
            logger.log('DiscoveryService', `LookupContext fallback: ${err.message}`, 'WARNING');
            return {
                region,
                batchEntries,
                context: `Fallback Context for ${batchEntries.join(', ')}: Active mesh entity under project ${this.projectId}.`,
                aspects: ["governance", "data_quality"],
                trustScore: 0.92
            };
        }
    }

    /**
     * Step 3: Knowledge Catalog Multi-Search & Reranking
     */
    async multiSearch(queries = []) {
        if (!queries || queries.length === 0) return { results: [], totalMatched: 0 };

        logger.log('DiscoveryService', `Executing Knowledge Catalog Multi-Search with ${queries.length} query variations`, 'INFO');

        const allResults = [];
        const seenIds = new Set();

        // 1. Search locally from metadata catalog first
        if (!metadataCatalog._initialized) {
            metadataCatalog.initialize();
        }
        const catalog = metadataCatalog.getCatalog();
        const sources = catalog.sources || {};
        const entities = Object.values(catalog.entities || {});

        for (const query of queries) {
            if (!query || typeof query !== 'string') continue;
            const qLower = query.toLowerCase();
            const qTokens = qLower.split(/\s+/).filter(t => t.length > 2 && !['and', 'the', 'for', 'with', 'from', 'table', 'view'].includes(t));

            for (const entity of entities) {
                const entityName = (entity.name || '').toLowerCase();
                const sourceId = (entity.sourceId || '').toLowerCase();
                const domainName = ((sources[entity.sourceId]?.domain) || entity.domain || 'Omnichannel').toLowerCase();
                const attrs = entity.attributes || [];

                const matchWhole = entityName.includes(qLower) || domainName.includes(qLower) || sourceId.includes(qLower);
                const matchTokens = qTokens.some(tok => 
                    entityName.includes(tok) ||
                    domainName.includes(tok) ||
                    sourceId.includes(tok) ||
                    attrs.some(a => (a.name || '').toLowerCase().includes(tok) || ((a.description || '').toLowerCase().includes(tok)))
                );

                if (matchWhole || matchTokens) {
                    if (!seenIds.has(entity.id)) {
                        seenIds.add(entity.id);
                        allResults.push({
                            entry_name: `projects/${this.projectId}/locations/${this.location}/entryGroups/@${entity.sourceId}/entries/${entity.name}`,
                            id: entity.id,
                            name: entity.name,
                            displayName: entity.name,
                            system: (entity.sourceId || 'GCP').toUpperCase(),
                            domain: sources[entity.sourceId]?.domain || entity.domain || 'Omnichannel',
                            type: entity.type || 'TABLE',
                            description: entity.description || `${sources[entity.sourceId]?.domain || 'Mesh'} data asset`,
                            attributeCount: attrs.length,
                            aspects: entity.aspects || { governance: { classification: "Internal" } },
                            score: matchWhole ? 0.98 : 0.88,
                            matchQuery: query
                        });
                    }
                }
            }
        }

        // 2. Query real Dataplex Semantic Search if live connection is active
        if (!this.isSimulationMode && this.dataplexClient) {
            try {
                const searchPromises = queries.slice(0, 3).map(async (queryStr) => {
                    try {
                        const parentName = `projects/${this.projectId}/locations/global`;
                        const [response] = await this.dataplexClient.searchEntries({
                            name: parentName,
                            query: queryStr,
                            pageSize: 20,
                            semanticSearch: true
                        });
                        return response || [];
                    } catch (e) {
                        return [];
                    }
                });

                const liveResponses = await Promise.all(searchPromises);
                for (const list of liveResponses) {
                    for (const entry of list) {
                        const entryId = entry.name || entry.id;
                        if (entryId && !seenIds.has(entryId)) {
                            seenIds.add(entryId);
                            allResults.push({
                                entry_name: entry.name,
                                id: entry.name,
                                name: entry.displayName || entry.name.split('/').pop(),
                                displayName: entry.displayName || entry.name.split('/').pop(),
                                system: entry.system || 'BIGQUERY',
                                domain: 'Google Cloud Dataplex',
                                type: entry.entryType || 'TABLE',
                                description: entry.description || 'Discovered via Semantic Search',
                                score: 0.98,
                                matchQuery: 'Live Semantic Search'
                            });
                        }
                    }
                }
            } catch (err) {
                logger.log('DiscoveryService', `Live Semantic Search query failed: ${err.message}`, 'WARNING');
            }
        }

        // Fallback default seeds if no entries matched
        if (allResults.length === 0) {
            for (const entity of entities.slice(0, 4)) {
                const sourceDomain = sources[entity.sourceId]?.domain || entity.domain || 'Omnichannel';
                allResults.push({
                    entry_name: `projects/${this.projectId}/locations/${this.location}/entryGroups/@${entity.sourceId}/entries/${entity.name}`,
                    id: entity.id,
                    name: entity.name,
                    displayName: entity.name,
                    system: (entity.sourceId || 'GCP').toUpperCase(),
                    domain: sourceDomain,
                    type: 'TABLE',
                    description: entity.description || 'Mesh data entity',
                    attributeCount: (entity.attributes || []).length,
                    aspects: entity.aspects || { governance: { classification: "Internal" } },
                    score: 0.85,
                    matchQuery: queries[0] || 'Discovery'
                });
            }
        }

        // Reranking by relevance score & domain alignment
        const rankedResults = allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

        return {
            results: rankedResults,
            totalMatched: rankedResults.length,
            queriesUsed: queries
        };
    }

    /**
     * Full End-to-End Discovery Pipeline (Decomposition + Multi-Search + Context Lookup + Reranking)
     */
    async discoverAssets(userQuery) {
        logger.log('DiscoveryService', `Starting Discovery Agent workflow for query: "${userQuery}"`, 'INFO');

        // 1. Semantic Decomposition
        const decomp = await this.decomposeQuery(userQuery);

        // 2. Multi-Search with generated query variations
        const searchResult = await this.multiSearch(decomp.variations);

        // 3. Batch Context Lookup on top ranked entries
        const topEntryNames = searchResult.results.slice(0, 5).map(r => r.entry_name || r.name);
        const contextData = await this.lookupContext(this.location, topEntryNames);

        return {
            userQuery,
            decomposition: decomp,
            rankedResults: searchResult.results,
            contextSummary: contextData.context,
            totalFound: searchResult.totalMatched,
            timestamp: new Date().toISOString()
        };
    }
}

export const kcDiscoveryService = new KnowledgeCatalogDiscoveryService();
