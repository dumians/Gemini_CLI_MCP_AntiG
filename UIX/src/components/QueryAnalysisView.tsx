import React from 'react';
import { RefreshCw, Database, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export const QueryAnalysisView = ({ onShowSource }: { onShowSource: () => void }) => {
  const [queryState, setQueryState] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.get('/api/status');
        setQueryState(data.queryState);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!queryState || queryState.status === 'idle') {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
            <Database size={40} />
          </div>
          <h2 className="text-xl font-bold text-white">No Active Queries</h2>
          <p className="text-slate-400">Ask the Data Agent a question from the dashboard to see real-time execution analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-start">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-primary/30">
              Active Query Analysis
            </span>
            <span className="text-slate-500 font-mono text-xs">ID: {queryState?.id || 'Q-8829-AB'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            "{queryState?.query || 'Analyzing retail performance across regions'}"
          </h2>
        </div>
        <button 
          onClick={onShowSource}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-700"
        >
          <FileText size={16} /> View Source JSON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl border-slate-800 p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-4">Agent Execution Trace</h3>
            <div className="space-y-6">
              {queryState?.steps?.map((step: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== queryState.steps.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-24px] w-[2px] bg-slate-800" />
                  )}
                  <div className={`mt-1 size-8 rounded-full flex flex-shrink-0 items-center justify-center border-2 z-10 bg-background-dark ${
                    step.status === 'completed' ? 'border-green-500 text-green-500' :
                    step.status === 'processing' ? 'border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                    'border-slate-700 text-slate-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 size={16} /> : 
                     step.status === 'processing' ? <RefreshCw size={14} className="animate-spin" /> : 
                     <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <div className={`flex-1 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                    <h4 className={`text-base font-bold mb-1 ${step.status === 'processing' ? 'text-white' : 'text-slate-300'}`}>
                      {step.agent}
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{step.action}</p>
                    
                    {step.status === 'completed' && step.details && (
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 font-mono text-xs text-slate-300 overflow-x-auto">
                        {step.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Execution Context</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Total Time Elapsed</p>
                <p className="text-2xl font-mono font-bold text-white">{(queryState?.timeElapsed || 0) / 1000}s</p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase mb-3">Involved Domains</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-md">Spanner (Retail)</span>
                  <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-md">Oracle (ERP)</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase mb-3">Data Confidence</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '98%' }} />
                  </div>
                  <span className="text-sm font-bold text-green-500">98%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border-slate-800 p-6 bg-gradient-to-br from-primary/10 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Live Insights Insights
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on the initial Spanner aggregation, retail sales for SKU-882 are up 14% WoW in the EMEA region.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
