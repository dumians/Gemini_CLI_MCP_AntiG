import React from 'react';
import { Plus, Database, Bot, Settings, RefreshCw } from 'lucide-react';
import { GraphView } from './GraphView';
import { api } from '../utils/api';

export const DataDomainsView = () => {
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/api/settings');
      setSettings(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddSource = async () => {
    const name = prompt('Enter Data Source Name:');
    if (!name) return;
    const domain = prompt('Enter Domain (e.g., finance):');
    if (!domain) return;
    
    try {
      await api.post('/api/config/data-sources', {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name,
        domain
      });
      fetchSettings();
    } catch (e: any) {
      alert(`Failed to add source: ${e.message}`);
    }
  };

  const handleAddAgent = async () => {
    const name = prompt('Enter Agent Name:');
    if (!name) return;
    const domain = prompt('Enter Domain (e.g., finance):');
    if (!domain) return;

    try {
      await api.post('/api/agents', {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name,
        domain
      });
      fetchSettings();
    } catch (e: any) {
      alert(`Failed to add agent: ${e.message}`);
    }
  };

  const handleEditAgent = async (agent: any) => {
    const specialty = prompt('Enter Specialty (Agent mapping rules):', agent.specialty || '');
    const owner = prompt('Enter Owner:', agent.metadata?.owner || '');
    const description = prompt('Enter Description:', agent.metadata?.description || '');
    
    if (specialty === null && owner === null && description === null) return;
    
    try {
      await api.put(`/api/config/agents/${agent.id}`, { specialty, owner, description });
      fetchSettings();
    } catch (e: any) {
      alert(`Failed to update agent: ${e.message}`);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading domains...</div>;
  if (!settings) return null;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Data Domains & Agents</h2>
          <p className="text-slate-400">Manage your enterprise data domains and the agents orchestrating them.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchSettings}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button 
            onClick={handleAddSource}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Connect Source
          </button>
          <button 
            onClick={handleAddAgent}
            className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Domain Agent
          </button>
        </div>
      </div>

      <div className="w-full">
        <GraphView />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass rounded-3xl border-slate-800 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Database className="text-primary" /> Connected Sources
          </h3>
          <div className="space-y-4">
            {settings.dataSources.map((source: any) => (
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
            {settings.agents.map((agent: any) => (
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
                  <button 
                    onClick={() => handleEditAgent(agent)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* A2UI 0.9 Warehouse / Supply Chain Specialization Panel */}
      <section className="glass rounded-3xl border-slate-800 p-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Database className="text-primary" /> Supply Chain & Warehouse Operations (A2UI 0.9)
            </h3>
            <p className="text-sm text-slate-400 mt-1">Powered by Oracle Agent Java Model & Property Graph Hotspot Analytics</p>
          </div>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase border border-primary/20">
            Live Telemetry
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Graph Coverage</span>
              <p className="text-2xl font-extrabold text-white mt-2">3 Sub-Graphs</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              SKU-500 sustainable battery path active
            </div>
          </div>
          <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hotspot Risk Profiling</span>
              <p className="text-2xl font-extrabold text-rose-500 mt-2">1 Critical</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              WH-101 shortage predicted (Expedite Supply)
            </div>
          </div>
          <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Select AI Status</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-2">Optimized</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
              DBMS_CLOUD_AI profile synced & validated
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
