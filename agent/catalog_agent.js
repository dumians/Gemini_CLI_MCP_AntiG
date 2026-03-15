/**
 * Agentic Data Mesh: Catalog Agent
 * Metadata-focused agent for schema introspection, entity resolution, and lineage.
 * Does not query business data directly; acts as the mesh map.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { metadataCatalog, validateDataProduct } from "./utils/catalog.js";
import { logger } from "./utils/logging_service.js";
import { groundWithCatalogContext, groundingInstructions } from "./utils/grounding.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CatalogAgent {
    constructor() {
        this.config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/catalog_agent.json'), 'utf8'));
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({
            model: this.config.model,
            systemInstruction: `${this.config.system_instruction_prefix}\n\n` +
                `Your mission is to map the Agentic Data Mesh. You have access to a logical Metadata Catalog.\n` +
                `You answer questions about WHERE data is, WHAT schemas look like, and HOW entities relate across domains.\n` +
                `You also identify 'data contracts' and lineage.\n\n` +
                `You do NOT have access to live business data (rows), but you know all table structures.\n` +
                `Always use the shared MetadataCatalog tools provided below.\n\n` +
                groundingInstructions
        });

        this.tools = {
            get_full_catalog: () => metadataCatalog.getCatalog(),
            search_entities: ({ query }) => metadataCatalog.searchEntities(query),
            get_domain_schema: ({ domain }) => metadataCatalog.getSchemaForDomain(domain),
            get_entity_lineage: ({ entityName }) => metadataCatalog.getEntityLineage(entityName)
        };
    }

    /**
     * Main entry point for the Catalog Agent.
     */
    async process(query, meshContext = {}, traceId = null) {
        const startTime = Date.now();
        logger.log('CatalogAgent', `Processing metadata query: "${query}"`, 'INFO', null, traceId);

        // Inject current catalog context into the grounding for this specific run
        const catalogSummary = metadataCatalog.getCatalog();
        const grounding = `\n[CATALOG STATE]\nSources: ${Object.keys(catalogSummary.sources).join(', ')}\nEntities: ${Object.keys(catalogSummary.entities).length}\nRelationships: ${catalogSummary.relationships.length}`;

        const chat = this.model.startChat({
            history: meshContext.history || [],
            tools: [{
                functionDeclarations: [
                    {
                        name: "get_full_catalog",
                        description: "Returns the complete overview of all sources, entities, and cross-domain links in the mesh."
                    },
                    {
                        name: "search_entities",
                        description: "Fuzzy search for tables, columns, or graphs based on a text query.",
                        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                    },
                    {
                        name: "get_domain_schema",
                        description: "Retrieve all technical metadata for a specific domain (Finance, Retail, etc.)",
                        parameters: { type: "object", properties: { domain: { type: "string" } }, required: ["domain"] }
                    },
                    {
                        name: "get_entity_lineage",
                        description: "Track the lineage of an entity and its cross-domain relationships.",
                        parameters: { type: "object", properties: { entityName: { type: "string" } }, required: ["entityName"] }
                    }
                ]
            }]
        });

        try {
            const result = await chat.sendMessage(query + grounding);
            const response = await result.response;
            let text = response.text();

            // Handle tool calls if any (Gemini might call them during the reasoning phase)
            const calls = response.candidates[0].content.parts.filter(p => p.functionCall);
            let toolResults = [];

            for (const call of calls) {
                const toolName = call.functionCall.name;
                const args = call.functionCall.args;
                logger.logToolCall('CatalogAgent', toolName, args, traceId);

                const toolResult = this.tools[toolName](args);
                toolResults.push(toolResult);
                
                logger.logToolResult('CatalogAgent', toolName, `Found ${Array.isArray(toolResult) ? toolResult.length : 'data'} items`, Date.now() - startTime, traceId);

                // Send tool results back to Gemini for final synthesis
                const secondResult = await chat.sendMessage([{
                    functionResponse: { name: toolName, response: { content: toolResult } }
                }]);
                text = secondResult.response.text();
            }

            const dataProduct = {
                domain: "Catalog",
                data: toolResults.length > 0 ? toolResults : catalogSummary,
                metadata: {
                    confidence: 1.0,
                    source: "MetadataCatalog-Introspection",
                    latency: Date.now() - startTime
                },
                insights: text
            };

            logger.logResponse('CatalogAgent', 'Catalog', dataProduct.metadata.confidence, dataProduct.metadata.latency, traceId);
            return validateDataProduct(dataProduct, 'CatalogAgent');

        } catch (error) {
            logger.log('CatalogAgent', `Error: ${error.message}`, 'ERROR', null, traceId);
            throw error;
        }
    }
}

export const catalogAgent = new CatalogAgent();
