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
import { dataplex } from '../agent/utils/dataplex.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
            if (h) obj[h.trim()] = values[i]?.trim();
        });
        return obj;
    });
}

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
        currentStatus.context = result.context;

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

        // 4. Link Cross-Domain Correlations
        if (catalog.crossDomainLinks) {
            catalog.crossDomainLinks.forEach(link => {
                graphData.links.push({
                    source: link.sourceA,
                    target: link.sourceB,
                    label: `correlates (${link.key})`,
                    color: '#f59e0b' // Amber/Orange or another distinct color
                });
            });
        }

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

// --- Domain Factory Endpoints ---

app.get('/api/domains', authMiddleware, (req, res) => {
    try {
        const dsConfig = storageProvider.get('data_sources');
        const sources = dsConfig.sources ? Object.values(dsConfig.sources) : [];
        const domainsSet = new Set();

        sources.forEach(s => {
            if (s.domain) domainsSet.add(s.domain);
        });

        // Also scan agents for domains
        const agentsPath = path.join(__dirname, '../config/agents.json');
        if (fs.existsSync(agentsPath)) {
            const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
            agents.forEach(a => {
                if (a.domain) domainsSet.add(a.domain);
            });
        }

        res.json(Array.from(domainsSet));
    } catch (error) {
        res.status(500).json({ error: "Failed to load domains: " + error.message });
    }
});

app.post('/api/domains', authMiddleware, (req, res) => {
    const { name, sourceId, schema_file } = req.body;

    if (!name || !sourceId) {
        return res.status(400).json({ error: "Missing required fields: name, sourceId" });
    }

    try {
        let dsConfig = storageProvider.get('data_sources');
        if (!dsConfig.sources) dsConfig.sources = {};

        if (!dsConfig.sources[sourceId]) {
            return res.status(404).json({ error: `Linked Data Source ${sourceId} not found.` });
        }

        // Orchestration: Update existing data source to the new domain
        dsConfig.sources[sourceId].domain = name;
        if (schema_file) {
            dsConfig.sources[sourceId].schema_file = schema_file;
        }

        storageProvider.set('data_sources', dsConfig);
        metadataCatalog.reload(); // Sync graph

        logger.log('Server', `Domain Factory: Domain ${name} associated with source ${sourceId}`, 'INFO');
        res.status(201).json({ message: `Domain ${name} associated with source ${sourceId} successfully.` });
    } catch (error) {
        logger.log('Server', `Domain Factory Failed: ${error.message}`, 'ERROR');
        res.status(500).json({ error: error.message });
    }
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

app.post('/api/discover', authMiddleware, (req, res) => {
    const { name, type, uri, domain } = req.body;
    if (!name || !uri) {
        return res.status(400).json({ error: "Missing required fields: name, uri" });
    }

    try {
        // Simulate discovery
        let entities = [];
        let correlations = [];

        if (uri.includes('ebs') || uri.includes('flexcube')) {
            entities = [
                {
                    name: "flexcube_transactions",
                    attributes: [
                        { name: "trn_ref_no", type: "VARCHAR2(20)" },
                        { name: "ac_no", type: "VARCHAR2(20)" },
                        { name: "drcr_ind", type: "CHAR(1)" },
                        { name: "lcy_amount", type: "NUMBER(15,2)" },
                        { name: "trn_dt", type: "DATE" }
                    ]
                }
            ];

            correlations = [
                {
                    localEntity: "flexcube_transactions",
                    localAttr: "ac_no",
                    targetEntity: "customer_accounts",
                    targetSource: "crm-alloydb"
                }
            ];
        } else {
            // Generic fallback
            entities = [
                {
                    name: "generic_entity",
                    attributes: [
                        { name: "id", type: "VARCHAR" },
                        { name: "name", type: "VARCHAR" }
                    ]
                }
            ];
        }

        res.json({
            status: "success",
            entities,
            correlations
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to perform discovery: " + error.message });
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

app.put('/api/config/agents/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { specialty, owner, description, mcpServers } = req.body;

    try {
        const agentsPath = path.join(__dirname, '../config/agents.json');
        let agentsData = [];
        if (fs.existsSync(agentsPath)) {
            agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
        }

        const agentIndex = agentsData.findIndex(a => a.id === id);
        if (agentIndex === -1) {
            return res.status(404).json({ error: `Agent ${id} not found.` });
        }

        agentsData[agentIndex] = {
            ...agentsData[agentIndex],
            specialty: specialty || agentsData[agentIndex].specialty,
            mcpServers: mcpServers || agentsData[agentIndex].mcpServers
        };

        if (owner || description) {
            agentsData[agentIndex].metadata = {
                ...agentsData[agentIndex].metadata,
                owner: owner || (agentsData[agentIndex].metadata && agentsData[agentIndex].metadata.owner),
                description: description || (agentsData[agentIndex].metadata && agentsData[agentIndex].metadata.description)
            };
        }

        fs.writeFileSync(agentsPath, JSON.stringify(agentsData, null, 2));
        logger.log('Server', `Agent ${id} updated dynamically`, 'INFO');
        res.json({ message: `Agent ${id} updated successfully`, data: agentsData[agentIndex] });
    } catch (error) {
        logger.log('Server', `Failed to update agent: ${error.message}`, 'ERROR');
        res.status(500).json({ error: error.message });
    }
});

function validateDataContractSchema(contract) {
    const catalog = metadataCatalog.getCatalog();
    const sources = Object.values(catalog.sources);
    
    if (contract.composite && Array.isArray(contract.components)) {
        for (const comp of contract.components) {
            const src = sources.find(s => s.domain === comp.domain);
            if (!src) {
                throw new Error(`Validation failed: Domain '${comp.domain}' not found in data sources.`);
            }
            // Verify attributes exist in entities of this source
            if (Array.isArray(comp.attributes)) {
                const sourceEntities = Object.values(catalog.entities).filter(e => e.sourceId === src.id);
                const allAttributes = new Set();
                sourceEntities.forEach(e => {
                    if (Array.isArray(e.attributes)) {
                        e.attributes.forEach(a => allAttributes.add(a.name));
                    }
                });
                for (const attr of comp.attributes) {
                    if (!allAttributes.has(attr)) {
                        throw new Error(`Validation failed: Attribute '${attr}' not found in schema for domain '${comp.domain}'`);
                    }
                }
            }
        }
    } else {
        const src = sources.find(s => s.domain === contract.domain);
        if (!src) {
            throw new Error(`Validation failed: Domain '${contract.domain}' not found in data sources.`);
        }
    }
}

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

        const updatedContract = {
            ...contractsData.contracts[contractIndex],
            status: status || contractsData.contracts[contractIndex].status,
            sla: sla || contractsData.contracts[contractIndex].sla,
            privacy: privacy || contractsData.contracts[contractIndex].privacy
        };

        // Validate against domain schemas
        try {
            validateDataContractSchema(updatedContract);
        } catch (valError) {
            return res.status(400).json({ error: valError.message });
        }

        contractsData.contracts[contractIndex] = updatedContract;
        fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2));

        // Integration with GCP Dataplex
        dataplex.createDataContract(updatedContract).catch(err => {
            console.error("[Server] Failed to update data contract in Dataplex:", err);
        });

        res.json({ message: `Contract ${id} updated successfully`, data: updatedContract });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/contracts', authMiddleware, (req, res) => {
    const { product, domain, schema_file, sla, privacy, subscriber, status, composite, components } = req.body;
    if (!product || (!domain && !composite)) return res.status(400).json({ error: "Missing required fields: product, domain" });

    try {
        const contractsPath = path.join(__dirname, '../config/data_contracts.json');
        let contractsData = { contracts: [] };
        if (fs.existsSync(contractsPath)) {
            contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
        }

        const newContract = {
            id: `CTR-${Math.floor(Math.random() * 1000)}`,
            product,
            domain: domain || 'Composite',
            schema_file: schema_file || 'db-schemas/generic_schema.sql',
            subscriber: subscriber || 'Internal User',
            status: status || 'Draft',
            sla: sla || '99.9%',
            privacy: privacy || 'Standard',
            composite: composite || false,
            components: components || []
        };

        // Validate against domain schemas
        try {
            validateDataContractSchema(newContract);
        } catch (valError) {
            return res.status(400).json({ error: valError.message });
        }

        contractsData.contracts.push(newContract);
        fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2));

        // Integration with GCP Dataplex
        dataplex.createDataContract(newContract).catch(err => {
            console.error("[Server] Failed to create data contract in Dataplex:", err);
        });

        res.status(201).json({ message: "Contract proposed successfully", data: newContract });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/contracts/:id/subscribe', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { subscriber } = req.body;

    if (!subscriber) {
        return res.status(400).json({ error: "Missing subscriber name" });
    }

    try {
        const contractsPath = path.join(__dirname, '../config/data_contracts.json');
        if (!fs.existsSync(contractsPath)) return res.status(404).json({ error: "No contracts found" });

        const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
        const contract = contractsData.contracts.find(c => c.id === id);

        if (!contract) return res.status(404).json({ error: "Contract not found" });

        contract.subscriber = subscriber;
        fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2));

        // Dataplex Lineage subscription simulation
        const source = contract.product.toLowerCase().replace(/\s/g, '-');
        const target = subscriber.toLowerCase().replace(/\s/g, '-');
        const processId = `${source}-to-${target}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const runId = `run-${Date.now()}`;

        try {
            await dataplex.createLineageProcess(processId, `Contract Subscription Lineage: ${contract.product} to ${subscriber}`);
            await dataplex.createLineageRun(processId, runId);
            await dataplex.createLineageEvent(processId, runId, source, target);
        } catch (lineageErr) {
            console.error("[Server] Failed to emit subscription lineage in Dataplex:", lineageErr);
        }

        res.json({ message: "Subscribed to contract successfully", contract });
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
    const { name, description, owner, tables, domain, domainContracts, security_level } = req.body;
    if (!name || !owner) return res.status(400).json({ error: "Missing required fields: name, owner" });

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
            domain: domain || 'General',
            domainContracts: domainContracts || [],
            security_level: security_level || 'Public',
            subscribers: []
        };

        productsData.products.push(newProduct);
        fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));

        // Integration with GCP Dataplex
        dataplex.createDataProduct(newProduct).catch(err => {
            console.error("[Server] Failed to create data product in Dataplex:", err);
        });

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

app.post('/api/products/:id/subscribe', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { user_role, user_id } = req.body; // Simulated RBAC credentials via payload

    try {
        const productsPath = path.join(__dirname, '../config/data_products.json');
        if (!fs.existsSync(productsPath)) return res.status(404).json({ error: "No products found" });

        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const product = productsData.products.find(p => p.id === id);

        if (!product) return res.status(404).json({ error: "Product not found" });

        // RBAC Check for Confidential Products
        if (product.security_level === 'Confidential' && user_role !== 'Admin' && user_role !== 'Producer') {
            return res.status(403).json({ error: "Forbidden: Only Admin or Producer can subscribe to Confidential products." });
        }

        if (!product.subscribers) product.subscribers = [];
        if (product.subscribers.includes(user_id)) {
            return res.status(400).json({ error: "User already subscribed" });
        }

        product.subscribers.push(user_id);
        fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));

        res.json({ message: "Subscribed successfully", subscribers: product.subscribers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { name, description, owner, tables, domain, domainContracts, security_level } = req.body;

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
            domain: domain || productsData.products[prodIndex].domain,
            domainContracts: domainContracts || productsData.products[prodIndex].domainContracts,
            security_level: security_level || productsData.products[prodIndex].security_level
        };

        fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));
        
        // Integration with GCP Dataplex
        dataplex.createDataProduct(productsData.products[prodIndex]).catch(err => {
            console.error("[Server] Failed to update data product in Dataplex:", err);
        });

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
            status: 'idle',
            domain: a.domain,
            mcpServers: a.mcpServers
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

// Real Spanner Inventory from Test Data
app.get('/api/spanner/inventory', authMiddleware, (req, res) => {
    try {
        const csvPath = path.join(__dirname, '../test-data/spanner_transactions.csv');
        const transactions = parseCSV(csvPath);
        
        // Sum quantities per store or item
        let totalSold = 0;
        transactions.forEach(t => totalSold += Number(t.quantity_sold || 0));

        res.json({
            status: "success",
            metrics: {
                totalSold,
                avgQuantity: totalSold / (transactions.length || 1)
            },
            data: transactions.map(t => ({
                transaction_id: t.transaction_id,
                store_id: t.store_id,
                quantity_sold: Number(t.quantity_sold),
                timestamp: t.timestamp
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alloy CRM Data from Test Data
app.get('/api/alloy/crm_data', authMiddleware, (req, res) => {
    try {
        const customersCsv = path.join(__dirname, '../test-data/alloydb_crm_customers.csv');
        const customers = parseCSV(customersCsv);
        
        let totalLtv = 0;
        customers.forEach(c => totalLtv += Number(c.lifetime_value || 0));

        res.json({
            status: "success",
            metrics: {
                totalLeads: customers.length,
                totalLtv,
                avgLtv: totalLtv / (customers.length || 1),
                customerSentiment: 92, // Still static placeholder
                avgResponseTime: "1.0h" // Still static placeholder
            },
            customers: customers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agentic Cross-Domain Inventory running through Orchestrator
// BigQuery Analytics from Test Data
app.get('/api/bigquery/analytics', authMiddleware, (req, res) => {
    try {
        const segmentsCsv = path.join(__dirname, '../test-data/bigquery_segments.csv');
        const segments = parseCSV(segmentsCsv);
        
        let totalLtv = 0;
        let vipCount = 0;
        segments.forEach(s => {
            totalLtv += Number(s.lifetime_value || 0);
            if (s.segment_name === 'VIP') vipCount++;
        });

        res.json({
            status: 'success',
            data: {
                metrics: {
                    totalConversions: segments.length,
                    avgLtv: totalLtv / (segments.length || 1),
                    vipRate: vipCount / (segments.length || 1)
                },
                campaigns: [
                    { id: 'CAMP_2026_GENERIC', conversions: segments.length * 10, roi: 24 }
                ],
                segments: segments.map(s => ({
                    name: s.segment_name,
                    value: Number(s.lifetime_value) > 100000 ? 'High' : 'Medium',
                    growth: Math.floor(Math.random() * 20) + 5
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Oracle Analytics from Test Data
app.get('/api/oracle/analytics', authMiddleware, (req, res) => {
    try {
        const ordersCsv = path.join(__dirname, '../test-data/oracle_orders.csv');
        const orders = parseCSV(ordersCsv);
        
        let totalAmount = 0;
        orders.forEach(o => totalAmount += Number(o.total_amount || 0));

        res.json({
            status: "success",
            metrics: {
                totalOrders: orders.length,
                totalAmount,
                avgOrderValue: totalAmount / (orders.length || 1)
            },
            orders: orders
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

