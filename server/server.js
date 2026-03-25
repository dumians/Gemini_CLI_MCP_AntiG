import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { askOrchestrator } from '../agent/orchestrator.js';
import { logger } from '../agent/utils/logging_service.js';
import { metadataCatalog, AgentRegistry } from '../agent/utils/catalog.js';
import { storageProvider } from '../agent/utils/storage_service.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Authentication Endpoints ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Simple auth check against .env
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.log('Auth', `User ${username} logged in successfully`, 'INFO');
        return res.json({ token, user: { username, role: 'admin' } });
    }

    logger.log('Auth', `Failed login attempt for user: ${username}`, 'WARNING');
    res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// Real-time status tracking
let currentStatus = {
    state: "idle",
    lastQuery: null,
    steps: []
};

// --- Agent Factory Endpoint (PROTECTED) ---
app.post('/api/agents', authMiddleware, async (req, res) => {
    const { id, name, domain, specialty, systemInstruction, mcpServers } = req.body;
    if (!id || !name || !domain) {
        return res.status(400).json({ error: "Missing required fields: id, name, domain" });
    }

    const toolName = `call_${id}`;
    const newAgent = {
        id, name, domain, specialty, toolName,
        systemInstruction, mcpServers: mcpServers || [],
        groundingDomain: domain,
        dataSource: (mcpServers || []).map(s => s.name).join(',')
    };

    try {
        const configPath = path.join(__dirname, '../config/agents.json');
        let agents = [];
        if (fs.existsSync(configPath)) {
            agents = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        if (agents.find(a => a.id === id)) {
            return res.status(400).json({ error: `Agent with ID ${id} already exists` });
        }

        agents.push(newAgent);
        fs.writeFileSync(configPath, JSON.stringify(agents, null, 2));

        // Update local memory registry without restart trigger
        AgentRegistry.unshift(newAgent);
        
        logger.log('Server', `Agent ${name} created dynamically via factory endpoint`, 'INFO');
        res.status(201).json({ message: `Agent ${name} created successfully`, agent: newAgent });
    } catch (err) {
        logger.log('Server', `Failed to create agent: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// --- Mesh Query Endpoint (PROTECTED) ---
app.post('/api/query', authMiddleware, async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    logger.log('Server', `Received query: ${query}`, 'INFO');
    currentStatus.state = "processing";
    currentStatus.lastQuery = query;
    currentStatus.steps = [];

    try {
        const userId = req.user ? req.user.username : 'admin';
        const result = await askOrchestrator(query, userId);
        currentStatus.state = "completed";
        currentStatus.steps = result.steps;

        res.json(result);
    } catch (error) {
        logger.log('Server', `Query Error: ${error.message}`, 'ERROR');
        currentStatus.state = "error";
        res.status(500).json({ error: error.message });
    }
});

// --- Catalog & Metadata Endpoints ---

app.get('/api/catalog', authMiddleware, (req, res) => {
    try {
        res.json(metadataCatalog.getCatalog());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/catalog/graph', authMiddleware, (req, res) => {
    try {
        const catalog = metadataCatalog.getCatalog();
        const graphData = { nodes: [], links: [] };

        // 1. Add Source Nodes
        Object.keys(catalog.sources).forEach(srcId => {
            const src = catalog.sources[srcId];
            graphData.nodes.push({ 
                id: srcId, 
                label: src.name, 
                group: 'source', 
                val: 15,
                color: '#4f46e5' // Primary Indigo
            });
        });

        // 2. Add Entity Nodes (Tables and Graphs)
        Object.keys(catalog.entities).forEach(entId => {
            const ent = catalog.entities[entId];
            const isGraph = ent.type === 'PROPERTY_GRAPH';
            
            graphData.nodes.push({
                id: entId,
                label: ent.name,
                group: isGraph ? 'graph' : 'table',
                val: isGraph ? 12 : 8,
                color: isGraph ? '#ec4899' : '#10b981' // Pink for Graph, Emerald for Table
            });

            // Link to Source
            if (ent.sourceId) {
                graphData.links.push({
                    source: ent.sourceId,
                    target: entId,
                    label: 'owns'
                });
            }
        });

        // 3. Link Relationships (Foreign Keys)
        catalog.relationships.forEach(rel => {
            graphData.links.push({
                source: rel.sourceEntity,
                target: rel.targetEntity,
                label: rel.type
            });
        });

        res.json(graphData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Agent & A2A Status Endpoints ---

app.get('/api/status', authMiddleware, (req, res) => {
    res.json({
        ...currentStatus,
        agents: logger.getAgentStatuses()
    });
});

app.get('/api/admin/events', authMiddleware, (req, res) => {
    res.json(logger.getA2AEvents());
});

app.get('/api/admin/logs', authMiddleware, (req, res) => {
    res.json(logger.getLogs());
});

// --- Configuration Endpoints ---

app.get('/api/config/data-sources', authMiddleware, (req, res) => {
    try {
        const config = storageProvider.get('data_sources');
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Failed to load data sources config" });
    }
});

app.post('/api/config/data-sources', authMiddleware, (req, res) => {
    const { id, name, domain, schema_file } = req.body;
    if (!id || !name || !domain) {
        return res.status(400).json({ error: "Missing required fields: id, name, domain" });
    }

    try {
        const schemaPath = schema_file || `db-schemas/${id}_schema.sql`;
        const fullSchemaPath = path.join(__dirname, '..', schemaPath);
        if (!fs.existsSync(fullSchemaPath)) {
            return res.status(400).json({ error: `Connection Validation Failed: Schema file not found at ${schemaPath}. Domain mount aborted.` });
        }

        const dsPath = path.join(__dirname, '../config/data_sources.json'); // Still needed for schema checks if local file existence is checked
        let config = storageProvider.get('data_sources');
        if (!config.sources) config.sources = {};

        config.sources[id] = {
            name,
            domain,
            schema_file: schemaPath
        };

        storageProvider.set('data_sources', config);
        metadataCatalog.reload(); // Sync in-memory graph with new source
        logger.log('Server', `Data source ${name} validated and added dynamically`, 'INFO');
        res.status(201).json({ message: `Data source ${name} validated and added successfully` });
    } catch (error) {
        logger.log('Server', `Failed to add data source: ${error.message}`, 'ERROR');
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/config/data-sources/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { name, domain, schema_file } = req.body;

    if (!name || !domain) {
        return res.status(400).json({ error: "Missing required fields: name, domain" });
    }

    try {
        let config = storageProvider.get('data_sources');
        if (!config.sources) config.sources = {};

        if (!config.sources[id]) {
            return res.status(404).json({ error: `Data source ${id} not found.` });
        }

        config.sources[id] = {
            ...config.sources[id],
            name,
            domain
        };

        if (schema_file) {
            config.sources[id].schema_file = schema_file;
        }

        storageProvider.set('data_sources', config);
        metadataCatalog.reload(); // Sync in-memory graph
        logger.log('Server', `Data source ${id} updated dynamically`, 'INFO');
        res.json({ message: `Data source ${id} updated successfully` });
    } catch (error) {
        logger.log('Server', `Failed to update data source: ${error.message}`, 'ERROR');
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/contracts', authMiddleware, (req, res) => {
    try {
        const contractsPath = path.join(__dirname, '../config/data_contracts.json');
        let contractsData = { contracts: [] };
        if (fs.existsSync(contractsPath)) {
            contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
        }
        res.json(contractsData);
    } catch (error) {
        res.status(500).json({ error: "Failed to load contracts" });
    }
});

app.put('/api/contracts/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { status, sla, privacy } = req.body;

    try {
        const contractsPath = path.join(__dirname, '../config/data_contracts.json');
        let contractsData = { contracts: [] };
        if (fs.existsSync(contractsPath)) {
            contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
        }

        const contractIndex = contractsData.contracts.findIndex(c => c.id === id);
        if (contractIndex === -1) {
            return res.status(404).json({ error: `Contract ${id} not found.` });
        }

        contractsData.contracts[contractIndex] = {
            ...contractsData.contracts[contractIndex],
            status: status || contractsData.contracts[contractIndex].status,
            sla: sla || contractsData.contracts[contractIndex].sla,
            privacy: privacy || contractsData.contracts[contractIndex].privacy
        };

        fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2));
        res.json({ message: `Contract ${id} updated successfully`, data: contractsData.contracts[contractIndex] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products', authMiddleware, (req, res) => {
    try {
        const productsPath = path.join(__dirname, '../config/data_products.json');
        let productsData = { products: [] };
        if (fs.existsSync(productsPath)) {
            productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        }
        res.json(productsData);
    } catch (error) {
        res.status(500).json({ error: "Failed to load products" });
    }
});

app.post('/api/products', authMiddleware, (req, res) => {
    const { name, description, owner, tables, domain } = req.body;
    if (!name || !owner) return res.status(400).json({ error: "Missing required fields: name, owner" });

    const validDomains = ['Finance', 'Retail', 'Analytics', 'HR', 'CRM'];
    if (domain && !validDomains.includes(domain)) {
        return res.status(400).json({ error: `Invalid Data Domain: ${domain}. Allowed domains: ${validDomains.join(', ')}` });
    }

    try {
        const productsPath = path.join(__dirname, '../config/data_products.json');
        let productsData = { products: [] };
        if (fs.existsSync(productsPath)) {
            productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        }

        const newProduct = {
            id: `PROD-${Math.floor(Math.random() * 1000)}`,
            name,
            description,
            owner,
            tables: tables || [],
            domain: domain || 'General'
        };

        productsData.products.push(newProduct);
        fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));

        // Graph RAG linking: Automatically link dependencies
        try {
            if (tables && tables.length > 0) {
                if (!metadataCatalog._initialized) metadataCatalog.initialize();
                tables.forEach(tableId => {
                    metadataCatalog.crossDomainLinks.push({
                        key: `${newProduct.id}_link`,
                        sourceA: newProduct.id,
                        sourceB: tableId,
                        type: 'CROSS_DOMAIN',
                        confidence: 1.0
                    });
                });
            }
        } catch (linkError) {
            console.error("Failed to link dependencies to Knowledge Graph:", linkError);
        }

        res.status(201).json({ message: "Product published successfully", data: newProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { name, description, owner, tables, domain } = req.body;

    try {
        const productsPath = path.join(__dirname, '../config/data_products.json');
        let productsData = { products: [] };
        if (fs.existsSync(productsPath)) {
            productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        }

        const prodIndex = productsData.products.findIndex(p => p.id === id);
        if (prodIndex === -1) return res.status(404).json({ error: `Product ${id} not found.` });

        productsData.products[prodIndex] = {
            ...productsData.products[prodIndex],
            name: name || productsData.products[prodIndex].name,
            description: description || productsData.products[prodIndex].description,
            owner: owner || productsData.products[prodIndex].owner,
            tables: tables || productsData.products[prodIndex].tables,
            domain: domain || productsData.products[prodIndex].domain
        };

        fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));
        res.json({ message: `Product ${id} updated successfully`, data: productsData.products[prodIndex] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/metrics', authMiddleware, (req, res) => {
    try {
        const metricsPath = path.join(__dirname, '../config/metrics.json');
        let metricsData = { metrics: {} };
        if (fs.existsSync(metricsPath)) {
            metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        }
        res.json(metricsData);
    } catch (error) {
        res.status(500).json({ error: "Failed to load metrics" });
    }
});

app.get('/api/lineage', authMiddleware, (req, res) => {
    try {
        const lineagePath = path.join(__dirname, '../config/lineage.json');
        let lineageData = { edges: [] };
        if (fs.existsSync(lineagePath)) {
            lineageData = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
        }
        res.json(lineageData);
    } catch (error) {
        res.status(500).json({ error: "Failed to load lineage" });
    }
});

app.get('/api/settings', authMiddleware, (req, res) => {
    try {
        const dsConfig = storageProvider.get('data_sources');
        if (!dsConfig.sources) dsConfig.sources = {};
        
        const dataSources = Object.entries(dsConfig.sources).map(([id, s]) => ({
            id,
            name: s.name,
            status: 'online',
            enabled: true
        }));

        const agents = AgentRegistry.map(a => ({
            id: a.id,
            name: a.name,
            status: 'idle'
        }));

        res.json({ dataSources, agents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/governance/policies', authMiddleware, (req, res) => {
    try {
        const pPath = path.join(__dirname, '../config/policies.json');
        const policies = JSON.parse(fs.readFileSync(pPath, 'utf8'));
        res.json(policies);
    } catch (error) {
        res.status(500).json({ error: "Failed to load policies" });
    }
});

app.post('/api/governance/policies', authMiddleware, (req, res) => {
    try {
        const pPath = path.join(__dirname, '../config/policies.json');
        fs.writeFileSync(pPath, JSON.stringify(req.body, null, 2));
        logger.log('Server', `Governance policies updated`, 'INFO');
        res.json({ message: "Policies updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save policies" });
    }
});

// Mock Spanner Inventory for UI
app.get('/api/spanner/inventory', authMiddleware, (req, res) => {
    res.json({
        status: "success",
        data: [
            { transaction_id: "TX-99123", store_id: "NYC-01", quantity_sold: 12 },
            { transaction_id: "TX-99124", store_id: "LON-02", quantity_sold: 5 },
            { transaction_id: "TX-99125", store_id: "TKY-03", quantity_sold: 25 },
            { transaction_id: "TX-99126", store_id: "BLN-04", quantity_sold: 8 },
            { transaction_id: "TX-99127", store_id: "SGP-05", quantity_sold: 15 },
        ]
    });
});

// Mock Alloy CRM Data for UI
app.get('/api/alloy/crm_data', authMiddleware, (req, res) => {
    res.json({
        status: "success",
        metrics: {
            totalLeads: 2580,
            conversionRate: 21.4,
            customerSentiment: 92,
            avgResponseTime: "1.0h"
        }
    });
});

// Agentic Cross-Domain Inventory running through Orchestrator
app.get('/api/bigquery/analytics', authMiddleware, (req, res) => {
    res.json({
        status: 'success',
        data: {
            metrics: {
                totalConversions: 12540,
                avgRoi: 24.5
            },
            campaigns: [
                { id: 'CAMP_2026_A', conversions: 4500, roi: 22 },
                { id: 'CAMP_2026_B', conversions: 3800, roi: 28 },
                { id: 'CAMP_2026_C', conversions: 2100, roi: 18 },
                { id: 'CAMP_2026_D', conversions: 2140, roi: 31 }
            ],
            segments: [
                { name: 'Millennials (Tech-Savvy)', value: 'High', growth: 18 },
                { name: 'Gen-Z (Early Adopters)', value: 'Critical', growth: 35 },
                { name: 'Baby Boomers (Loyalists)', value: 'Medium', growth: 5 }
            ]
        }
    });
});

app.get('/api/mesh/cross_inventory', authMiddleware, async (req, res) => {
    try {
        const catalog = metadataCatalog.getCatalog();
        const sourcesText = Object.values(catalog.sources).map(s => s.name).join(', ');
        const prompt = `Synthesize cross-domain inventory and identify data lineage across the following data sources: ${sourcesText}. Use Graph RAG to link relationships.`;
        
        const result = await askOrchestrator(prompt, req.user.username);
        res.json({ status: 'success', summary: result.text, steps: result.steps });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

export { app };

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n\x1b[32m[Mesh Server] Running on http://localhost:${PORT}\x1b[0m`);
        logger.log('Server', `Starting system in ${process.env.NODE_ENV || 'development'} mode`, 'INFO');
    });
}

