import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Settings, X, Database, Bot, Terminal } from 'lucide-react';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setSettings(data);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleToggleSource = (id: string) => {
    const newSources = settings.dataSources.map((s: any) => 
      s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'online' : 'offline' } : s
    );
    const newSettings = { ...settings, dataSources: newSources };
    setSettings(newSettings);
    
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
  };

  const handleAgentAction = async (id: string, action: 'restart' | 'logs') => {
    if (action === 'restart') {
      await fetch(`/api/agents/${id}/restart`, { method: 'POST' });
      // Refresh settings
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } else {
      const res = await fetch(`/api/agents/${id}/logs`);
      const data = await res.json();
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
          {loading ? (
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
