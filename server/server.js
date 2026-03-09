import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { askOrchestrator } from '../agent/orchestrator.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Real-time status tracking (mocked for simplicity, but could be extended)
let currentStatus = {
    state: "idle",
    lastQuery: null,
    steps: []
};

app.post('/api/query', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    console.log(`Received query: ${query}`);
    currentStatus.state = "processing";
    currentStatus.lastQuery = query;
    currentStatus.steps = [];

    try {
        const result = await askOrchestrator(query);
        currentStatus.state = "completed";
        currentStatus.steps = result.steps;

        res.json(result);
    } catch (error) {
        console.error("Query Error:", error);
        currentStatus.state = "error";
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json(currentStatus);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
