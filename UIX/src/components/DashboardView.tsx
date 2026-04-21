import React from 'react';
import { 
  Search, RefreshCw, CheckCircle2, Circle, 
  Activity, Globe, BarChart3, Users, MoreVertical 
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../utils/api';
import type { View } from '../types';

export const DashboardView = ({ onNavigate }: { onNavigate: (view: View, query?: string) => void }) => {
  const [status, setStatus] = React.useState<any>({ agents: [], steps: [] });
  const [metrics, setMetrics] = React.useState<any>({ uptime: {}, latency: {} });
  const [searchText, setSearchText] = React.useState('');
  
  const fetchData = async () => {
    try {
      const [statusData, metricsData] = await Promise.all([
        api.get('/api/status'),
        api.get('/api/metrics')
      ]);
      setStatus(statusData);
      if (metricsData.metrics) {
        setMetrics(metricsData.metrics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const getAgentStatus = (id: string) => {
    const agent = status.agents?.find((a: any) => a.agent === id);
    return agent ? (agent.status === 'processing' ? 'Active' : 'Standby') : 'Offline';
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-end mb-4">
        <button 
          onClick={fetchData}
          className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {/* Search Header */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-6 text-slate-400" size={20} />
            <input 
              className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 py-4 pl-16 pr-32 text-lg placeholder:text-slate-500" 
              placeholder="Ask the Data Agent anything..." 
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === 'Enter' && searchText.trim()) {
                    onNavigate('query-analysis', searchText);
                 }
              }}
            />
            <div className="absolute right-3 flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-slate-200 dark:bg-white/10 rounded text-[10px] text-slate-600 dark:text-slate-400">⌘ K</kbd>
              <button 
                onClick={() => searchText.trim() && onNavigate('query-analysis', searchText)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
              >
                Ask Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Oracle ERP', status: getAgentStatus('FinancialAgent'), uptime: metrics.uptime?.FinancialAgent || 'N/A', latency: metrics.latency?.FinancialAgent || 'N/A', color: 'orange' },
          { name: 'Spanner Retail', status: getAgentStatus('RetailAgent'), uptime: metrics.uptime?.RetailAgent || 'N/A', latency: metrics.latency?.RetailAgent || 'N/A', color: 'blue' },
          { name: 'BigQuery Analytics', status: getAgentStatus('AnalyticsAgent'), uptime: metrics.uptime?.AnalyticsAgent || 'N/A', latency: metrics.latency?.AnalyticsAgent || 'N/A', color: 'purple' },
        ].map((source) => (
          <div key={source.name} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{source.name}</h4>
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full bg-${source.color === 'orange' ? 'orange' : source.color === 'blue' ? 'blue' : 'purple'}-500`}></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{source.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1">Uptime</p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{source.uptime}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1">Latency</p>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{source.latency}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Active Task Card */}
      <section className="w-full">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-primary/5 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
              <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <RefreshCw size={40} className="text-primary" />
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Active Task</span>
            </div>
            <div className="flex-1 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">A2A Orchestrator</h2>
                  <p className="text-slate-600 dark:text-slate-400">Processing cross-domain inventory synchronization</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">65%</span>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Efficiency Rate</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    style={{ width: '65%' }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-green-600 dark:text-green-500">
                    <CheckCircle2 size={16} />
                    <span>Connecting to Spanner Retail... <span className="font-bold">Complete</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <RefreshCw size={16} className="text-primary" />
                    <span className="font-medium">Analyzing Inventory Data...</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Circle size={16} />
                    <span>Cross-referencing with Oracle ERP... <span className="italic text-xs">Waiting</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 'oracle-detail', title: 'Oracle ERP', desc: 'Global Resource Planning', color: 'orange', icon: Activity, stats: [{ label: 'ERP Connections', value: 'Active', status: 'success' }, { label: 'Primary Node', value: 'us-east-1' }] },
          { id: 'spanner-detail', title: 'Spanner Retail', desc: 'Distributed Inventory Cloud', color: 'blue', icon: Globe, stats: [{ label: 'Global Inventory', value: 'Synced', status: 'info' }, { label: 'Avg. Latency', value: '12ms' }] },
          { id: 'bigquery-detail', title: 'BigQuery Analytics', desc: 'High-Performance Insights', color: 'purple', icon: BarChart3, stats: [{ label: 'Marketing Insights', value: 'Ready', status: 'purple' }, { label: 'Active Jobs', value: '14' }] },
          { id: 'alloy-detail', title: 'AlloyDB CRM', desc: 'Customer Relationship Cluster', color: 'cyan', icon: Users, stats: [{ label: 'Service Status', value: 'Online', status: 'success' }, { label: 'Pending Tickets', value: '3 Priority', status: 'cyan' }] },
        ].map((card) => (
          <div 
            key={card.id}
            onClick={() => onNavigate(card.id as View)}
            className="group bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer shadow-sm dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${
                card.color === 'orange' ? 'bg-orange-500/10 group-hover:bg-orange-500' :
                card.color === 'blue' ? 'bg-blue-500/10 group-hover:bg-blue-500' :
                card.color === 'purple' ? 'bg-purple-500/10 group-hover:bg-purple-500' :
                'bg-cyan-500/10 group-hover:bg-cyan-500'
              }`}>
                <card.icon className={`group-hover:text-white ${
                  card.color === 'orange' ? 'text-orange-500' :
                  card.color === 'blue' ? 'text-blue-500' :
                  card.color === 'purple' ? 'text-purple-500' :
                  'text-cyan-500'
                }`} size={24} />
              </div>
              <MoreVertical className="text-slate-400 dark:text-slate-700 cursor-pointer" size={20} />
            </div>
            <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">{card.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{card.desc}</p>
            <div className="space-y-3">
              {card.stats.map((stat, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-500">{stat.label}</span>
                  <span className={`font-semibold ${stat.status === 'success' ? 'text-green-600 dark:text-green-500' : stat.status === 'info' ? 'text-blue-600 dark:text-blue-400' : stat.status === 'purple' ? 'text-purple-600 dark:text-purple-400' : stat.status === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/50">
                {card.id === 'oracle-detail' && (
                  <div className="h-16 w-full flex items-end gap-1">
                    {[0.5, 0.6, 0.75, 0.5, 0.8, 0.75, 1].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                )}
                {card.id === 'spanner-detail' && (
                  <div className="h-16 w-full flex items-center justify-center relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
                    <Globe className="text-blue-400" size={24} />
                  </div>
                )}
                {card.id === 'bigquery-detail' && (
                  <div className="grid grid-cols-4 gap-2">
                    {[true, true, 'pulse', false].map((state, i) => (
                      <div key={i} className={`h-10 rounded-lg flex items-center justify-center ${state === false ? 'bg-slate-100 dark:bg-slate-800' : 'bg-purple-500/10'}`}>
                        {state !== false && <div className={`size-2 rounded-full bg-purple-500`} />}
                      </div>
                    ))}
                  </div>
                )}
                {card.id === 'alloy-detail' && (
                  <div className="flex gap-2">
                    {[1, 2].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Users size={14} className="text-slate-600 dark:text-slate-500" />
                      </div>
                    ))}
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">+</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
