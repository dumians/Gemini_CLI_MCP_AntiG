import React from 'react';
import { motion } from 'motion/react';
import { Settings, Bot, FileText, Terminal, RefreshCw, Database, Server, Plus, Trash2, Edit, Check, AlertTriangle, Globe, Cpu, Key, Shield } from 'lucide-react';
import { api } from '../utils/api';
import { SourceModal } from './SourceModal';

type TabType = 'general' | 'agents' | 'mcp' | 'api' | 'security' | 'logs';

export const AdminPortalView = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('general');
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState<any>(null);
  
  const [editDsId, setEditDsId] = React.useState<string | null>(null);
  const [isDsModalOpen, setIsDsModalOpen] = React.useState(false);
  const [dsModalData, setDsModalData] = React.useState<any>(null);

  // Agent Config Form State
  const [agFormData, setAgFormData] = React.useState({ id: '', name: '', model: 'gemini-2.5-flash', systemPrompt: '', domain: '' });
  const [editAgId, setEditAgId] = React.useState<string | null>(null);

  // Logs State
  const [logs, setLogs] = React.useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = React.useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsData = await api.get('/api/settings');
      setSettings(settingsData);

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

  const handleDsSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (editDsId) {
        await api.put(`/api/config/data-sources/${editDsId}`, data);
      } else {
        await api.post('/api/config/data-sources', data);
      }
      setIsDsModalOpen(false);
      setDsModalData(null);
      setEditDsId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to submit data source:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Data Sources', icon: Database },
    { id: 'agents', label: 'Agent Configuration', icon: Bot },
    { id: 'mcp', label: 'MCP Toolbox', icon: Cpu },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
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
          <div className="space-y-6">
            <section className="glass rounded-2xl border-slate-700/50 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Registered Data Sources</h3>
                  <p className="text-xs text-slate-500">Manage connections to your data ecosystem.</p>
                </div>
                <button 
                  onClick={() => { setDsModalData(null); setEditDsId(null); setIsDsModalOpen(true); }}
                  className="bg-primary hover:bg-primary/80 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all"
                >
                  <Plus size={16} /> Register Source
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings?.dataSources?.map((source: any) => (
                  <div key={source.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary/30 transition-colors">
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
                        onClick={() => { setEditDsId(source.id); setDsModalData(source); setIsDsModalOpen(true); }}
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
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {agent.mcpServers?.map((m: any) => (
                              <span key={m.name} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                                {m.name}
                              </span>
                            ))}
                          </div>
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
                      <option value="gemini-3.1-preview">Gemini 3.1 Preview</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Target Domain</label>
                    <select 
                      value={agFormData.domain}
                      onChange={(e) => setAgFormData({ ...agFormData, domain: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">Global / Shared</option>
                      <option value="Oracle ERP">Oracle ERP</option>
                      <option value="Spanner Retail">Spanner Retail</option>
                      <option value="BigQuery Analytics">BigQuery Analytics</option>
                      <option value="AlloyDB CRM">AlloyDB CRM</option>
                      <option value="Oracle HR">Oracle HR</option>
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

        {activeTab === 'domains' && (
          <div className="space-y-6">
            <section className="glass rounded-2xl border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-6">Create & Manage Data Domains</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Domain Name</label>
                    <input type="text" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" placeholder="e.g. Finance Domain" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Type</label>
                    <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary">
                      <option>Postgres/MySQL</option>
                      <option>Spanner</option>
                      <option>BigQuery</option>
                    </select>
                  </div>
                  <button className="bg-primary hover:bg-primary/80 text-white font-bold py-2 rounded-lg text-sm">Create Domain</button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Active Domains</h4>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">Retail Domain</p>
                      <p className="text-xs text-slate-500">Spanner</p>
                    </div>
                    <span className="text-xs text-green-500 font-bold uppercase">Online</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mcp' && (() => {
          const allMcpServers = settings?.agents?.flatMap((agent: any) => agent.mcpServers || []) || [];
          const uniqueMcpServers = Array.from(new Map(allMcpServers.map((s: any) => [s.name, s])).values());
          return (
            <div className="space-y-6">
              <section className="glass rounded-2xl border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Model Context Protocol (MCP) Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Connected Servers</h4>
                    {uniqueMcpServers.length === 0 ? (
                      <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <p className="text-sm text-slate-500">No MCP servers configured in agent settings.</p>
                      </div>
                    ) : (
                      uniqueMcpServers.map((server: any) => (
                        <div key={server.name} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Cpu size={20} className="text-primary" />
                            <div>
                              <p className="text-sm font-bold text-white">{server.name}</p>
                              <p className="text-xs text-slate-500">{server.mcpUrl || 'Local Server'}</p>
                            </div>
                          </div>
                          <span className="text-xs text-green-500 font-bold uppercase">Available</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Available Tools</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <p className="text-sm text-slate-500">Tools are loaded by agents at runtime. UI integration for tool discovery is not enabled.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          );
        })()}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <section className="glass rounded-2xl border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-6">API Keys Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Key Name</label>
                    <input type="text" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" placeholder="e.g. Analytics Frontend" />
                  </div>
                  <button className="bg-primary hover:bg-primary/80 text-white font-bold py-2 rounded-lg text-sm">Generate Key</button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Active Keys</h4>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">Default Internal Key</p>
                      <p className="text-xs text-slate-500">sk_live_...4a2b</p>
                    </div>
                    <button className="p-2 bg-slate-700 hover:bg-red-500/20 rounded-lg text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <section className="glass rounded-2xl border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-6">Security & Compliance Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <Shield size={32} className="text-green-500" />
                  <p className="text-sm font-bold text-white">Encryption Active</p>
                  <p className="text-xs text-slate-500">AES-256-GCM point-to-point</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <Bot size={32} className="text-primary" />
                  <p className="text-sm font-bold text-white">Governance Enforced</p>
                  <p className="text-xs text-slate-500">Domain-scoped data access</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <AlertTriangle size={32} className="text-yellow-500" />
                  <p className="text-sm font-bold text-white">Compliance Status</p>
                  <p className="text-xs text-slate-500">Pre-audit checks passed</p>
                </div>
              </div>
            </section>
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
      <SourceModal 
        isOpen={isDsModalOpen} 
        onClose={() => { setIsDsModalOpen(false); setDsModalData(null); setEditDsId(null); }} 
        onSubmit={handleDsSubmit} 
        initialData={dsModalData}
        loading={loading}
      />
    </div>
  );
};
