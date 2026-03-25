import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Settings, X, Database, Bot, Terminal } from 'lucide-react';
import { api } from '../utils/api';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [settings, setSettings] = React.useState<any>(null);
  const [initialLoading, setInitialLoading] = React.useState(true); // For initial settings fetch
  const [formLoading, setFormLoading] = React.useState(false); // For form submission
  const [editId, setEditId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ id: '', name: '', domain: '', schema_file: '' });

  const fetchSettings = async () => {
    setInitialLoading(true);
    try {
      const data = await api.get('/api/settings');
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.name || !formData.domain) {
      alert('Please fill ID, Name, and Domain');
      return;
    }
    setFormLoading(true);
    try {
      if (editId) {
        await api.put(`/api/config/data-sources/${editId}`, formData);
        alert('Data source updated successfully!');
      } else {
        await api.post('/api/config/data-sources', formData);
        alert('Data source added successfully!');
      }
      setFormData({ id: '', name: '', domain: '', schema_file: '' });
      setEditId(null);
      fetchSettings();
    } catch (err) {
      console.error('Failed to submit data source:', err);
      alert(`Error ${editId ? 'updating' : 'adding'} data source`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (ds: any) => {
    setEditId(ds.id);
    setFormData({ id: ds.id, name: ds.name, domain: ds.domain || '', schema_file: ds.schema_file || '' });
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleToggleSource = (id: string) => {
    const newSources = settings.dataSources.map((s: any) => 
      s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'online' : 'offline' } : s
    );
    const newSettings = { ...settings, dataSources: newSources };
    setSettings(newSettings);
    
    api.post('/api/settings', newSettings)
      .catch(err => console.error("Failed to update settings:", err));
  };

  const handleAgentAction = async (id: string, action: 'restart' | 'logs') => {
    if (action === 'restart') {
      await api.post(`/api/agents/${id}/restart`, {});
      const data = await api.get('/api/settings');
      setSettings(data);
    } else {
      const data = await api.get(`/api/agents/${id}/logs`);
      alert(data.logs.join('\n'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">System Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {initialLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Data Sources</h3>
                <div className="grid grid-cols-1 gap-4">
                  {settings.dataSources.map((source: any) => (
                    <div key={source.id} className={`flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 transition-opacity ${!source.enabled ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${
                          source.id === 'oracle' ? 'bg-orange-500/10 text-orange-500' :
                          source.id === 'spanner' ? 'bg-blue-500/10 text-blue-500' :
                          source.id === 'bigquery' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-cyan-500/10 text-cyan-500'
                        }`}>
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{source.name}</p>
                          <p className={`text-[10px] font-bold uppercase ${source.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                            {source.enabled ? source.status : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEdit(source)}
                          className="text-xs text-primary hover:text-primary/80 font-bold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleSource(source.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            source.enabled 
                              ? 'bg-primary text-white' 
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {source.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Active Agents</h3>
                <div className="grid grid-cols-1 gap-4">
                  {settings.agents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
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
                          onClick={() => handleAgentAction(agent.id, 'logs')}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                          title="View Logs"
                        >
                          <Terminal size={16} />
                        </button>
                        <button 
                          onClick={() => handleAgentAction(agent.id, 'restart')}
                          className="p-2 bg-slate-700 hover:bg-primary/20 hover:text-primary rounded-lg text-slate-300 transition-colors"
                          title="Restart Agent"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{editId ? 'Edit Data Source' : 'Add New Data Source'}</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">ID (Internal)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. oracle_erp"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      disabled={!!editId} // Disable ID field when editing
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Oracle ERP Transactions"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Domain Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Finance"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Schema Path (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. db-schemas/oracle_schema.sql"
                      value={formData.schema_file}
                      onChange={(e) => setFormData({ ...formData, schema_file: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-2 pt-2">
                    <button 
                      onClick={handleSubmit}
                      type="submit" 
                      disabled={formLoading}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {formLoading && <RefreshCw size={16} className="animate-spin" />}
                      {editId ? 'Update Data Source' : 'Register Data Source'}
                    </button>
                    {editId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditId(null); setFormData({ id: '', name: '', domain: '', schema_file: '' }); }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl mt-2 transition-all"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Close
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
