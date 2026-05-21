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

  // System Agents Models State
  const [systemModels, setSystemModels] = React.useState({ planner: 'gemini-2.5-flash', catalog: 'gemini-2.5-flash', orchestrator: 'gemini-2.5-flash' });

  const fetchSystemModels = async () => {
    try {
      const res = await api.get('/api/config/system-models');
      if (res) {
        setSystemModels(res);
      }
    } catch (err) {
      console.error('Failed to fetch system models:', err);
    }
  };

  const handleSaveSystemModels = async (agentType: string, modelName: string) => {
    const updated = { ...systemModels, [agentType]: modelName };
    setSystemModels(updated);
    try {
      await api.post('/api/config/system-models', updated);
    } catch (err) {
      console.error('Failed to save system models:', err);
    }
  };
  
  const [editDsId, setEditDsId] = React.useState<string | null>(null);
  const [isDsModalOpen, setIsDsModalOpen] = React.useState(false);
  const [dsModalData, setDsModalData] = React.useState<any>(null);

  // Agent Config Form State
  const [agFormData, setAgFormData] = React.useState({ id: '', name: '', model: 'gemini-2.5-flash', systemPrompt: '', domain: '' });
  const [editAgId, setEditAgId] = React.useState<string | null>(null);

  // Logs State
  const [logs, setLogs] = React.useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = React.useState<string>('all');

  // API Keys State
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [complianceAlerts, setComplianceAlerts] = React.useState<any[]>([]);

  const fetchComplianceAlerts = async () => {
    try {
      const data = await api.get('/api/governance/compliance-alerts');
      setComplianceAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch compliance alerts:', err);
    }
  };

  const handleApproveAlert = async (id: string) => {
    try {
      await api.post(`/api/governance/compliance-alerts/${id}/approve`, {});
      fetchComplianceAlerts();
    } catch (err) {
      console.error('Failed to approve compliance alert:', err);
    }
  };


  const fetchApiKeys = async () => {
    try {
      const data = await api.get('/api/config/api-keys');
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    try {
      await api.post('/api/config/api-keys', { name: newKeyName });
      setNewKeyName('');
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await api.delete(`/api/config/api-keys/${id}`);
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const handleSaveAgent = async () => {
    if (!editAgId) return;
    setLoading(true);
    try {
      await api.put(`/api/config/agents/${editAgId}`, {
        name: agFormData.name,
        model: agFormData.model,
        domain: agFormData.domain,
        systemInstruction: agFormData.systemPrompt
      });
      setEditAgId(null);
      setAgFormData({ id: '', name: '', model: 'gemini-2.5-flash', systemPrompt: '', domain: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to save agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const [mcpTools, setMcpTools] = React.useState<any[]>([]);

  const fetchMcpTools = async () => {
    try {
      const data = await api.get('/api/mcp/tools');
      setMcpTools(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch MCP tools:', err);
    }
  };

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

      // Fetch compliance alerts
      await fetchComplianceAlerts();
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };


  React.useEffect(() => {
    fetchData();
    fetchApiKeys();
    fetchMcpTools();
    fetchSystemModels();
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
          onClick={async () => {
            setLoading(true);
            try {
              await api.post('/api/refresh-telemetry', {});
            } catch (e) {
              console.error("Refresh failed", e);
            }
            fetchData();
          }}
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
                          onClick={() => { setEditAgId(agent.id); setAgFormData({ id: agent.id, name: agent.name, model: agent.model || 'gemini-2.5-flash', systemPrompt: agent.systemInstruction || agent.prompt || '', domain: agent.domain || '' }); }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${
                          agent.status === 'online' || !agent.status ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                          agent.status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                          agent.status === 'offline' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                          'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {agent.status || 'online'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass rounded-2xl border-slate-800 p-6 mt-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Cpu size={18} className="text-primary" /> System Core Agents Models
                </h3>
                <p className="text-xs text-slate-500 mb-6">Configure Gemini LLM choices for central strategic mesh agents.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Planner Agent Model</label>
                    <select 
                      value={systemModels.planner}
                      onChange={(e) => handleSaveSystemModels('planner', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                      <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Catalog Agent Model</label>
                    <select 
                      value={systemModels.catalog}
                      onChange={(e) => handleSaveSystemModels('catalog', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                      <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Orchestrator Model</label>
                    <select 
                      value={systemModels.orchestrator}
                      onChange={(e) => handleSaveSystemModels('orchestrator', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                      <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    </select>
                  </div>
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
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                      <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                      <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
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
                  
                  {(() => {
                    const editingAgent = settings?.agents?.find((a: any) => a.id === editAgId);
                    if (!editingAgent) return null;
                    return (
                      <div className="flex flex-col gap-1.5 mt-4">
                        <label className="text-xs font-bold text-slate-400">Active Connections</label>
                        <div className="flex flex-col gap-2 mt-1">
                          {editingAgent.mcpServers && editingAgent.mcpServers.length > 0 ? (
                            editingAgent.mcpServers.map((m: any) => (
                              <div key={m.name} className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex justify-between items-center">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white truncate">{m.name}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{m.mcpUrl || 'Local Process'}</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  settings?.mcpServerStatuses?.[m.name] === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {settings?.mcpServerStatuses?.[m.name] || 'online'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 text-xs italic p-3 bg-slate-900 rounded-xl border border-slate-800">No dependencies.</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const editingAgent = settings?.agents?.find((a: any) => a.id === editAgId);
                    if (!editingAgent) return null;
                    return (
                      <div className="flex flex-col gap-2 mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs font-bold text-slate-400">Agent Attributes</p>
                        <div className="text-xs text-slate-300 space-y-1 font-mono">
                          <div><span className="text-slate-500">ID:</span> {editingAgent.id}</div>
                          <div><span className="text-slate-500">Tool:</span> {editingAgent.toolName || `call_${editingAgent.id}`}</div>
                          <div><span className="text-slate-500">Specialty:</span> {editingAgent.specialty || 'N/A'}</div>
                          <div><span className="text-slate-500">Grounding:</span> {editingAgent.groundingDomain || editingAgent.domain || 'N/A'}</div>
                        </div>
                      </div>
                    );
                  })()}

                  <button 
                    onClick={handleSaveAgent}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    {loading && <RefreshCw size={16} className="animate-spin" />} Save Configuration
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
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                      {mcpTools.length === 0 ? (
                        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-slate-500 text-sm italic">
                          No tools discovered yet.
                        </div>
                      ) : (
                        mcpTools.map((tool: any) => (
                          <div key={tool.name} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-bold text-white">{tool.name}</p>
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">{tool.server}</span>
                            </div>
                            <p className="text-xs text-slate-400">{tool.description}</p>
                          </div>
                        ))
                      )}
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
                    <input 
                      type="text" 
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" 
                      placeholder="e.g. Analytics Frontend" 
                    />
                  </div>
                  <button 
                    onClick={handleCreateKey}
                    className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded-lg text-sm"
                  >
                    Generate Key
                  </button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Active Keys</h4>
                  {apiKeys.length === 0 ? (
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-slate-500 text-sm italic">
                      No API keys created yet.
                    </div>
                  ) : (
                    apiKeys.map((key: any) => (
                      <div key={key.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-white">{key.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{key.key}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 bg-slate-700 hover:bg-red-500/20 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <section className="glass rounded-2xl border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-6">Security & Compliance Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <Shield size={32} className="text-green-500 animate-pulse" />
                  <p className="text-sm font-bold text-white">Workload Identity Verification</p>
                  <p className="text-xs text-slate-500">Active OIDC agent request validation</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <Bot size={32} className="text-primary" />
                  <p className="text-sm font-bold text-white">Federated Governance</p>
                  <p className="text-xs text-slate-500">ABAC/RBAC Policy checking enabled</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2">
                  <AlertTriangle size={32} className={complianceAlerts.some(a => a.status === 'PENDING_REVIEW') ? 'text-red-500 animate-bounce' : 'text-yellow-500'} />
                  <p className="text-sm font-bold text-white">Compliance Alerts</p>
                  <p className="text-xs text-slate-500">
                    {complianceAlerts.filter(a => a.status === 'PENDING_REVIEW').length} pending security audit exceptions
                  </p>
                </div>
              </div>

              {/* Compliance Alerts & Human-in-the-Loop Audit exceptions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500" /> Human-in-the-Loop Audit & Compliance Logs
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 thin-scrollbar">
                    {complianceAlerts.length === 0 ? (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 italic">
                        No compliance exceptions recorded.
                      </div>
                    ) : (
                      complianceAlerts.map((alert: any) => (
                        <div key={alert.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                alert.status === 'PENDING_REVIEW' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-green-500/10 text-green-500 border border-green-500/30'
                              }`}>
                                {alert.status}
                              </span>
                              <p className="text-xs text-white font-bold mt-2">Target: {alert.table}.{alert.column}</p>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{alert.reason}</p>
                          <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded overflow-x-auto">
                            Policy tag: {alert.policyTag}
                          </div>
                          {alert.status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => handleApproveAlert(alert.id)}
                              className="bg-primary hover:bg-primary/80 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1"
                            >
                              <Check size={12} /> Audit & Approve
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Workload Identities listing */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield size={16} className="text-green-500" /> Agent Workload Identities (GCP)
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 thin-scrollbar">
                    {settings?.agents ? settings.agents.map((agent: any) => {
                      // Lookup agents.json config for service account matching (if available, else show default)
                      const serviceAccount = agent.mcpServers && agent.mcpServers.length > 0 
                        ? `${agent.id}@total-vertex-469513-r8.iam.gserviceaccount.com` 
                        : 'system-orchestrator@total-vertex-469513-r8.iam.gserviceaccount.com';
                      return (
                        <div key={agent.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="text-xs font-bold text-white">{agent.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate mt-1">{serviceAccount}</span>
                            <span className="text-[9px] text-slate-500 mt-1">Scope: {agent.domain || 'Global Shared'}</span>
                          </div>
                          <span className="bg-green-500/10 text-green-500 border border-green-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Verified
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="text-slate-500 text-xs italic">No agents registered.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}


        {activeTab === 'logs' && (
          <section className="glass rounded-2xl border-slate-200 dark:border-slate-800 p-6 h-[700px] flex flex-col bg-white dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                  <Terminal size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Transaction Logs</h3>
              </div>
              
              <select 
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="all">All Domains</option>
                <option value="System">System / Non-Agent</option>
                {Array.from(new Set(settings?.dataSources?.map((ds: any) => ds.domain))).filter(Boolean).map((domain: any, i: number) => (
                  <option key={i} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-black/40 p-6 rounded-xl overflow-y-auto font-mono text-xs space-y-2">
              {logs && logs.length > 0 ? logs.filter(log => {
                if (selectedDomain === 'all') return true;
                
                let logDomain = 'System';
                if (log.agent && log.agent !== 'Server' && log.agent !== 'Orchestrator') {
                  const agentDef = settings?.agents?.find((a: any) => a.name === log.agent);
                  if (agentDef && agentDef.domain) {
                    logDomain = agentDef.domain;
                  }
                }
                
                return logDomain === selectedDomain;
              }).map((log: any, i: number) => (
                <div key={i} className="flex flex-col border-b border-slate-200 dark:border-slate-800/50 pb-2 last:border-0 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                      log.type === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                      log.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                      'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                    }`}>{log.agent || 'System'}</span>
                    <span className="text-slate-800 dark:text-slate-300 flex-1">{log.message}</span>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-center italic">No logs recorded yet.</div>
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
