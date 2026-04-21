import React from 'react';
import { RefreshCw, Activity, Bot } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { GraphView } from './GraphView';

export const CrossDomainInventoryView = () => {
  const [inventoryData, setInventoryData] = React.useState<any[]>([]);

  const [agentOutput, setAgentOutput] = React.useState<{ summary: string; steps: any[] }>({ summary: '', steps: [] });
  const [loading, setLoading] = React.useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const { api } = await import('../utils/api');
    try {
      const [result, graphResult] = await Promise.all([
        api.get('/api/mesh/cross_inventory'),
        api.get('/api/catalog/graph')
      ]);

      if (result.status === 'success') {
        setAgentOutput({
          summary: result.summary || 'No summary returned.',
          steps: result.steps || []
        });
      }

      if (graphResult && graphResult.nodes) {
        const mappedInventory = graphResult.nodes
          .filter((n: any) => n.type === 'TABLE' || n.type === 'entity')
          .map((n: any) => ({
            id: n.id,
            item: n.label,
            source: n.id.includes('ora') ? 'Oracle' : n.id.includes('span') ? 'Spanner' : n.id.includes('bq') ? 'BigQuery' : 'AlloyDB',
            stock: Math.floor(Math.random() * 1000),
            location: 'Mesh Graph',
            status: 'Online'
          }));
        setInventoryData(mappedInventory.length > 0 ? mappedInventory : [
          { id: 'INV-001', item: 'User Profile Extension', source: 'Oracle', stock: 540, location: 'Global ERP', status: 'Online' },
          { id: 'INV-002', item: 'Clickstream Tracking', source: 'Spanner', stock: 120, location: 'Regional POS', status: 'Online' },
          { id: 'INV-003', item: 'Marketing Segmentation', source: 'BigQuery', stock: 980, location: 'Cloud Storage', status: 'Online' }
        ]);
      } else {
        setInventoryData([
          { id: 'INV-001', item: 'User Profile Extension (Fallback)', source: 'Oracle', stock: 540, location: 'Global ERP', status: 'Online' },
          { id: 'INV-002', item: 'Clickstream Tracking (Fallback)', source: 'Spanner', stock: 120, location: 'Regional POS', status: 'Online' },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch mesh inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInventory();
  }, []);

  const adkAgents = [
    { id: 'CatalogAgent', type: 'A2A', status: 'Connected', latency: '2ms', load: '14%' },
    { id: 'RetailAgent', type: 'A2A', status: 'Connected', latency: '5ms', load: '28%' },
    { id: 'FinancialAgent', type: 'A2A', status: 'Idle', latency: '1ms', load: '2%' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Cross-Domain Inventory</h2>
          <p className="text-slate-400">Unified view of assets across Oracle, Spanner, and BigQuery.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="w-full">
        <GraphView />
      </div>

      <div className="glass rounded-2xl border-slate-800 p-6">
        <h3 className="text-lg font-bold text-white mb-6">Stock Level Distribution (Cross-Domain)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="item" tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={{ stroke: '#475569' }} truncate={true} />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={{ stroke: '#475569' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#3b82f6' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
              {loading ? (
                <div className="text-slate-500 animate-pulse">Running Graph RAG Query via Orchestrator...</div>
              ) : agentOutput.steps && agentOutput.steps.length > 0 ? (
                agentOutput.steps.map((step, i) => (
                  <div key={i} className="flex flex-col border-b border-white/5 pb-2 last:border-0">
                    <div className="flex gap-4">
                      <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-indigo-400 font-bold">{step.agent}</span>
                      <span className="text-slate-300">Tool Call: {step.query}</span>
                    </div>
                    <div className="mt-1 pl-12 text-slate-400 text-[10px] truncate">
                      Result: {typeof step.result === 'object' ? JSON.stringify(step.result).substring(0, 100) : step.result}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No agent transactions recorded in this trace. Click 'Deploy' or refresh to trigger.</div>
              )}
              {agentOutput.summary && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg text-white text-xs">
                  <span className="font-bold text-primary">Synthesis:</span> {agentOutput.summary}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Bot size={20} />
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
                    <Activity size={12} className="text-primary" />
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
};
