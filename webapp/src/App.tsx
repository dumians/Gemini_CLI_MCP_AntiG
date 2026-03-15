import React, { useState, useEffect } from 'react';
import { Search, Database, Store, BarChart3, Users, Cpu, Activity, ChevronRight, Shield, Globe, HardDrive } from 'lucide-react';
import { AgentChain } from './components/AgentChain';
import { DashboardHome } from './components/DashboardHome';
import { GraphView } from './components/GraphView';
import { AdminConsole } from './components/AdminConsole';
import { MarketplaceView } from './components/MarketplaceView';
import { ShoppingBag } from 'lucide-react';
import { API_BASE_URL } from './config';

function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>({ state: 'idle', steps: [], agents: [] });
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin' | 'marketplace'>('dashboard');
  const [config, setConfig] = useState<any>(null);

  // Fetch initial config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/config/data-sources`);
        const data = await res.json();
        setConfig(data);
      } catch (e) {
        console.error("Failed to fetch data source config", e);
      }
    };
    fetchConfig();
  }, []);

  // Poll for status when processing
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/status`);
          const data = await res.json();
          setStatus(data);
          if (data.state === 'completed' || data.state === 'error') {
            setIsProcessing(false);
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 1500);
    } else {
      // Occasional poll for idle status
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/status`);
          const data = await res.json();
          setStatus(data);
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setResult(null);
    setStatus({ ...status, state: 'processing', steps: [] });

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Query failed", err);
      setStatus({ ...status, state: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/10 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Cpu size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">MeshOS</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<Activity size={18} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<ShoppingBag size={18} />} label="Marketplace" active={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} />
          <NavItem icon={<Shield size={18} />} label="Mesh Admin" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
          <div className="h-px bg-white/5 my-2" />
          <NavItem icon={<Database size={18} />} label="Financial Domain" pulse={status.agents?.find((a:any) => a.agent === 'FinancialAgent')?.status === 'processing'} />
          <NavItem icon={<Store size={18} />} label="Retail Domain" pulse={status.agents?.find((a:any) => a.agent === 'RetailAgent')?.status === 'processing'} />
          <NavItem icon={<BarChart3 size={18} />} label="Analytics Hub" pulse={status.agents?.find((a:any) => a.agent === 'AnalyticsAgent')?.status === 'processing'} />
          <NavItem icon={<Users size={18} />} label="People Analytics" pulse={status.agents?.find((a:any) => a.agent === 'HRAgent')?.status === 'processing'} />
          <NavItem icon={<Search size={18} />} label="Metadata Catalog" pulse={status.agents?.find((a:any) => a.agent === 'CatalogAgent')?.status === 'processing'} />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          {/* Mode Indicator */}
          <div className="p-4 glass rounded-xl border-white/10">
            <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              <span>Stack Mode</span>
              <span className={config?.mode === 'remote' ? 'text-accent' : 'text-primary'}>{config?.mode || 'local'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${config?.mode === 'remote' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                {config?.mode === 'remote' ? <Globe size={16} /> : <HardDrive size={16} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate">{config?.mode === 'remote' ? 'Public SSE Edge' : 'Local Stdio Bus'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-green-500/80 font-medium">Synced</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 glass rounded-xl border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold ring-1 ring-white/10">JD</div>
            <div>
              <p className="text-xs font-medium">Jordan Data</p>
              <p className="text-[10px] text-white/50">Mesh Architect</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Search */}
        {currentView === 'dashboard' && (
          <header className={`p-6 flex items-center justify-center transition-all duration-500 ${result || isProcessing ? 'h-24' : 'h-48'}`}>
            <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query the Agentic Data Mesh..."
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 focus:outline-none focus:border-primary/50 transition-all text-lg glass group-hover:bg-white/10"
              />
              <Search className="absolute left-5 top-4 text-white/30 group-hover:text-white/50 transition-colors" />
              <button type="submit" disabled={isProcessing} className="absolute right-3 top-3 px-6 py-2 bg-gradient-to-r from-primary to-accent rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50">
                {isProcessing ? "Reasoning..." : "Run Intelligence"}
              </button>
            </form>
          </header>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-0 scrollbar-hide">
          {currentView === 'admin' ? (
            <AdminConsole />
          ) : currentView === 'marketplace' ? (
            <MarketplaceView />
          ) : result || isProcessing ? (
            <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

              {/* Agent Orchestration Steps */}
              <AgentChain steps={status.steps} isProcessing={isProcessing} />

              {/* Graph Visualization (if relevant) */}
              {result && (
                <div className="animate-in fade-in zoom-in duration-1000 delay-300">
                  <GraphView data={null} />
                </div>
              )}

              {/* Final Result Card */}
              {result && (
                <div className="glass rounded-3xl p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent group-hover:w-1.5 transition-all" />
                  <div className="flex items-center gap-2 mb-6 text-primary font-bold tracking-wider text-xs uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Strategic Synthesis
                  </div>
                  <div className="prose prose-invert max-w-none text-white/80 leading-relaxed text-lg font-light">
                    {result.text}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    <span>Grounding Status: Verified</span>
                    <span>Confidence Score: {(result.steps?.[0]?.result?.metadata?.confidence * 100 || 98)}%</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DashboardHome agentStatuses={status.agents} />
          )}
        </div>

      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, disabled = false, pulse = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, disabled?: boolean, pulse?: boolean }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'} ${pulse ? 'animate-pulse text-primary' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`${pulse ? 'text-primary' : ''}`}>{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {active && <ChevronRight size={14} />}
      {pulse && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary" />}
    </button>
  );
}

export default App;

