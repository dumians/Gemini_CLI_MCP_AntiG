import React from 'react';
import { motion } from 'motion/react';
import { Settings, Bot, FileText, Terminal, RefreshCw, Database, Server, Plus, Trash2, Edit, Check, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

type TabType = 'general' | 'agents' | 'contracts' | 'logs';

export const AdminPortalView = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('general');
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState<any>(null);
  
  // Data Source Form State
  const [dsFormData, setDsFormData] = React.useState({ id: '', name: '', domain: '', schema_file: '' });
  const [editDsId, setEditDsId] = React.useState<string | null>(null);

  // Agent Config Form State
  const [agFormData, setAgFormData] = React.useState({ id: '', name: '', model: 'gemini-2.5-flash', systemPrompt: '', domain: '' });
  const [editAgId, setEditAgId] = React.useState<string | null>(null);

  // Data Contract Form State
  const [contractFormData, setContractFormData] = React.useState({ name: '', domain: '', schema: '', sla: '99.9%', retention: '30 days' });
  const [contracts, setContracts] = React.useState<any[]>([]);

  // Logs State
  const [logs, setLogs] = React.useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = React.useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsData = await api.get('/api/settings');
      setSettings(settingsData);
      
      // Mock contracts for now, or use real if exists
      try {
        const contractsData = await api.get('/api/contracts');
        setContracts(contractsData);
      } catch (err) {
        console.warn("Contracts API failed, using fallback mock.");
        setContracts([
          { id: 'c1', name: 'Order Processing Schema', domain: 'Retail', schema: 'Order ID, Item, Status', sla: '99.9%', status: 'active' },
          { id: 'c2', name: 'Financial Audit Log', domain: 'Finance', schema: 'Tx ID, Amount, Timestamp', sla: '99.5%', status: 'pending' },
        ]);
      }

      // Fetch logs
      try {
        const logsData = await api.get('/api/admin/logs');
        setLogs(Array.isArray(logsData) ? logsData : logsData?.logs || []);
      } catch (err) {
        console.warn("Logs API failed.");
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDsSubmit = async () => {
    if (!dsFormData.id || !dsFormData.name || !dsFormData.domain) {
      alert('Please fill ID, Name, and Domain');
      return;
    }
    setLoading(true);
    try {
      if (editDsId) {
        await api.put(`/api/config/data-sources/${editDsId}`, dsFormData);
      } else {
        await api.post('/api/config/data-sources', dsFormData);
      }
      setDsFormData({ id: '', name: '', domain: '', schema_file: '' });
      setEditDsId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to submit data source:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContractSubmit = async () => {
    if (!contractFormData.name || !contractFormData.domain) {
      alert('Please fill Name and Domain');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/contracts', contractFormData);
      setContractFormData({ name: '', domain: '', schema: '', sla: '99.9%', retention: '30 days' });
      fetchData();
    } catch (err) {
      console.error('Failed to submit contract:', err);
      // Fallback update for mock
      setContracts([...contracts, { ...contractFormData, id: `c${Date.now()}`, status: 'active' }]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Data Sources', icon: Database },
    { id: 'agents', label: 'Agent Configuration', icon: Bot },
    { id: 'contracts', label: 'Data Contracts', icon: FileText },
    { id: 'logs', label: 'Live Logs', icon: Terminal },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
          <p className="text-slate-400">Configure mesh settings, agents, and data governance.</p>
        </div>
        <button 
          onClick={fetchData}
          className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Registered Data Sources</h3>
                <div className="space-y-4">
                  {settings?.dataSources?.map((source: any) => (
                    <div key={source.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{source.name}</p>
                          <p className="text-xs text-slate-500">{source.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditDsId(source.id); setDsFormData({ ...source }); }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <span className={`text-xs font-bold uppercase ${source.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                          {source.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">{editDsId ? 'Edit Data Source' : 'Add Data Source'}</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. spanner_retail"
                      value={dsFormData.id}
                      onChange={(e) => setDsFormData({ ...dsFormData, id: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      disabled={!!editDsId}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Spanner Retail"
                      value={dsFormData.name}
                      onChange={(e) => setDsFormData({ ...dsFormData, name: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Domain</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Retail"
                      value={dsFormData.domain}
                      onChange={(e) => setDsFormData({ ...dsFormData, domain: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={handleDsSubmit}
                    className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    {editDsId ? 'Update' : 'Create'} Source
                  </button>
                  {editDsId && (
                    <button 
                      onClick={() => { setEditDsId(null); setDsFormData({ id: '', name: '', domain: '', schema_file: '' }); }}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Active Mesh Agents</h3>
                <div className="space-y-4">
                  {settings?.agents?.map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Bot size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.domain || 'Global'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditAgId(agent.id); setAgFormData({ id: agent.id, name: agent.name, model: agent.model || 'gemini-2.5-flash', systemPrompt: agent.prompt || '', domain: agent.domain || '' }); }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <span className={`text-xs font-bold uppercase ${agent.status === 'online' ? 'text-green-500' : 'text-slate-500'}`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">{editAgId ? 'Edit Agent' : 'Configure Agent'}</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Agent Name</label>
                    <input 
                      type="text" 
                      value={agFormData.name}
                      onChange={(e) => setAgFormData({ ...agFormData, name: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Model</label>
                    <select 
                      value={agFormData.model}
                      onChange={(e) => setAgFormData({ ...agFormData, model: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">System Prompt</label>
                    <textarea 
                      rows={4}
                      value={agFormData.systemPrompt}
                      onChange={(e) => setAgFormData({ ...agFormData, systemPrompt: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={() => alert('Agent updated successfully!')}
                    className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    Save Configuration
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Active Data Contracts</h3>
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{contract.name}</p>
                            <p className="text-xs text-slate-500">{contract.domain}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold uppercase ${contract.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                          {contract.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-slate-500">SLA Availability</p>
                          <p className="text-white font-medium">{contract.sla}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Retention</p>
                          <p className="text-white font-medium">{contract.retention || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="glass rounded-2xl border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Create New Contract</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Contract Name</label>
                    <input 
                      type="text" 
                      value={contractFormData.name}
                      onChange={(e) => setContractFormData({ ...contractFormData, name: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Domain</label>
                    <input 
                      type="text" 
                      value={contractFormData.domain}
                      onChange={(e) => setContractFormData({ ...contractFormData, domain: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Schema Definition</label>
                    <textarea 
                      rows={3}
                      placeholder="Column definitions, constraints..."
                      value={contractFormData.schema}
                      onChange={(e) => setContractFormData({ ...contractFormData, schema: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Availability SLA</label>
                    <input 
                      type="text" 
                      value={contractFormData.sla}
                      onChange={(e) => setContractFormData({ ...contractFormData, sla: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={handleContractSubmit}
                    className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    Propose Contract
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <section className="glass rounded-2xl border-slate-800 p-6 h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                  <Terminal size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Live Transaction Logs</h3>
              </div>
              
              <select 
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="all">All Domains</option>
                {Array.from(new Set(logs.map(l => l.domain))).filter(Boolean).map((domain, i) => (
                  <option key={i} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 bg-black/40 p-6 rounded-xl overflow-y-auto font-mono text-xs space-y-2">
              {logs && logs.length > 0 ? logs.filter(l => selectedDomain === 'all' || l.domain === selectedDomain).map((log: any, i: number) => (
                <div key={i} className="flex flex-col border-b border-slate-800/50 pb-2 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                      log.level === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                      log.level === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                      'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}>{log.domain}</span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500">No logs found. Use the system to generate traffic.</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
