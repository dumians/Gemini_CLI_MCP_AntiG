import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { askOrchestrator } from '../agent/orchestrator.js';
import { logger } from '../agent/utils/logging_service.js';
import { metadataCatalog } from '../agent/utils/catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Real-time status tracking
let currentStatus = {
    state: "idle",
    lastQuery: null,
    steps: []
};

// --- Mesh Query Endpoint ---
app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    logger.log('Server', `Received query: ${query}`, 'INFO');
    currentStatus.state = "processing";
    currentStatus.lastQuery = query;
    currentStatus.steps = [];

    try {
        const result = await askOrchestrator(query);
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

app.get('/api/catalog', (req, res) => {
    try {
        res.json(metadataCatalog.getCatalog());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/catalog/graph', (req, res) => {
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

app.get('/api/status', (req, res) => {
    res.json({
        ...currentStatus,
        agents: logger.getAgentStatuses()
    });
});

app.get('/api/admin/events', (req, res) => {
    res.json(logger.getA2AEvents());
});

app.get('/api/admin/logs', (req, res) => {
    res.json(logger.getLogs());
});

// --- Configuration Endpoints ---

app.get('/api/config/data-sources', (req, res) => {
    try {
        const dsPath = path.join(__dirname, '../config/data_sources.json');
        const config = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Failed to load data sources config" });
    }
});

app.listen(PORT, () => {
    console.log(`\n\x1b[32m[Mesh Server] Running on http://localhost:${PORT}\x1b[0m`);
    logger.log('Server', `Starting system in ${process.env.NODE_ENV || 'development'} mode`, 'INFO');
});

