import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Settings Data
  let settings = {
    dataSources: [
      { id: 'oracle', name: 'Oracle ERP', enabled: true, status: 'online' },
      { id: 'spanner', name: 'Spanner Retail', enabled: true, status: 'online' },
      { id: 'bigquery', name: 'BigQuery Analytics', enabled: true, status: 'online' },
      { id: 'alloy', name: 'AlloyDB CRM', enabled: true, status: 'online' },
    ],
    agents: [
      { id: 'alpha', name: 'Agent Alpha', status: 'active' },
      { id: 'beta', name: 'Agent Beta', status: 'idle' },
      { id: 'gamma', name: 'Agent Gamma', status: 'active' },
      { id: 'delta', name: 'Agent Delta', status: 'maintenance' },
    ]
  };

  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    settings = { ...settings, ...req.body };
    res.json({ status: "success", settings });
  });

  app.post("/api/agents/:id/restart", (req, res) => {
    const { id } = req.params;
    const agent = settings.agents.find(a => a.id === id);
    if (agent) {
      agent.status = 'active';
      res.json({ status: "success", message: `Agent ${id} restarted` });
    } else {
      res.status(404).json({ status: "error", message: "Agent not found" });
    }
  });

  app.get("/api/agents/:id/logs", (req, res) => {
    const { id } = req.params;
    const logs = [
      `[${new Date().toISOString()}] Agent ${id} initialized`,
      `[${new Date().toISOString()}] Connection established to domain`,
      `[${new Date().toISOString()}] Heartbeat: OK`,
      `[${new Date().toISOString()}] Processing query batch...`,
    ];
    res.json({ status: "success", logs });
  });

  app.post("/api/settings/add-source", (req, res) => {
    const newSource = { ...req.body, status: 'online', enabled: true };
    settings.dataSources.push(newSource);
    res.json({ status: "success", settings });
  });

  app.post("/api/settings/add-agent", (req, res) => {
    const newAgent = { ...req.body, status: 'active' };
    settings.agents.push(newAgent);
    res.json({ status: "success", settings });
  });

  // Mock API for BigQuery Analytics
  app.get("/api/bigquery/analytics", (req, res) => {
    res.json({
      status: "success",
      timestamp: new Date().toISOString(),
      data: {
        campaigns: [
          {
            id: "CMP_2024_Q1_GLOBAL",
            conversions: 25430,
            roi: 412.5,
            active: true,
            spend: 125000,
            revenue: 640625
          },
          {
            id: "CMP_2024_Q1_LOCAL",
            conversions: 8210,
            roi: 245.2,
            active: true,
            spend: 45000,
            revenue: 155340
          },
          {
            id: "CMP_2024_Q1_RETARGET",
            conversions: 1240,
            roi: 512.8,
            active: false,
            spend: 12000,
            revenue: 73536
          }
        ],
        segments: [
          { name: "Gen Z", growth: 12.4, value: "High" },
          { name: "Millennials", growth: 8.2, value: "Very High" },
          { name: "Gen X", growth: 3.1, value: "Medium" }
        ],
        metrics: {
          totalConversions: 34880,
          avgRoi: 390.16,
          activeCampaigns: 2
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
