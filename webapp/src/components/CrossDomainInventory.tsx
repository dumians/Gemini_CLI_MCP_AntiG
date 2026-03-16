import React from 'react';
import { RefreshCw, Cpu, Activity, Bot } from 'lucide-react';

export function CrossDomainInventoryView() {
  const inventoryData = [
    { id: 'INV-001', item: 'Enterprise Server X1', source: 'Oracle', stock: 45, status: 'In Stock', location: 'Global-West' },
    { id: 'SKU-882', item: 'Retail Display Unit', source: 'Spanner', stock: 1200, status: 'High Demand', location: 'Retail-Hub' },
    { id: 'BQ-DATA-01', item: 'Cold Storage Archive', source: 'BigQuery', stock: 850, status: 'Optimized', location: 'Data-Lake' },
    { id: 'INV-002', item: 'Network Switch L3', source: 'Oracle', stock: 12, status: 'Low Stock', location: 'Global-East' },
    { id: 'SKU-441', item: 'POS Terminal V2', source: 'Spanner', stock: 340, status: 'In Stock', location: 'Retail-Hub' },
    { id: 'BQ-DATA-02', item: 'Real-time Stream Buffer', source: 'BigQuery', stock: 2100, status: 'Active', location: 'Data-Lake' },
  ];

  const adkAgents = [
    { id: 'ADK-01', type: 'A2A', status: 'Connected', latency: '2ms', load: '14%' },
    { id: 'ADK-02', type: 'A2UI', status: 'Connected', latency: '5ms', load: '28%' },
    { id: 'ADK-03', type: 'A2A', status: 'Idle', latency: '1ms', load: '2%' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Cross-Domain Inventory</h2>
          <p className="text-slate-400">Unified view of assets across Oracle, Spanner, and BigQuery.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2">
            <RefreshCw size={16} /> Sync All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <section className="glass rounded-2xl border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Aggregated Inventory</h3>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded uppercase">Oracle</span>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase">Spanner</span>
                <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold rounded uppercase">BigQuery</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-widest">
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Source Domain</th>
                    <th className="px-6 py-4 font-semibold">Stock Level</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {inventoryData.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{item.item}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          item.source === 'Oracle' ? 'bg-orange-500/10 text-orange-500' :
                          item.source === 'Spanner' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {item.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-300">{item.stock}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{item.location}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold ${
                          item.status === 'Low Stock' ? 'text-red-500' :
                          item.status === 'High Demand' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass rounded-2xl border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">ADK Agent Communication Console</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">A2A Protocol</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">A2UI Interface</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-black/20 font-mono text-[11px] space-y-2 h-64 overflow-y-auto">
              {[
                { time: '04:08:12', agent: 'ADK-01', type: 'A2A', msg: 'Handshake initiated with Spanner-Node-7' },
                { time: '04:08:14', agent: 'ADK-02', type: 'A2UI', msg: 'Rendering inventory delta for Global-West' },
                { time: '04:08:15', agent: 'ADK-01', type: 'A2A', msg: 'Syncing stock level for SKU-882 [SUCCESS]' },
                { time: '04:08:18', agent: 'ADK-03', type: 'A2A', msg: 'Heartbeat signal received from Oracle-DB-Core' },
                { time: '04:08:22', agent: 'ADK-02', type: 'A2UI', msg: 'User session validated via Federated Auth' },
                { time: '04:08:25', agent: 'ADK-01', type: 'A2A', msg: 'Requesting BigQuery cold storage audit log' },
                { time: '04:08:28', agent: 'ADK-02', type: 'A2UI', msg: 'Pushing real-time alerts to dashboard UI' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 border-b border-white/5 pb-1 last:border-0">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={log.type === 'A2A' ? 'text-indigo-400' : 'text-emerald-400'}>{log.agent}</span>
                  <span className="text-slate-500">[{log.type}]</span>
                  <span className="text-slate-300">{log.msg}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Cpu size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">ADK Agents</h3>
            </div>
            <div className="space-y-4">
              {adkAgents.map((agent, i) => (
                <div key={i} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-slate-400" />
                      <span className="text-sm font-bold text-white">{agent.id}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      agent.type === 'A2A' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {agent.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <p className="text-slate-500 uppercase mb-1">Status</p>
                      <p className="text-green-500 font-bold">{agent.status}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase mb-1">Latency</p>
                      <p className="text-white font-mono">{agent.latency}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase mb-1">Load</p>
                      <p className="text-white font-mono">{agent.load}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Communicating via {agent.type === 'A2A' ? 'A2A Protocol' : 'A2UI Interface'}</span>
                    <Activity size={12} className="text-primary animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-all rounded-xl border border-primary/30">
              Deploy New ADK Agent
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
