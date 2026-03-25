import React from 'react';
import { RefreshCw, Database, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export const QueryAnalysisView = ({ initialQuery, onShowSource, onClearQuery }: { initialQuery?: string, onShowSource: () => void, onClearQuery?: () => void }) => {
  const [queryState, setQueryState] = React.useState<any>(null);
  const [runTriggered, setRunTriggered] = React.useState(false);
  
  React.useEffect(() => {
    const runQuery = async () => {
      if (initialQuery && !runTriggered) {
        setRunTriggered(true);
        try {
          await api.post('/api/query', { query: initialQuery });
        } catch (err) {
          console.error('Failed to run query:', err);
        }
      }
    };
    runQuery();
  }, [initialQuery, runTriggered]);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.get('/api/status');
        setQueryState(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const isQueryActive = queryState && (queryState.state === 'processing' || queryState.state === 'completed' || runTriggered);

  if (!isQueryActive) {
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
            <span className="text-slate-500 font-mono text-xs">Status: {queryState?.state || 'Initializing...'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            "{queryState?.lastQuery || initialQuery || 'Analyzing data...'}"
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
              {(!queryState?.steps || queryState.steps.length === 0) && (
                <div className="flex items-center gap-3 text-slate-400 p-4">
                  <RefreshCw size={16} className="animate-spin text-primary" />
                  <span>The Orchestrator is planning the data mesh execution trace...</span>
                </div>
              )}
              {queryState?.steps?.map((step: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== queryState.steps.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-24px] w-[2px] bg-slate-800" />
                  )}
                  <div className={`mt-1 size-8 rounded-full flex flex-shrink-0 items-center justify-center border-2 z-10 bg-background-dark ${
                    step.result ? 'border-green-500 text-green-500' :
                    'border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  }`}>
                    {step.result ? <CheckCircle2 size={16} /> : <RefreshCw size={14} className="animate-spin" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold mb-1 text-white">
                      {step.agent}
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{step.query}</p>
                    
                    {step.result && (
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 font-mono text-xs text-slate-300 overflow-x-auto">
                        <pre>{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : step.result}</pre>
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
                <p className="text-xs text-slate-500 uppercase mb-1">Elapsed Time</p>
                <p className="text-2xl font-mono font-bold text-white">
                  {queryState?.state === 'processing' ? 'Calculating...' : 'Synced'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase mb-3">Active State</p>
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-md">
                  {queryState?.state || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border-slate-800 p-6 bg-gradient-to-br from-primary/10 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Live Data Insights
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-mono">
              The Agent Orchestrator synthesizes responses by joining data across specialized domain agents. Ensure agents are healthy in Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
