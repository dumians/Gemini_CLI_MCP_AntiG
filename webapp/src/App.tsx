import React, { useState, useEffect } from 'react';
import { Search, Database, Store, BarChart3, Users, Cpu, Activity, ChevronRight, MessageSquare, Shield } from 'lucide-react';
import { AgentChain } from './components/AgentChain';
import { DashboardHome } from './components/DashboardHome';
import { GraphView } from './components/GraphView';
import { AdminConsole } from './components/AdminConsole';

function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>({ state: 'idle', steps: [] });
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  // Poll for status when processing
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:3001/api/status');
          const data = await res.json();
          setStatus(data);
          if (data.state === 'completed' || data.state === 'error') {
            setIsProcessing(false);
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setResult(null);
    setStatus({ state: 'processing', steps: [] });

    try {
      const res = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Query failed", err);
      setStatus({ state: 'error', steps: [] });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/10 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">Data Agent</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<Activity size={18} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<Shield size={18} />} label="Mesh Admin" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
          <div className="h-px bg-white/5 my-2" />
          <NavItem icon={<Database size={18} />} label="Oracle ERP" disabled />
          <NavItem icon={<Store size={18} />} label="Spanner Retail" disabled />
          <NavItem icon={<BarChart3 size={18} />} label="BigQuery Analytics" disabled />
          <NavItem icon={<Users size={18} />} label="AlloyDB CRM" disabled />
        </nav>

        <div className="mt-auto p-4 glass rounded-xl border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">EA</div>
            <div>
              <p className="text-xs font-medium">Enterprise Admin</p>
              <p className="text-[10px] text-white/50">Tier: Platinum</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Search */}
        {currentView === 'dashboard' && (
          <header className="p-6 h-28 flex items-center justify-center">
            <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask the A2A Orchestrator anything..."
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 focus:outline-none focus:border-primary/50 transition-all text-lg glass group-hover:bg-white/10"
              />
              <Search className="absolute left-5 top-4 text-white/30 group-hover:text-white/50 transition-colors" />
              <button type="submit" disabled={isProcessing} className="absolute right-3 top-3 px-4 py-2 bg-primary rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
                {isProcessing ? "Processing..." : "Analyze"}
              </button>
            </form>
          </header>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-0 scrollbar-hide">
          {currentView === 'admin' ? (
            <AdminConsole />
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
                <div className="glass rounded-3xl p-8 border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent" />
                  <div className="flex items-center gap-2 mb-6 text-primary font-semibold tracking-wider text-xs uppercase">
                    <MessageSquare size={14} />
                    Synthesized Insights
                  </div>
                  <div className="prose prose-invert max-w-none text-white/80 leading-relaxed text-lg">
                    {result.text}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DashboardHome />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, disabled = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, disabled?: boolean }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {active && <ChevronRight size={14} />}
    </button>
  );
}

export default App;
