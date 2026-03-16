import React, { useState, useEffect } from 'react';
import { Database, Store, BarChart3, Users, Zap, ShieldCheck } from 'lucide-react';
import type { View } from '../types';
import { api } from '../utils/api';

interface DashboardHomeProps {
  onNavigate: (view: View) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    // Fetch live status from the backend orchestrator
    const fetchStatus = async () => {
      try {
        const data = await api.get('/api/status');
        setStatusData(data);
      } catch (e) {
        console.error("Failed to fetch status:", e);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Quick lookup to pass status to cards
  const getAgentStatus = (id: string, defaultName: string) => {
    if (!statusData?.agents) return { status: 'idle', detail: defaultName };
    const found = statusData.agents.find((a: any) => a.agent === id);
    return {
      status: found ? found.status : 'idle',
      detail: found && found.last_query ? found.last_query : defaultName
    };
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Federated Data Mesh</h2>
          <p className="text-slate-400">Real-time status of cross-domain data agents and orchestration network.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
            <div className="size-2 rounded-full bg-green-500 mesh-glow" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Mesh Optimal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AgentCard 
          icon={<Store />} 
          title="Spanner Retail" 
          subtitle="Global Inventory"
          status={getAgentStatus('RetailAgent', 'Idling...').status}
          activity={getAgentStatus('RetailAgent', 'Idling...').detail}
          color="blue"
          onClick={() => onNavigate('spanner-detail')}
        />
        <AgentCard 
          icon={<BarChart3 />} 
          title="BigQuery Analytics" 
          subtitle="Market Intelligence"
          status={getAgentStatus('AnalyticsAgent', 'Idling...').status}
          activity={getAgentStatus('AnalyticsAgent', 'Idling...').detail}
          color="purple"
          onClick={() => onNavigate('bigquery-detail')}
        />
        <AgentCard 
          icon={<Database />} 
          title="Oracle ERP" 
          subtitle="Financial Ledger"
          status={getAgentStatus('FinancialAgent', 'Idling...').status}
          activity={getAgentStatus('FinancialAgent', 'Idling...').detail}
          color="orange"
          onClick={() => onNavigate('oracle-detail')}
        />
        <AgentCard 
          icon={<Users />} 
          title="AlloyDB CRM" 
          subtitle="Customer 360"
          status={getAgentStatus('HRAgent', 'Idling...').status}
          activity={getAgentStatus('HRAgent', 'Idling...').detail}
          color="cyan"
          onClick={() => onNavigate('alloy-detail')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-3xl p-8 border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={120} />
          </div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
            <Zap className="text-primary" size={24} />
            Mesh Telemetry
          </h3>
          <div className="grid grid-cols-3 gap-8 relative z-10">
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Global QPS</p>
              <p className="text-4xl font-mono text-white">1,248</p>
              <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[70%]" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Avg Latency</p>
              <p className="text-4xl font-mono text-white">42<span className="text-xl text-slate-500">ms</span></p>
              <div className="h-1 w-24 bg-green-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[40%]" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Active Nodes</p>
              <p className="text-4xl font-mono text-white">24<span className="text-xl text-slate-500">/24</span></p>
              <div className="h-1 w-24 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[100%]" />
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-4 bg-slate-900/50 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 h-32 overflow-y-auto">
            {statusData?.steps?.map((step: any, i: number) => (
              <div key={i} className="mb-2">
                <span className="text-primary mr-2">[{new Date(step.timestamp || Date.now()).toLocaleTimeString()}]</span>
                <span className="text-slate-300">{step.agent}</span>: 
                <span> {step.reasoning?.action || step.description || "Activity logged"}</span>
              </div>
            )) || (
              <div className="text-slate-600 italic">Waiting for orchestrator logs...</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              Governance Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">GDPR Compliance</span>
                <span className="text-xs font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded uppercase">Verified</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Cross-border Data</span>
                <span className="text-xs font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded uppercase">Verified</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">PII Masking Filter</span>
                <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-500 rounded uppercase">Active</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('governance')}
              className="w-full mt-6 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors border border-slate-800 rounded-xl hover:bg-slate-800"
            >
              View All Policies
            </button>
          </div>

          <div className="glass rounded-3xl p-6 border-slate-800 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('marketplace')}>
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Database size={32} />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">Data Marketplace</h4>
              <p className="text-xs text-slate-400">Discover and request access to published data products across the mesh.</p>
            </div>
            <span className="text-primary text-xs font-bold mt-2">Browse Catalog →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ icon, title, subtitle, status, activity, color, onClick }: any) {
  const isProcessing = status === 'processing' || status === 'dispatching' || status === 'tool_executing';
  
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20"
  };

  return (
    <div 
      onClick={onClick}
      className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`size-12 rounded-xl flex items-center justify-center ${colors[color]} border shadow-inner transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
          isProcessing ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {isProcessing ? 'Active' : 'Standby'}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">{subtitle}</p>
        <p className="text-xs text-slate-400 font-mono h-10 line-clamp-2">
          {activity || "Monitoring sub-system metrics"}
        </p>
      </div>
    </div>
  );
}
