/**
 * Agentic Data Mesh: Catalog & Governance Utility
 * Centralizes agent discovery, enforces data contracts,
 * and provides a MetadataCatalog for schema introspection.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../../');

// --------------------------------------------------------------------------
// Data Product Contract
// --------------------------------------------------------------------------

/**
 * The Standard Data Product Contract.
 * Every agent in the mesh MUST return an object that satisfies this structure.
 */
export const DataProductContract = {
    domain: (val) => typeof val === 'string' && val.length > 0,
    data: (val) => typeof val === 'string' || (typeof val === 'object' && val !== null),
    metadata: (val) => typeof val === 'object' && val !== null && 'confidence' in val && 'source' in val,
    insights: (val) => typeof val === 'string'
};

/**
 * Validates a Data Product against the mesh contract.
 */
export function validateDataProduct(product, agentName) {
    const errors = [];
    for (const [key, validator] of Object.entries(DataProductContract)) {
        if (!(key in product) || !validator(product[key])) {
            errors.push(`Missing or invalid field: ${key}`);
        }
    }
    if (errors.length > 0) {
        console.error(`[Data Contract Violation] Agent: ${agentName}`, errors);
        throw new Error(`Data Product from ${agentName} violated the mesh contract: ${errors.join(', ')}`);
    }
    return product;
}

// --------------------------------------------------------------------------
// Agent Registry
// --------------------------------------------------------------------------

export const AgentRegistry = [
    {
        id: "financial_agent",
        name: "FinancialAgent",
        domain: "Finance",
        specialty: "Oracle ERP, Invoices, Suppliers, Graph Grounding",
        toolName: "call_financial_agent",
        dataSource: "oracle"
    },
    {
        id: "retail_agent",
        name: "RetailAgent",
        domain: "Retail",
        specialty: "Spanner Global Inventory, Transactions, Supply Chain Grounding",
        toolName: "call_retail_agent",
        dataSource: "spanner"
    },
    {
        id: "analytics_agent",
        name: "AnalyticsAgent",
        domain: "Analytics",
        specialty: "BigQuery Marketing Segments, AlloyDB CRM Data",
        toolName: "call_analytics_agent",
        dataSource: "bigquery,alloydb"
    },
    {
        id: "hr_agent",
        name: "HRAgent",
        domain: "HR",
        specialty: "Oracle HR, Employee Recruitment, Department Resource Planning",
        toolName: "call_hr_agent",
        dataSource: "oracle_hr"
    },
    {
        id: "catalog_agent",
        name: "CatalogAgent",
        domain: "Catalog",
        specialty: "Cross-Domain Metadata Intelligence, Schema Discovery, Entity Resolution, Lineage",
        toolName: "call_catalog_agent",
        dataSource: "all"
    }
];

/**
 * Generates the Gemini function declarations for the Orchestrator
 * dynamically from the Agent Registry.
 */
export function getDiscoveryTools() {
    return [
        {
            functionDeclarations: AgentRegistry.map(agent => ({
                name: agent.toolName,
                description: `Delegate a query to the ${agent.domain} Specialist (${agent.specialty}).`,
                parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
            }))
        }
    ];
}

// --------------------------------------------------------------------------
// Metadata Catalog — Schema Introspection Engine
// --------------------------------------------------------------------------

/**
 * MetadataCatalog: Parses all DB schema SQL files and builds an in-memory
 * metadata graph of sources → entities → attributes → relationships.
 */
export class MetadataCatalog {
    constructor() {
        this.sources = {};
        this.entities = {};
        this.relationships = [];
        this.crossDomainLinks = [];
        this.lineage = [];
        this._initialized = false;
    }

    /**
     * Initialize the catalog by parsing all schema files.
     */
    initialize() {
        if (this._initialized) return;

        // Load catalog agent config for schema paths and cross-domain keys
        let catalogConfig = {};
        const configPath = path.join(ROOT_DIR, 'config', 'catalog_agent.json');
        if (fs.existsSync(configPath)) {
            catalogConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        // Load data sources config
        let dataSourcesConfig = {};
        const dsPath = path.join(ROOT_DIR, 'config', 'data_sources.json');
        if (fs.existsSync(dsPath)) {
            dataSourcesConfig = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
        }

        // Register sources from data_sources.json
        if (dataSourcesConfig.sources) {
            for (const [sourceId, source] of Object.entries(dataSourcesConfig.sources)) {
                this.sources[sourceId] = {
                    id: sourceId,
                    name: source.name,
                    domain: source.domain,
                    mode: dataSourcesConfig.mode || 'local',
                    schemaFile: source.schema_file,
                    status: 'active'
                };
            }
        }

        // Parse schema files
        const schemaPaths = catalogConfig.schema_sources || [];
        for (const schemaRelPath of schemaPaths) {
            const fullPath = path.join(ROOT_DIR, schemaRelPath);
            if (fs.existsSync(fullPath)) {
                const sql = fs.readFileSync(fullPath, 'utf8');
                const sourceId = this._inferSourceId(schemaRelPath);
                this._parseSchemaDDL(sql, sourceId);
            }
        }

        // Build cross-domain links from config
        const crossDomainKeys = catalogConfig.cross_domain_keys || {};
        for (const [keyName, locations] of Object.entries(crossDomainKeys)) {
            for (let i = 0; i < locations.length; i++) {
                for (let j = i + 1; j < locations.length; j++) {
                    this.crossDomainLinks.push({
                        key: keyName,
                        sourceA: locations[i],
                        sourceB: locations[j],
                        type: 'CROSS_DOMAIN',
                        confidence: 1.0
                    });
                }
            }
        }

        // Build lineage from agent registry
        for (const agent of AgentRegistry) {
            if (agent.dataSource === 'all') continue;
            const sources = agent.dataSource.split(',');
            for (const src of sources) {
                this.lineage.push({
                    agentId: agent.id,
                    agentName: agent.name,
                    sourceId: src.trim(),
                    direction: 'CONSUMES',
                    accessPattern: 'MCP'
                });
            }
        }

        this._initialized = true;
        console.log(`[MetadataCatalog] Initialized: ${Object.keys(this.entities).length} entities, ${this.relationships.length} relationships, ${this.crossDomainLinks.length} cross-domain links`);
    }

    /**
     * Parse SQL DDL and extract table/column/relationship metadata.
     */
    _parseSchemaDDL(sql, sourceId) {
        const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w.]+\.)?(\w+)\s*\(([\s\S]*?)\)(?:\s*(?:PRIMARY\s+KEY|PARTITION|CLUSTER|INTERLEAVE|;))/gi;

        let match;
        while ((match = tableRegex.exec(sql)) !== null) {
            const tableName = match[1];
            const body = match[2];
            const entityId = `${sourceId}.${tableName}`;

            this.entities[entityId] = {
                id: entityId,
                sourceId,
                name: tableName,
                type: 'TABLE',
                attributes: [],
                description: ''
            };

            // Parse columns
            const lines = body.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('CONSTRAINT')) continue;

                // Match column definition: column_name TYPE ...
                const colMatch = trimmed.match(/^(\w+)\s+(\w[\w\s(),.]*?)(?:\s+(?:NOT\s+NULL|PRIMARY\s+KEY|DEFAULT|REFERENCES|OPTIONS|UNIQUE|GENERATED)|\s*,?\s*$)/i);
                if (colMatch) {
                    const colName = colMatch[1].toUpperCase() === 'CREATE' ? null : colMatch[1];
                    if (!colName || ['PRIMARY', 'KEY', 'FOREIGN', 'UNIQUE', 'INDEX', 'CONSTRAINT', 'CREATE', 'INTERLEAVE'].includes(colName.toUpperCase())) continue;

                    const dataType = colMatch[2].trim().replace(/,\s*$/, '');
                    const isPK = /PRIMARY\s+KEY/i.test(trimmed);
                    const isFK = /REFERENCES/i.test(trimmed);
                    const isVector = /VECTOR|vector|embedding|ARRAY\s*<\s*FLOAT/i.test(dataType);

                    let semanticTag = 'dimension';
                    if (isPK) semanticTag = 'identifier';
                    else if (isVector) semanticTag = 'vector';
                    else if (/amount|total|salary|spend|value|price|cost/i.test(colName)) semanticTag = 'metric';
                    else if (/timestamp|date|created|updated|resolved/i.test(colName)) semanticTag = 'timestamp';
                    else if (/id$/i.test(colName)) semanticTag = 'identifier';

                    const attr = {
                        name: colName,
                        dataType,
                        isPrimaryKey: isPK,
                        isForeignKey: isFK,
                        semanticTag,
                        isVector
                    };

                    this.entities[entityId].attributes.push(attr);

                    // Extract FK relationships
                    if (isFK) {
                        const fkMatch = trimmed.match(/REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
                        if (fkMatch) {
                            this.relationships.push({
                                sourceEntity: entityId,
                                sourceAttribute: colName,
                                targetEntity: `${sourceId}.${fkMatch[1]}`,
                                targetAttribute: fkMatch[2],
                                type: 'FK'
                            });
                        }
                    }
                }
            }
        }

        // Detect graph entities with detailed node/edge parsing
        const graphRegex = /CREATE\s+(?:PROPERTY\s+)?GRAPH\s+(\w+)\s+([\s\S]*?);/gi;
        while ((match = graphRegex.exec(sql)) !== null) {
            const graphName = match[1];
            let graphBody = match[2].trim();
            // Remove trailing ')' if it exists before ';'
            if (graphBody.endsWith(')')) graphBody = graphBody.slice(0, -1);
            
            const entityId = `${sourceId}.${graphName}`;

            const graphEntity = {
                id: entityId,
                sourceId,
                name: graphName,
                type: 'GRAPH',
                nodes: [],
                edges: [],
                description: `Property graph in ${sourceId}`
            };

            // Parse NODE/VERTEX TABLES
            const nodeMatch = graphBody.match(/(?:NODE|VERTEX)\s+TABLES\s*\(([\s\S]*?)\)(?:\s+EDGE\s+TABLES|$)/i);
            if (nodeMatch) {
                const nodesRaw = nodeMatch[1].split(/,(?![^(]*\))/g);
                graphEntity.nodes = nodesRaw.map(n => {
                    const parts = n.trim().split(/\s+/);
                    // Match LABEL or use table name
                    const labelMatch = n.match(/LABEL\s+(\w+)/i);
                    if (labelMatch) return labelMatch[1];
                    // If no label, use first part (table name)
                    return parts[0].replace(/[()]/g, '');
                });
            }

            // Parse EDGE TABLES
            const edgeMatch = graphBody.match(/EDGE\s+TABLES\s*\(([\s\S]*?)\)(?:\s*(?:$|;))/i);
            if (edgeMatch) {
                const edgesRaw = edgeMatch[1].split(/,(?![^(]*\))/g);
                graphEntity.edges = edgesRaw.map(e => {
                    const parts = e.trim().split(/\s+/);
                    const tableName = parts[0];
                    const labelMatch = e.match(/LABEL\s+(\w+)/i);
                    const edgeTypeMatch = e.match(/AS\s+(\w+)/i);
                    const label = labelMatch ? labelMatch[1] : (edgeTypeMatch ? edgeTypeMatch[1] : tableName);
                    return { table: tableName, label };
                });
            }


            this.entities[entityId] = graphEntity;
        }


        // Detect vector indexes
        const vectorIdxRegex = /CREATE\s+(?:VECTOR\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(\s*(\w+)\s*\)/gi;
        while ((match = vectorIdxRegex.exec(sql)) !== null) {
            const idxName = match[1];
            this.entities[`${sourceId}.${idxName}`] = {
                id: `${sourceId}.${idxName}`,
                sourceId,
                name: idxName,
                type: 'VECTOR_INDEX',
                attributes: [{ name: match[3], dataType: 'vector' }],
                description: `Vector index on ${match[2]}.${match[3]}`
            };
        }

    }

    /**
     * Infer source ID from schema file path.
     */
    _inferSourceId(schemaPath) {
        const basename = path.basename(schemaPath, '.sql');
        return basename.replace('_schema', '');
    }

    // --- Public Query Methods ---

    /**
     * Get the full catalog summary.
     */
    getCatalog() {
        this.initialize();
        return {
            sources: this.sources,
            entities: this.entities,
            relationships: this.relationships,
            crossDomainLinks: this.crossDomainLinks,
            lineage: this.lineage,
            stats: {
                totalSources: Object.keys(this.sources).length,
                totalEntities: Object.keys(this.entities).length,
                totalRelationships: this.relationships.length,
                totalCrossDomainLinks: this.crossDomainLinks.length
            }
        };
    }

    /**
     * Search entities by name (fuzzy match).
     */
    searchEntities(query) {
        this.initialize();
        const q = query.toLowerCase();
        const results = [];

        for (const [id, entity] of Object.entries(this.entities)) {
            const nameMatch = entity.name.toLowerCase().includes(q);
            const attrMatch = entity.attributes?.some(a => a.name.toLowerCase().includes(q));
            const descMatch = entity.description?.toLowerCase().includes(q);

            if (nameMatch || attrMatch || descMatch) {
                results.push({
                    ...entity,
                    matchType: nameMatch ? 'name' : attrMatch ? 'attribute' : 'description',
                    source: this.sources[entity.sourceId]
                });
            }
        }

        return results;
    }

    /**
     * Get the schema for a specific domain.
     */
    getSchemaForDomain(domain) {
        this.initialize();
        const domainSources = Object.values(this.sources).filter(s =>
            s.domain.toLowerCase() === domain.toLowerCase()
        );
        const sourceIds = domainSources.map(s => s.id);
        const entities = Object.values(this.entities).filter(e =>
            sourceIds.includes(e.sourceId)
        );
        return { sources: domainSources, entities };
    }

    /**
     * Get cross-domain lineage for a specific entity or attribute name.
     */
    getEntityLineage(entityName) {
        this.initialize();
        const q = entityName.toLowerCase();

        // Find matching cross-domain links
        const links = this.crossDomainLinks.filter(l =>
            l.key.toLowerCase().includes(q) ||
            l.sourceA.toLowerCase().includes(q) ||
            l.sourceB.toLowerCase().includes(q)
        );

        // Find matching entity references
        const entities = Object.values(this.entities).filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.attributes?.some(a => a.name.toLowerCase().includes(q))
        );

        // Find relevant agent lineage
        const agents = this.lineage.filter(l => {
            const relevantSources = entities.map(e => e.sourceId);
            return relevantSources.includes(l.sourceId);
        });

        return { links, entities, agents };
    }

    /**
     * Get a compact metadata summary for grounding context.
     */
    getGroundingContext(domain) {
        this.initialize();
        const schema = this.getSchemaForDomain(domain);
        if (schema.entities.length === 0) return '';

        let context = `\n[CATALOG CONTEXT - ${domain.toUpperCase()}]\n`;
        context += `Sources: ${schema.sources.map(s => s.name).join(', ')}\n`;
        
        // 1. Tables/Views
        const tables = schema.entities.filter(e => e.type === 'TABLE' || e.type === 'VIEW');
        if (tables.length > 0) {
            context += `Tables:\n`;
            for (const entity of tables) {
                const cols = entity.attributes.map(a =>
                    `${a.name}(${a.semanticTag})`
                ).join(', ');
                context += `  - ${entity.name}: ${cols}\n`;
            }
        }

        // 2. Property Graphs (Nodes & Edges)
        const graphs = schema.entities.filter(e => e.type === 'GRAPH');
        if (graphs.length > 0) {
            context += `Graphs:\n`;
            for (const graph of graphs) {
                context += `  - Name: ${graph.name}\n`;
                context += `    Nodes: ${graph.nodes?.join(', ')}\n`;
                context += `    Edges: ${graph.edges?.map(e => `${e.table}(${e.label})`).join(', ')}\n`;
            }
        }

        // 3. Cross-domain connections
        const relevantLinks = this.crossDomainLinks.filter(l =>
            schema.entities.some(e =>
                l.sourceA.includes(e.sourceId) || l.sourceB.includes(e.sourceId)
            )
        );
        if (relevantLinks.length > 0) {
            context += `Cross-domain links:\n`;
            for (const link of relevantLinks) {
                context += `  - ${link.key}: ${link.sourceA} ↔ ${link.sourceB}\n`;
            }
        }

        return context;
    }
}


// Singleton instance
export const metadataCatalog = new MetadataCatalog();
