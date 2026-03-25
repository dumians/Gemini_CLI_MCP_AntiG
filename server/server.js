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
            if (ent.source) {
                graphData.links.push({
                    source: ent.source,
                    target: entId,
                    label: 'owns'
                });
            }

            // Link relationships (Foreign Keys)
            if (ent.relationships) {
                ent.relationships.forEach(rel => {
                    graphData.links.push({
                        source: entId,
                        target: rel.targetEntity,
                        label: rel.type
                    });
                });
            }
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
        const dsPath = path.join(__dirname, '../config/data_sources.json');
        const config = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Failed to load data sources config" });
    }
});

export { app };

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n\x1b[32m[Mesh Server] Running on http://localhost:${PORT}\x1b[0m`);
        logger.log('Server', `Starting system in ${process.env.NODE_ENV || 'development'} mode`, 'INFO');
    });
}

