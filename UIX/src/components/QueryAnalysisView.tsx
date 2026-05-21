import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, FileText, CheckCircle2, TrendingUp, Plus, Trash2, History, Clock, Tag } from 'lucide-react';
import { api } from '../utils/api';

export const QueryAnalysisView = ({ initialQuery, onShowSource, onClearQuery }: { initialQuery?: string, onShowSource: () => void, onClearQuery?: () => void }) => {
  const [queryState, setQueryState] = useState<any>(null);
  const [runTriggered, setRunTriggered] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.get('/api/sessions');
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await api.post('/api/sessions', {});
      if (res && res.id) {
        await fetchSessions();
        setActiveSessionId(res.id);
        setQueryState(null);
        setRunTriggered(false);
        if (onClearQuery) onClearQuery();
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/sessions/${id}`);
      await fetchSessions();
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setQueryState(null);
        setRunTriggered(false);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    try {
      const session = await api.get(`/api/sessions/${id}`);
      if (session) {
        // Build simulated queryState from session history
        const lastMsg = session.messages ? [...session.messages].reverse().find(m => m.role === 'USER') : null;
        setQueryState({
          state: 'completed',
          lastQuery: lastMsg ? lastMsg.text : 'Historical Session',
          steps: session.messages ? session.messages.filter(m => m.role === 'TOOL_CALL').map((m: any) => ({
            agent: m.agent || 'Agent',
            query: m.text,
            result: 'Executed in history'
          })) : []
        });
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const runQuery = async () => {
      if (initialQuery && !runTriggered) {
        setRunTriggered(true);
        try {
          const body: any = { query: initialQuery };
          if (activeSessionId) {
            body.sessionId = activeSessionId;
          }
          const res = await api.post('/api/query', body);
          if (res && res.sessionId && !activeSessionId) {
            setActiveSessionId(res.sessionId);
          }
          fetchSessions();
        } catch (err) {
          console.error('Failed to run query:', err);
        }
      }
    };
    runQuery();
  }, [initialQuery, runTriggered, activeSessionId]);

  useEffect(() => {
    const fetchStatus = async () => {
      // Only poll when actively running a query
      if (runTriggered && queryState?.state !== 'completed' && queryState?.state !== 'error') {
        try {
          const data = await api.get('/api/status');
          setQueryState(data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [runTriggered, queryState?.state]);

  const isQueryActive = queryState && (queryState.state === 'processing' || queryState.state === 'completed' || runTriggered);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Session Management Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 p-4 flex flex-col justify-between h-full">
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History size={16} /> Sessions History
            </h3>
            <button
              onClick={handleCreateSession}
              className="p-1.5 bg-primary hover:bg-primary/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              title="New Session"
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 thin-scrollbar">
            {loadingSessions && sessions.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic">No previous sessions found.</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between group ${
                    activeSessionId === s.id
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className="text-xs font-bold truncate">
                      {s.messages && s.messages.length > 0 ? s.messages[0].text : `Session ${s.id.substring(0, 8)}`}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-8">
        {!isQueryActive ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                <Database size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Queries</h2>
              <p className="text-slate-600 dark:text-slate-400">Ask the Data Agent a question from the dashboard or select a session to see execution tracing.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-start">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-primary/30">
                    Active Query Analysis
                  </span>
                  <span className="text-slate-500 font-mono text-xs">Status: {queryState?.state || 'Initializing...'}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                  "{queryState?.lastQuery || initialQuery || 'Analyzing data...'}"
                </h2>
              </div>
              <button 
                onClick={onShowSource}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <FileText size={16} /> View Source JSON
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-2xl border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6 bg-white dark:bg-slate-900/40">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4">Agent Execution Trace</h3>
                  <div className="space-y-6">
                    {(!queryState?.steps || queryState.steps.length === 0) && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 p-4">
                        <RefreshCw size={16} className="animate-spin text-primary" />
                        <span>The Orchestrator is planning the data mesh execution trace...</span>
                      </div>
                    )}
                    {queryState?.steps?.map((step: any, i: number) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== queryState.steps.length - 1 && (
                          <div className="absolute left-4 top-10 bottom-[-24px] w-[2px] bg-slate-200 dark:bg-slate-800" />
                        )}
                        <div className={`mt-1 size-8 rounded-full flex flex-shrink-0 items-center justify-center border-2 z-10 bg-white dark:bg-background-dark ${
                          step.result ? 'border-green-500 text-green-500' :
                          'border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        }`}>
                          {step.result ? <CheckCircle2 size={16} /> : <RefreshCw size={14} className="animate-spin" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {step.agent}
                            </h4>
                            <div className="flex items-center gap-2">
                              {step.durationMs !== undefined && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock size={8} /> {step.durationMs}ms
                                </span>
                              )}
                              {step.traceId && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                  <Tag size={8} /> {step.traceId}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{step.query}</p>
                          
                          {step.result && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto">
                              <pre className="whitespace-pre-wrap">{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : step.result}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {queryState?.context && (
                  <div className="glass rounded-2xl border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6 bg-white dark:bg-slate-900/40">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4">Context Window Analysis</h3>
                    <div className="space-y-4">
                      {queryState.context.horizontal && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Global Mesh Context (RAG)</h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{queryState.context.horizontal}</pre>
                          </div>
                        </div>
                      )}
                      {queryState.context.vertexMemories && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vertex Long-Term Memories</h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{queryState.context.vertexMemories}</pre>
                          </div>
                        </div>
                      )}
                      {queryState.context.plan && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Strategic Plan</h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{queryState.context.plan}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="glass rounded-2xl border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/40">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Execution Context</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-1">Elapsed Time</p>
                      <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                        {queryState?.state === 'processing' ? 'Calculating...' : 'Synced'}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 uppercase mb-3">Active State</p>
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-md">
                        {queryState?.state || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl border-slate-200 dark:border-slate-800 p-6 bg-gradient-to-br from-primary/10 to-transparent">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <TrendingUp size={16} /> Live Data Insights
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                    The Agent Orchestrator synthesizes responses by joining data across specialized domain agents. Ensure agents are healthy in Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
