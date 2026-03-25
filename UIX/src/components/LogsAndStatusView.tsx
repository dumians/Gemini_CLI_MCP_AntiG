import React from 'react';
import { Terminal, Activity, RefreshCw, Bot, Server } from 'lucide-react';

export const LogsAndStatusView = () => {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedDomain, setSelectedDomain] = React.useState<string>('all');

  const fetchLogsAndStatus = async () => {
    try {
      const { api } = await import('../utils/api');
      const [logsData, statusData] = await Promise.all([
        api.get('/api/admin/logs'),
        api.get('/api/status')
      ]);
      setLogs(Array.isArray(logsData) ? logsData : logsData?.logs || []);
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to fetch logs and status:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogsAndStatus();
    const interval = setInterval(fetchLogsAndStatus, 5000); // 5s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Logs & Agent Status</h2>
          <p className="text-slate-400">Live monitoring of the Agentic Data Mesh infrastructure.</p>
        </div>
        <button 
          onClick={fetchLogsAndStatus}
          className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Network & Agents Status */}
        <div className="space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">System Heartbeat</h3>
            </div>
            {status && (
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <span className="text-sm font-medium text-slate-400">Mesh State</span>
                  <span className={`text-sm font-bold uppercase ${status.state === 'idle' ? 'text-slate-400' : 'text-green-500'}`}>{status.state}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <span className="text-sm font-medium text-slate-400">Last Query</span>
                  <span className="text-sm font-mono text-white max-w-[200px] truncate">{status.lastQuery || 'None'}</span>
                </div>
              </div>
            )}
          </section>

          <section className="glass rounded-2xl border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Bot size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Known Agents</h3>
            </div>
            <div className="space-y-4">
              {status?.agents ? Object.entries(status.agents).map(([agentId, agState]: any) => (
                <div key={agentId} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-white">{agentId}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${agState === 'online' ? 'text-green-500' : 'text-slate-500'}`}>{agState}</span>
                </div>
              )) : (
                <div className="text-slate-500 text-sm">Waiting for agent registration...</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Full Logs Pane */}
        <div className="lg:col-span-2">
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
                  {log.traceId && (
                    <span className="text-[10px] text-slate-600 pl-16">Trace: {log.traceId}</span>
                  )}
                </div>
              )) : (
                <div className="text-slate-500">No logs found. Use the system to generate traffic.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
