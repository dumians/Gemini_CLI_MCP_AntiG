import React, { useState, useEffect } from 'react';
import { Plus, Database, Bot, Settings } from 'lucide-react';

export function DataDomainsView() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // In webapp, data sources come from /api/config/data-sources, agents from /api/status.
      // But we'll try catching them or using fallback data if endpoints are different.
      const resConfig = await fetch('http://localhost:3001/api/config/data-sources').catch(() => null);
      const resStatus = await fetch('http://localhost:3001/api/status').catch(() => null);
      
      let dataSources = [];
      let agents = [];

      if (resConfig?.ok) {
        dataSources = await resConfig.json();
      } else {
         dataSources = [
           { id: 'bq-prod', name: 'BigQuery Production', enabled: true },
           { id: 'spanner-global', name: 'Cloud Spanner', enabled: true },
           { id: 'oracle-erp', name: 'Oracle Financials', enabled: true },
           { id: 'alloy-crm', name: 'AlloyDB Customer Data', enabled: true }
         ];
      }

      if (resStatus?.ok) {
        const d = await resStatus.json();
        agents = d.agents?.map((a: any) => ({
           id: a.agent,
           name: a.agent,
           status: a.status === 'processing' ? 'active' : 'idle'
        })) || [];
      } else {
        agents = [
          { id: 'agent-1', name: 'RetailAgent', status: 'active' },
          { id: 'agent-2', name: 'FinancialAgent', status: 'idle' }
        ];
      }

      setSettings({ dataSources, agents });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddSource = async () => {
    const name = prompt('Enter Data Source Name:');
    if (!name) return;
    alert("This action would normally add a new source via the Settings API.");
    // In a full implementation, you'd POST this to the backend.
  };

  const handleAddAgent = async () => {
    const name = prompt('Enter Agent Name:');
    if (!name) return;
    alert("This action would normally spawn a new agent via the Control API.");
  };

  if (loading) return <div className="p-8 text-slate-400">Loading domains...</div>;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Data Domains & Agents</h2>
          <p className="text-slate-400">Manage your enterprise data domains and the agents orchestrating them.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAddSource}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Connect Source
          </button>
          <button 
            onClick={handleAddAgent}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Domain Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass rounded-3xl border-slate-800 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Database className="text-primary" /> Connected Sources
          </h3>
          <div className="space-y-4">
            {settings?.dataSources?.map((source: any) => (
              <div key={source.id} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{source.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{source.id}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${source.enabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {source.enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl border-slate-800 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Bot className="text-primary" /> Domain Agents
          </h3>
          <div className="space-y-4">
            {settings?.agents?.map((agent: any) => (
              <div key={agent.id} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{agent.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{agent.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
