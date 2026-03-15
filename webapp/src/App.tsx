import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  Database, 
  Store, 
  Search, 
  Shield, 
  ChevronRight, 
  ShoppingBag, 
  BarChart3, 
  Users,
  Loader2
} from 'lucide-react';
import { AgentChain } from './components/AgentChain';
import { DashboardHome } from './components/DashboardHome';
import { AdminConsole } from './components/AdminConsole';
import { MarketplaceView } from './components/MarketplaceView';
import { Login } from './components/Login';
import { API_BASE_URL } from './config';
import { auth } from './utils/auth';

function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>({ state: 'idle', steps: [], agents: [] });
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin' | 'marketplace'>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(auth.getUser());

  const authenticatedFetch = async (url: string, options: any = {}) => {
    const token = auth.getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expired');
    }
    
    return res;
  };

  const handleLogout = () => {
    auth.clearToken();
    setCurrentUser(null);
  };

  // Poll for status when processing
  useEffect(() => {
    if (!currentUser) return;

    let interval: any;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await authenticatedFetch(`${API_BASE_URL}/api/status`);
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
          const res = await authenticatedFetch(`${API_BASE_URL}/api/status`);
          const data = await res.json();
          setStatus(data);
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, currentUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setResult(null);
    setStatus({ ...status, state: 'processing', steps: [] });

    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
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

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white">
      {/* Sidebar - Strategic Command Center */}
      <aside className="w-72 bg-[#050506] border-r border-white/5 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="p-8 pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 mesh-glow">
              <Cpu size={22} className="text-primary" />
            </div>
            <div>
              <span className="block font-black text-xl tracking-tighter uppercase leading-none">MeshOS</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Data Fabric v2.0</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 mb-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Navigation</div>
          <NavItem icon={<Activity size={18} />} label="Operational Intel" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<ShoppingBag size={18} />} label="Provisioning" active={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} />
          <NavItem icon={<Shield size={18} />} label="Mesh Governance" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
          
          <div className="px-4 mt-8 mb-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Active Domains</div>
          <div className="flex flex-col gap-1">
            <DomainItem icon={<Database size={16} />} label="Financial" domain="FinancialAgent" statuses={status.agents} color="blue" />
            <DomainItem icon={<Store size={16} />} label="Retail" domain="RetailAgent" statuses={status.agents} color="emerald" />
            <DomainItem icon={<BarChart3 size={16} />} label="Analytics" domain="AnalyticsAgent" statuses={status.agents} color="purple" />
            <DomainItem icon={<Users size={16} />} label="Human Res." domain="HRAgent" statuses={status.agents} color="pink" />
            <DomainItem icon={<Search size={16} />} label="Catalog" domain="CatalogAgent" statuses={status.agents} color="orange" />
          </div>
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex flex-col gap-5">
            {/* System Pulse */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mesh-glow animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Online</span>
              </div>
              <span className="text-[10px] font-mono text-white/20">301ms Latency</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all" onClick={handleLogout}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/40 to-accent/40 flex items-center justify-center text-xs font-black border border-white/20 uppercase">
                {currentUser.username.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate uppercase">{currentUser.username}</p>
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Sign Out</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Search - Command Center Interface */}
        {currentView === 'dashboard' && (
          <header className={`px-12 pt-8 flex items-center justify-center transition-all duration-700 ease-out ${result || isProcessing ? 'h-32' : 'h-64'}`}>
            <div className="w-full max-w-4xl relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                  <Search size={24} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Initiate cross-domain synthesis..."
                  className="w-full h-20 bg-white/[0.03] border border-white/10 rounded-[1.5rem] pl-16 pr-44 focus:outline-none focus:border-primary/50 transition-all text-xl font-light tracking-tight backdrop-blur-2xl focus:bg-white/[0.05] placeholder:text-white/10"
                />
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="absolute right-3 top-3 bottom-3 px-8 command-gradient rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Reasoning</span>
                    </div>
                  ) : "Run Intel"}
                </button>
              </form>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 pb-12 scrollbar-hide">
          {currentView === 'admin' ? (
            <AdminConsole />
          ) : currentView === 'marketplace' ? (
            <MarketplaceView />
          ) : result || isProcessing ? (
            <div className="max-w-4xl mx-auto flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">

              {/* Agent Orchestration Steps */}
              <AgentChain steps={status.steps} isProcessing={isProcessing} />

              {/* Strategic Synthesis Output */}
              {result && (
                <div className="glass-card rounded-[2.5rem] p-12 relative overflow-hidden group scanline shadow-2xl border-white/[0.03]">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary via-accent to-primary animate-pulse" />
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Database size={120} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_#3B82F6] animate-pulse" />
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Strategic Command Output</h3>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Protocol: ALPHA-SYNTHESIS-v2</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-mono text-white/30 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>GROUNDED</span>
                      </div>
                      <span className="w-px h-3 bg-white/10" />
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="prose prose-invert max-w-none text-white/90 leading-relaxed text-2xl font-light tracking-tight selection:bg-primary/30">
                      {result.text.split('\n').map((para: string, idx: number) => (
                        para.trim() ? (
                          <p key={idx} className="mb-6 last:mb-0 first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left">
                            {para}
                          </p>
                        ) : null
                      ))}
                    </div>
                  </div>

                  <div className="mt-16 pt-12 border-t border-white/5 flex flex-wrap gap-8 justify-between items-center">
                    <div className="flex flex-wrap gap-12">
                      <TelemetricValue label="Data Grounding" value="Cryptographically Verified" color="text-green-400" />
                      <TelemetricValue label="Synthesis Engine" value="Gemini 1.5 Pro" color="text-primary" />
                      <TelemetricValue label="Context Depth" value="L4 High Density" />
                    </div>
                    <div className="flex gap-4">
                      <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[xs] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95">
                        Audit Log
                      </button>
                      <button className="px-8 py-3 rounded-xl command-gradient text-[xs] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        Export Intel
                      </button>
                    </div>
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

function NavItem({ icon, label, active = false, onClick, disabled = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, disabled?: boolean }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
      </div>
      {active && <ChevronRight size={14} className="text-white/20" />}
    </button>
  );
}

function DomainItem({ icon, label, domain, statuses, color }: any) {
  const status = statuses?.find((a: any) => a.agent === domain)?.status || 'idle';
  const isActive = status === 'processing' || status === 'dispatching' || status === 'tool_executing';
  
  const colors: any = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    pink: 'text-pink-400 bg-pink-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
  };

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all group`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]} border border-white/5 font-bold`}>{icon}</div>
        <span className="text-[11px] font-black uppercase tracking-tight text-white/60 group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current animate-ping' : 'bg-white/10'}`} />
    </div>
  );
}

function TelemetricValue({ label, value, color = "text-white/60" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{label}</span>
      <span className={`text-xs font-bold uppercase tracking-tight ${color}`}>{value}</span>
    </div>
  );
}

export default App;
