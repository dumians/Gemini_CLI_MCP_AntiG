import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Store, 
  BarChart3, 
  Users, 
  Settings, 
  Search, 
  Bell,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Circle,
  MoreVertical,
  Activity,
  Terminal,
  Globe,
  ShieldCheck,
  Sparkles,
  Download,
  Copy,
  X,
  TrendingUp,
  GitBranch,
  Table,
  AlertTriangle,
  Info,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  Package,
  Cpu,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// --- Types ---
type View = 'dashboard' | 'query-analysis' | 'spanner-detail' | 'bigquery-detail' | 'marketplace' | 'governance' | 'governance-detail' | 'oracle-detail' | 'alloy-detail' | 'cross-domain-inventory' | 'data-domains';

interface Policy {
  id: string;
  name: string;
  status: 'Active' | 'Restricted' | 'Draft';
  domain: string;
  lastUpdated: string;
}

// --- Components ---

const Sidebar = ({ activeView, onViewChange, onOpenSettings }: { activeView: View, onViewChange: (view: View) => void, onOpenSettings: () => void }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, status: 'online' },
    { id: 'marketplace', label: 'Data Marketplace', icon: Store, status: 'online' },
    { id: 'governance', label: 'Federated Governance', icon: ShieldCheck, status: 'online' },
    { id: 'data-domains', label: 'Data Domains', icon: Globe, status: 'online' },
    { id: 'cross-domain-inventory', label: 'Cross-Domain Inventory', icon: Package, status: 'online' },
    { id: 'oracle-detail', label: 'Oracle ERP', icon: Database, status: 'online' },
    { id: 'spanner-detail', label: 'Spanner Retail', icon: Store, status: 'error' },
    { id: 'bigquery-detail', label: 'BigQuery Analytics', icon: BarChart3, status: 'online' },
    { id: 'alloy-detail', label: 'AlloyDB CRM', icon: Users, status: 'warning' },
  ];

  return (
    <aside className="w-72 flex-shrink-0 border-r border-slate-800 bg-background-dark flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Database size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-100 text-base font-bold leading-none">Data Agent</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">v2.4.0-enterprise</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              activeView === item.id || (item.id === 'governance' && activeView === 'governance-detail')
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="flex items-center">
              {item.status === 'online' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Live</span>
                  <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
              )}
              {item.status === 'warning' && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-yellow-500" />
                  <div className="size-1.5 rounded-full bg-yellow-500" />
                </div>
              )}
              {item.status === 'error' && (
                <div className="flex items-center gap-1.5">
                  <X size={12} className="text-red-500" />
                  <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                </div>
              )}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRWM7USIMO4BvNO9bl2IpBrLCNCAAaKCKX_KeZRjwh8xcAWloetSi3lnX3WYNUQvlgZGknXPnCxGCnfJgprzFdO8Tpm8rlUccNINH2qUwxF9JrtmHMyv-KFCABG9hzrTq29iOd74gxp9ge9zRNgmT3TYBDSt2vbByJ6DZa4Jhjx16AammwoXX6Yv4gTOApEeDo9xPGXgZbTGzyQ1SRgeSDduU63hAiWlEai3jgKy1bXxrrfUr76zliot1_OF4PpgufENojPWgm9e0" 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-100">Enterprise Admin</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Platinum Tier</p>
            </div>
          </div>
          <button 
            onClick={onOpenSettings}
            className="w-full py-2 bg-slate-700 text-xs font-medium rounded-lg hover:bg-primary transition-all"
          >
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ breadcrumbs }: { breadcrumbs: string[] }) => {
  return (
    <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between glass border-x-0">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb}>
            <span className={i === breadcrumbs.length - 1 ? "text-slate-100 font-medium" : "text-slate-500"}>
              {crumb}
            </span>
            {i < breadcrumbs.length - 1 && (
              <ChevronRight size={14} className="text-slate-600" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live System</span>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};

const DashboardView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Search Header */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <div className="w-full max-w-3xl glass rounded-2xl p-2 shadow-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-6 text-slate-400" size={20} />
            <input 
              className="w-full bg-transparent border-none focus:ring-0 text-slate-100 py-4 pl-16 pr-32 text-lg placeholder:text-slate-500" 
              placeholder="Ask the Data Agent anything..." 
              type="text"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-white/10 rounded text-[10px] text-slate-400">⌘ K</kbd>
              <button 
                onClick={() => onNavigate('query-analysis')}
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
          { name: 'Oracle ERP', status: 'Online', uptime: '99.9%', latency: '45ms', color: 'orange' },
          { name: 'Spanner Retail', status: 'Online', uptime: '99.99%', latency: '12ms', color: 'blue' },
          { name: 'BigQuery Analytics', status: 'Online', uptime: '100%', latency: '120ms', color: 'purple' },
        ].map((source) => (
          <div key={source.name} className="glass p-5 rounded-2xl border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white">{source.name}</h4>
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full bg-${source.color === 'orange' ? 'orange' : source.color === 'blue' ? 'blue' : 'purple'}-500 animate-pulse`}></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{source.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1">Uptime</p>
                <p className="text-sm font-mono font-bold text-white">{source.uptime}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1">Latency</p>
                <p className="text-sm font-mono font-bold text-white">{source.latency}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Active Task Card */}
      <section className="w-full">
        <div className="bg-slate-900/40 border border-primary/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-primary/5 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
              <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <RefreshCw size={40} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Active Task</span>
            </div>
            <div className="flex-1 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">A2A Orchestrator</h2>
                  <p className="text-slate-400">Processing cross-domain inventory synchronization</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">65%</span>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Efficiency Rate</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-green-500">
                    <CheckCircle2 size={16} />
                    <span>Connecting to Spanner Retail... <span className="font-bold">Complete</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="font-medium">Analyzing Inventory Data...</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
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
          { id: 'oracle', title: 'Oracle ERP', desc: 'Global Resource Planning', color: 'orange', icon: Activity, stats: [{ label: 'ERP Connections', value: 'Active', status: 'success' }, { label: 'Primary Node', value: 'us-east-1' }] },
          { id: 'spanner-detail', title: 'Spanner Retail', desc: 'Distributed Inventory Cloud', color: 'blue', icon: Globe, stats: [{ label: 'Global Inventory', value: 'Synced', status: 'info' }, { label: 'Avg. Latency', value: '12ms' }] },
          { id: 'bigquery-detail', title: 'BigQuery Analytics', desc: 'High-Performance Insights', color: 'purple', icon: BarChart3, stats: [{ label: 'Marketing Insights', value: 'Ready', status: 'purple' }, { label: 'Active Jobs', value: '14' }] },
          { id: 'alloy', title: 'AlloyDB CRM', desc: 'Customer Relationship Cluster', color: 'cyan', icon: Users, stats: [{ label: 'Service Status', value: 'Online', status: 'success' }, { label: 'Pending Tickets', value: '3 Priority', status: 'cyan' }] },
        ].map((card) => (
          <div 
            key={card.id}
            onClick={() => onNavigate(card.id as View)}
            className="group bg-slate-900/40 p-6 rounded-2xl border border-slate-800 hover:border-primary/40 transition-all cursor-pointer"
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
              <MoreVertical className="text-slate-700 cursor-pointer" size={20} />
            </div>
            <h3 className="text-lg font-bold mb-1">{card.title}</h3>
            <p className="text-sm text-slate-400 mb-6">{card.desc}</p>
            <div className="space-y-3">
              {card.stats.map((stat, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className={`font-semibold ${stat.status === 'success' ? 'text-green-500' : stat.status === 'info' ? 'text-blue-400' : stat.status === 'purple' ? 'text-purple-400' : stat.status === 'cyan' ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-800/50">
                {card.id === 'oracle' && (
                  <div className="h-16 w-full flex items-end gap-1">
                    {[0.5, 0.6, 0.75, 0.5, 0.8, 0.75, 1].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                )}
                {card.id === 'spanner-detail' && (
                  <div className="h-16 w-full flex items-center justify-center relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
                    <Globe className="text-blue-400 animate-pulse" size={24} />
                  </div>
                )}
                {card.id === 'bigquery-detail' && (
                  <div className="grid grid-cols-4 gap-2">
                    {[true, true, 'pulse', false].map((state, i) => (
                      <div key={i} className={`h-10 rounded-lg flex items-center justify-center ${state === false ? 'bg-slate-800' : 'bg-purple-500/10'}`}>
                        {state !== false && <div className={`size-2 rounded-full bg-purple-500 ${state === 'pulse' ? 'animate-pulse' : ''}`} />}
                      </div>
                    ))}
                  </div>
                )}
                {card.id === 'alloy' && (
                  <div className="flex gap-2">
                    {[1, 2].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <Users size={14} className="text-slate-500" />
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

const QueryAnalysisView = ({ onShowSource }: { onShowSource: () => void }) => {
  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8">
      <div className="glass rounded-full px-8 py-6 mb-12 shadow-2xl flex items-start gap-4 border-l-4 border-l-primary">
        <Terminal className="text-primary mt-1" size={24} />
        <div className="flex-1">
          <p className="text-lg text-slate-100 font-medium leading-relaxed">
            Find VIP customers in BigQuery, trace their recent purchase path globally through our Spanner supply chain graph, and verify with Oracle financial anomaly detection.
          </p>
          <div className="flex gap-4 mt-3">
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">Complex Chain</span>
            <span className="text-xs bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/10">3 Data Sources</span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-0">
        {[
          { agent: 'BigQuery Analytics Agent', role: 'Segment Extraction', desc: 'Identified top 1% VIP customers based on lifetime value (> $50k).', color: 'blue', icon: Database, content: (
            <div className="bg-white/5 border border-white/10 rounded p-4 overflow-hidden">
              <div className="grid grid-cols-4 gap-4 text-xs font-mono text-slate-300">
                {['#4920-X', '#8122-Y', '#3044-A', '#1190-Z'].map(id => (
                  <div key={id} className="bg-blue-500/5 p-2 rounded border border-blue-500/10">ID: {id}</div>
                ))}
              </div>
            </div>
          )},
          { agent: 'Spanner Retail Agent', role: 'Supply Chain Mapping', desc: 'Tracing multi-hop supply routes across North America and APAC regions.', color: 'green', icon: Globe, content: (
            <div className="h-32 bg-white/5 border border-white/10 rounded relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <svg className="w-full h-full px-10" viewBox="0 0 400 100">
                <path d="M0,50 Q100,20 200,50 T400,50" fill="none" stroke="#10b981" strokeDasharray="4 2" strokeWidth="2" />
                <circle cx="50" cy="35" fill="#10b981" r="4" />
                <circle cx="200" cy="50" fill="#10b981" r="4" />
                <circle cx="350" cy="45" fill="#10b981" r="4" />
              </svg>
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Global Route Map v2.4</span>
            </div>
          )},
          { agent: 'Oracle Financial Agent', role: 'Anomaly Verification', desc: 'Cross-referencing payment velocity against historical procurement benchmarks.', color: 'orange', icon: ShieldCheck, content: (
            <div className="flex gap-4">
              <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
                <CheckCircle2 className="text-orange-500" size={32} />
                <div>
                  <p className="text-xs text-orange-500/80 uppercase font-bold">Risk Score</p>
                  <p className="text-xl text-white font-mono">0.02 (Low)</p>
                </div>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <Activity className="text-slate-500" size={32} />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Verified Volume</p>
                  <p className="text-xl text-white font-mono">$1.24M</p>
                </div>
              </div>
            </div>
          )},
        ].map((step, i) => (
          <div key={i} className="relative grid grid-cols-[64px_1fr] gap-8 pb-12">
            <div className="flex flex-col items-center">
              <div className={`size-12 rounded-full border flex items-center justify-center z-10 shadow-lg ${
                step.color === 'blue' ? 'bg-blue-500/20 border-blue-500/40 text-blue-500' :
                step.color === 'green' ? 'bg-green-500/20 border-green-500/40 text-green-500' :
                'bg-orange-500/20 border-orange-500/40 text-orange-500'
              }`}>
                <step.icon size={24} />
              </div>
              {i < 2 && <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-800 to-transparent my-2" />}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-lg flex items-center gap-2 ${
                    step.color === 'blue' ? 'text-blue-500' :
                    step.color === 'green' ? 'text-green-500' :
                    'text-orange-500'
                  }`}>
                    {step.agent}
                    <span className="text-xs font-normal text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">{step.role}</span>
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{step.desc}</p>
                </div>
                <button 
                  onClick={onShowSource}
                  className={`text-xs hover:underline flex items-center gap-1 ${
                    step.color === 'blue' ? 'text-blue-500' :
                    step.color === 'green' ? 'text-green-500' :
                    'text-orange-500'
                  }`}
                >
                  <RefreshCw size={12} /> Source MCP Output
                </button>
              </div>
              {step.content}
            </div>
          </div>
        ))}

        {/* Synthesis Hub */}
        <div className="relative grid grid-cols-[64px_1fr] gap-8">
          <div className="flex flex-col items-center">
            <div className="size-12 rounded-full bg-primary/40 border border-primary flex items-center justify-center text-white z-10 shadow-[0_0_30px_rgba(17,17,212,0.4)]">
              <Sparkles size={24} />
            </div>
          </div>
          <div className="glass-card rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-10 rounded-full"></div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">Synthesis Hub</h2>
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20">Final Summary</span>
            </div>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <p>
                Analysis of the <strong className="text-white">VIP segment</strong> reveals a distinct procurement pattern originating from the APAC logistics hub. 84% of your high-value customers in this query share a purchase path through the <strong className="text-white">Singapore terminal</strong>, which has seen a 12% efficiency gain this quarter.
              </p>
              <p>
                The financial verification via Oracle confirms that these transactions are <strong className="text-green-500 font-medium">99.8% compliant</strong> with regional tax frameworks. No significant anomalies were detected in the purchase path tracing from Spanner, suggesting a healthy and scalable supply chain flow for this VIP cohort.
              </p>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full border-2 border-background-dark bg-blue-500/40 flex items-center justify-center text-[10px]">BQ</div>
                  <div className="size-8 rounded-full border-2 border-background-dark bg-green-500/40 flex items-center justify-center text-[10px]">SP</div>
                  <div className="size-8 rounded-full border-2 border-background-dark bg-orange-500/40 flex items-center justify-center text-[10px]">OR</div>
                </div>
                <div className="flex gap-3">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm font-medium transition-all">Export Report</button>
                  <button className="bg-primary hover:bg-primary/80 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all">Take Action</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketplaceView = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    type: 'All Types',
    quality: 'All Quality',
    access: 'All Access'
  });

  const dataProducts = [
    { id: 1, name: 'Global Inventory Master', domain: 'Spanner Retail', owner: 'Supply Chain Ops', quality: 98, access: 'Approved', type: 'Graph' },
    { id: 2, name: 'Financial Ledger Sync', domain: 'Oracle ERP', owner: 'Finance Dept', quality: 99, access: 'Request', type: 'Relational' },
    { id: 3, name: 'Customer 360 Profile', domain: 'AlloyDB CRM', owner: 'Marketing', quality: 94, access: 'Approved', type: 'Document' },
    { id: 4, name: 'Predictive Churn Model', domain: 'BigQuery', owner: 'Data Science', quality: 91, access: 'Restricted', type: 'ML Model' },
  ];

  const filteredProducts = React.useMemo(() => {
    return dataProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.owner.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filters.type === 'All Types' || product.type === filters.type;
      const matchesAccess = filters.access === 'All Access' || product.access === filters.access;
      const matchesQuality = filters.quality === 'All Quality' || (
        filters.quality === 'High (>95%)' ? product.quality > 95 :
        filters.quality === 'Medium (90-95%)' ? (product.quality >= 90 && product.quality <= 95) :
        product.quality < 90
      );

      return matchesSearch && matchesType && matchesAccess && matchesQuality;
    });
  }, [searchQuery, filters]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Data Marketplace</h2>
          <p className="text-slate-400">Discover and subscribe to verified enterprise data products.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products, domains, owners..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-all w-72"
            />
          </div>
          <div className="flex gap-3">
            <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all">My Subscriptions</button>
            <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Publish Product</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filters</span>
        </div>
        <div className="h-6 w-[1px] bg-slate-800 mx-2 hidden md:block" />
        
        <select 
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option>All Types</option>
          <option>Graph</option>
          <option>Relational</option>
          <option>Document</option>
          <option>ML Model</option>
        </select>

        <select 
          value={filters.quality}
          onChange={(e) => setFilters(prev => ({ ...prev, quality: e.target.value }))}
          className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option>All Quality</option>
          <option>High ({'>'}95%)</option>
          <option>Medium (90-95%)</option>
          <option>Low ({'<'}90%)</option>
        </select>

        <select 
          value={filters.access}
          onChange={(e) => setFilters(prev => ({ ...prev, access: e.target.value }))}
          className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option>All Access</option>
          <option>Approved</option>
          <option>Request</option>
          <option>Restricted</option>
        </select>

        {(filters.type !== 'All Types' || filters.quality !== 'All Quality' || filters.access !== 'All Access') && (
          <button 
            onClick={() => setFilters({ type: 'All Types', quality: 'All Quality', access: 'All Access' })}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                {product.type === 'Graph' ? <GitBranch size={24} /> : <Database size={24} />}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                product.access === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                product.access === 'Request' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {product.access}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{product.domain}</p>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Owner</span>
                <span className="text-slate-300">{product.owner}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Data Quality</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${product.quality}%` }} />
                  </div>
                  <span className="text-primary font-bold">{product.quality}%</span>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary/20 rounded-xl text-xs font-bold transition-all border border-white/5">
              View Details
            </button>
          </div>
        ))}
      </div>

      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-bold">Recent Data Transactions</h3>
          <button className="text-xs text-primary hover:underline">View All Logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Consumer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Volume</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[
                { product: 'Global Inventory Master', consumer: 'Marketing Agent', time: '2 mins ago', vol: '1.2 GB', status: 'Success' },
                { product: 'Financial Ledger Sync', consumer: 'Audit Bot', time: '14 mins ago', vol: '450 MB', status: 'Success' },
                { product: 'Customer 360 Profile', consumer: 'Salesforce Connector', time: '1 hour ago', vol: '2.4 GB', status: 'Success' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors text-sm">
                  <td className="px-6 py-4 font-medium text-slate-200">{row.product}</td>
                  <td className="px-6 py-4 text-slate-400">{row.consumer}</td>
                  <td className="px-6 py-4 text-slate-500">{row.time}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{row.vol}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-500 font-bold text-xs uppercase tracking-widest">● {row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const GovernanceView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [policies, setPolicies] = React.useState<Policy[]>([
    { id: '1', name: 'GDPR Compliance', status: 'Active', domain: 'Customer Data', lastUpdated: '2024-03-10' },
    { id: '2', name: 'PII Masking', status: 'Active', domain: 'Marketing', lastUpdated: '2024-03-12' },
    { id: '3', name: 'Cross-Border Sync', status: 'Restricted', domain: 'Logistics', lastUpdated: '2024-03-14' },
    { id: '4', name: 'Financial Audit Trail', status: 'Draft', domain: 'Finance', lastUpdated: '2024-03-15' },
  ]);

  const [filter, setFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [domainFilter, setDomainFilter] = React.useState('All');
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Policy, direction: 'asc' | 'desc' } | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<Policy | null>(null);

  const [newPolicy, setNewPolicy] = React.useState<Partial<Policy>>({
    name: '',
    status: 'Draft',
    domain: '',
  });

  const handleSort = (key: keyof Policy) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueStatuses = React.useMemo(() => ['All', ...Array.from(new Set(policies.map(p => p.status)))], [policies]);
  const uniqueDomains = React.useMemo(() => ['All', ...Array.from(new Set(policies.map(p => p.domain)))], [policies]);

  const sortedPolicies = React.useMemo(() => {
    let sortableItems = [...policies];
    if (filter) {
      sortableItems = sortableItems.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) || 
        p.domain.toLowerCase().includes(filter.toLowerCase())
      );
    }
    if (statusFilter !== 'All') {
      sortableItems = sortableItems.filter(p => p.status === statusFilter);
    }
    if (domainFilter !== 'All') {
      sortableItems = sortableItems.filter(p => p.domain === domainFilter);
    }
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [policies, sortConfig, filter]);

  const handleDelete = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
  };

  const handleSavePolicy = () => {
    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === editingPolicy.id ? { ...editingPolicy, ...newPolicy as Policy, lastUpdated: new Date().toISOString().split('T')[0] } : p));
    } else {
      const policy: Policy = {
        id: Math.random().toString(36).substr(2, 9),
        name: newPolicy.name || 'Untitled Policy',
        status: newPolicy.status as any || 'Draft',
        domain: newPolicy.domain || 'General',
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setPolicies([...policies, policy]);
    }
    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
    setNewPolicy({ name: '', status: 'Draft', domain: '' });
  };

  const openEditModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setNewPolicy(policy);
    setIsPolicyModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Federated Governance</h2>
          <p className="text-slate-400">Manage cross-domain data policies and compliance rules.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('governance-detail')}
            className="glass hover:bg-white/5 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Activity size={18} /> Compliance Details
          </button>
          <button 
            onClick={() => setIsPolicyModalOpen(true)}
            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Create Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Knowledge Graph Visualization */}
          <section className="glass rounded-2xl border-slate-800 overflow-hidden h-[400px] relative">
            <div className="absolute top-6 left-6 z-10">
              <h2 className="text-xl font-bold text-white mb-1">Knowledge Graph</h2>
              <p className="text-slate-400 text-xs">Entity resolution & lineage</p>
            </div>
            {/* Stylized SVG Graph */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full opacity-60" viewBox="0 0 800 500">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <g filter="url(#glow)">
                  <circle cx="200" cy="250" r="40" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx="600" cy="250" r="40" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
                  <circle cx="400" cy="150" r="30" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
                  <circle cx="400" cy="350" r="30" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
                  <line x1="200" y1="250" x2="400" y2="150" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
                  <line x1="600" y1="250" x2="400" y2="150" stroke="#f97316" strokeWidth="1" strokeDasharray="4 2" />
                </g>
              </svg>
            </div>
          </section>

          {/* Policies Table */}
          <section className="glass rounded-2xl border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white">Policy Management</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter policies..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-all w-48"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Status:</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Domain:</span>
                  <select 
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  >
                    {uniqueDomains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <button className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-all">
                  <Filter size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">Policy Name <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('domain')}>
                      <div className="flex items-center gap-2">Domain <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-2">Status <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('lastUpdated')}>
                      <div className="flex items-center gap-2">Last Updated <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedPolicies.map(policy => (
                    <tr key={policy.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-200">{policy.name}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{policy.domain}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          policy.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          policy.status === 'Restricted' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{policy.lastUpdated}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(policy)} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(policy.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Domain Trust Scores</h3>
            <div className="space-y-6">
              {[
                { domain: 'Oracle ERP', score: 98, color: 'orange' },
                { domain: 'Spanner Retail', score: 94, color: 'blue' },
                { domain: 'BigQuery Analytics', score: 91, color: 'purple' },
              ].map((domain, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{domain.domain}</span>
                    <span className={`text-${domain.color}-500 font-bold`}>{domain.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-${domain.color}-500`} style={{ width: `${domain.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Agent Performance</h3>
            <div className="space-y-6">
              {[
                { agent: 'Governance Bot', errorRate: 0.2, avgTime: '45ms', color: 'blue' },
                { agent: 'Lineage Agent', errorRate: 1.5, avgTime: '120ms', color: 'purple' },
                { agent: 'Security Bot', errorRate: 0.5, avgTime: '32ms', color: 'emerald' },
              ].map((perf, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">{perf.agent}</span>
                    <span className="text-[10px] font-mono text-slate-500">Avg: {perf.avgTime}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${perf.color}-500`} 
                        style={{ width: `${100 - perf.errorRate * 10}%` }} 
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${perf.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                      {perf.errorRate}% Err
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Agent Activity</h3>
            <div className="space-y-4">
              {[
                { agent: 'Governance Bot', action: 'Policy Audit', time: '5m ago' },
                { agent: 'Lineage Agent', action: 'Graph Update', time: '12m ago' },
                { agent: 'Security Bot', action: 'Access Review', time: '1h ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-200">{log.agent}: {log.action}</p>
                    <p className="text-[10px] text-slate-500">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      <AnimatePresence>
        {isPolicyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</h3>
                <button onClick={() => { setIsPolicyModalOpen(false); setEditingPolicy(null); }} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Policy Name</label>
                  <input 
                    type="text" 
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                    placeholder="e.g. Data Retention Rule"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Domain</label>
                  <input 
                    type="text" 
                    value={newPolicy.domain}
                    onChange={(e) => setNewPolicy({ ...newPolicy, domain: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                    placeholder="e.g. Finance"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={newPolicy.status}
                    onChange={(e) => setNewPolicy({ ...newPolicy, status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => { setIsPolicyModalOpen(false); setEditingPolicy(null); }}
                  className="flex-1 py-3 glass rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePolicy}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all"
                >
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GovernanceDetailView = () => {
  const [alerts, setAlerts] = React.useState([
    { id: 1, type: 'critical', message: 'Unauthorized access attempt on Financial Ledger Sync', time: '2m ago', domain: 'Oracle ERP' },
    { id: 2, type: 'warning', message: 'Unusual data export volume detected in EMEA region', time: '15m ago', domain: 'Spanner Retail' },
    { id: 3, type: 'info', message: 'New compliance policy "GDPR-2024" successfully propagated', time: '1h ago', domain: 'Global' },
  ]);

  // Simulate real-time alerts
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlert = {
          id: Date.now(),
          type: Math.random() > 0.5 ? 'critical' : 'warning',
          message: Math.random() > 0.5 ? 'Financial data breach detected: PII exposure' : 'Compliance drift: Audit trail mismatch',
          time: 'Just now',
          domain: 'Finance'
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Governance Detail: Financial Compliance</h2>
          <p className="text-slate-400">Real-time monitoring and automated breach detection for financial domains.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-red-400 border-red-500/30">
            <ShieldCheck size={16} /> Lockdown Domain
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass rounded-3xl border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-red-500/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                Real-time Compliance Alerts
              </h3>
              <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded-full animate-pulse">
                Live Monitoring
              </span>
            </div>
            <div className="divide-y divide-slate-800">
              <AnimatePresence initial={false}>
                {alerts.map((alert) => (
                  <motion.div 
                    key={alert.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-6 flex gap-4 items-start hover:bg-white/5 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'critical' ? 'bg-red-500/20 text-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {alert.type === 'critical' ? <ShieldCheck size={20} /> : <Info size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-white">{alert.message}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{alert.domain}</span>
                        <div className="size-1 rounded-full bg-slate-700" />
                        <button className="text-[10px] text-primary hover:underline font-bold">Investigate</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <section className="glass rounded-3xl border-slate-800 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Compliance Drift Analysis</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { time: '00:00', drift: 2 },
                  { time: '04:00', drift: 5 },
                  { time: '08:00', drift: 12 },
                  { time: '12:00', drift: 8 },
                  { time: '16:00', drift: 15 },
                  { time: '20:00', drift: 4 },
                  { time: '23:59', drift: 3 },
                ]}>
                  <defs>
                    <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="drift" stroke="#ef4444" fillOpacity={1} fill="url(#colorDrift)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Financial Data Health</h3>
            <div className="space-y-6">
              {[
                { label: 'Integrity', value: 99.9, color: 'green' },
                { label: 'Freshness', value: 94.2, color: 'blue' },
                { label: 'Compliance', value: 88.5, color: 'red' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{stat.label}</span>
                    <span className={`text-${stat.color}-500 font-bold`}>{stat.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-${stat.color}-500`} style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Breach Protocols</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all border border-red-500/20 text-left px-4 flex items-center justify-between">
                Rotate API Keys <ChevronRight size={14} />
              </button>
              <button className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl text-xs font-bold transition-all border border-yellow-500/20 text-left px-4 flex items-center justify-between">
                Revoke PII Access <ChevronRight size={14} />
              </button>
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 text-left px-4 flex items-center justify-between">
                Audit Logs Export <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpannerDetailView = () => {
  const [inventory, setInventory] = React.useState([
    { id: 1, loc: 'Berlin-Central-01', region: 'EMEA', stock: 84203, trend: '+1.2k', cap: 75, status: 'Synchronized' },
    { id: 2, loc: 'SF-Bay-Logistics', region: 'US-West', stock: 122900, trend: null, cap: 92, status: 'Synchronized' },
    { id: 3, loc: 'Singapore-Hub-C', region: 'APAC', stock: 45112, trend: null, cap: 40, status: 'Updating' },
    { id: 4, loc: 'Tokyo-East-Data', region: 'APAC', stock: 1200, trend: '-200', cap: 15, status: 'Synchronized' },
  ]);

  const [alerts, setAlerts] = React.useState<{id: string, message: string, type: 'warning' | 'error'}[]>([]);
  const STOCK_THRESHOLD = 5000;

  // Historical data for the last 7 days
  const performanceData = [
    { day: 'Mon', latency: 14, uptime: 99.98 },
    { day: 'Tue', latency: 12, uptime: 99.99 },
    { day: 'Wed', latency: 18, uptime: 99.95 },
    { day: 'Thu', latency: 11, uptime: 99.99 },
    { day: 'Fri', latency: 13, uptime: 99.97 },
    { day: 'Sat', latency: 10, uptime: 100.00 },
    { day: 'Sun', latency: 12, uptime: 99.99 },
  ];

  const stockHistoryData = [
    { day: 'Mon', Berlin: 82000, SF: 120000, Singapore: 42000, Tokyo: 1500 },
    { day: 'Tue', Berlin: 83500, SF: 121500, Singapore: 43500, Tokyo: 1400 },
    { day: 'Wed', Berlin: 81000, SF: 123000, Singapore: 41000, Tokyo: 1300 },
    { day: 'Thu', Berlin: 84000, SF: 122000, Singapore: 45000, Tokyo: 1250 },
    { day: 'Fri', Berlin: 85000, SF: 124000, Singapore: 44000, Tokyo: 1200 },
    { day: 'Sat', Berlin: 84203, SF: 122900, Singapore: 45112, Tokyo: 1200 },
    { day: 'Sun', Berlin: 84500, SF: 123500, Singapore: 46000, Tokyo: 1150 },
  ];

  // Simulation of real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setInventory(prev => prev.map(item => {
        // Randomly fluctuate stock
        const change = Math.floor(Math.random() * 1000) - 500;
        const newStock = Math.max(0, item.stock + change);
        
        // Randomly change status
        let newStatus = item.status;
        if (Math.random() > 0.95) {
          newStatus = Math.random() > 0.5 ? 'Updating' : 'Synchronized';
        }
        if (Math.random() > 0.98) {
          newStatus = 'Error';
        }

        return { ...item, stock: newStock, status: newStatus };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Alert monitoring logic
  React.useEffect(() => {
    const newAlerts: {id: string, message: string, type: 'warning' | 'error'}[] = [];
    
    inventory.forEach(item => {
      if (item.stock < STOCK_THRESHOLD) {
        newAlerts.push({
          id: `stock-${item.id}`,
          message: `Low stock alert: ${item.loc} (${item.stock} units)`,
          type: 'warning'
        });
      }
      if (item.status === 'Error') {
        newAlerts.push({
          id: `sync-${item.id}`,
          message: `Sync failure detected: ${item.loc}`,
          type: 'error'
        });
      }
    });

    setAlerts(newAlerts);
  }, [inventory]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Alerts Section */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  alert.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}
              >
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">{alert.message}</span>
                <button 
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="ml-auto hover:opacity-70"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative w-full h-[400px] glass rounded-2xl overflow-hidden border-slate-800">
        <div className="absolute inset-0 bg-[#0c0c1e]">
          <svg className="w-full h-full opacity-40" viewBox="0 0 1000 500">
            <path d="M150,100 Q200,80 250,120 T350,150 T450,100" fill="none" stroke="#1e293b" strokeWidth="2" />
            <path d="M600,200 Q700,180 800,250 T900,200" fill="none" stroke="#1e293b" strokeWidth="2" />
            <path className="map-glow" d="M220,150 Q400,50 780,220" fill="none" stroke="#22c55e" strokeDasharray="8 4" strokeWidth="1.5" />
            <path className="map-glow" d="M220,150 Q300,300 500,400" fill="none" stroke="#22c55e" strokeDasharray="4 4" strokeWidth="1.5" />
            <path className="map-glow" d="M780,220 Q850,350 500,400" fill="none" stroke="#22c55e" strokeDasharray="6 2" strokeWidth="1.5" />
            <circle className="map-glow" cx="220" cy="150" fill="#22c55e" r="4" />
            <circle className="map-glow" cx="780" cy="220" fill="#22c55e" r="4" />
            <circle className="map-glow" cx="500" cy="400" fill="#22c55e" r="4" />
          </svg>
        </div>
        <div className="absolute top-6 left-6 z-10">
          <h2 className="text-2xl font-bold text-white mb-1">Global Inventory Flow</h2>
          <p className="text-slate-400 text-sm">Real-time cross-region synchronization active</p>
        </div>
        <div className="absolute bottom-6 right-6 flex gap-4">
          <div className="glass p-3 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Nodes</p>
            <p className="text-xl font-mono text-green-500">142</p>
          </div>
          <div className="glass p-3 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sync Velocity</p>
            <p className="text-xl font-mono text-green-500">4.2GB/s</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass rounded-2xl p-6 border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-100">Performance</h3>
            <TrendingUp className="text-slate-500" size={20} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Avg Latency</p>
                  <p className="text-3xl font-bold text-green-500">12ms</p>
                </div>
                <span className="text-xs text-green-400 font-mono mb-1">↓ 2.4%</span>
              </div>
              <div className="h-16 w-full flex items-end gap-1 overflow-hidden">
                {[0.8, 0.5, 0.7, 0.9, 0.6, 0.75, 0.85, 0.65].map((h, i) => (
                  <div key={i} className="flex-1 bg-green-500/20 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Uptime (24h)</span>
                <span className="text-sm font-bold text-white">99.99%</span>
              </div>
              <div className="mt-3 flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 bg-green-500 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">7-Day Performance History</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 text-green-500">
                <div className="size-2 rounded-full bg-green-500" /> Latency (ms)
              </div>
              <div className="flex items-center gap-1.5 text-blue-500">
                <div className="size-2 rounded-full bg-blue-500" /> Uptime (%)
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUptime)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Stock Trends */}
      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">7-Day Stock Level Trends</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
            <div className="flex items-center gap-1.5 text-blue-500">
              <div className="size-2 rounded-full bg-blue-500" /> Berlin
            </div>
            <div className="flex items-center gap-1.5 text-purple-500">
              <div className="size-2 rounded-full bg-purple-500" /> SF
            </div>
            <div className="flex items-center gap-1.5 text-green-500">
              <div className="size-2 rounded-full bg-green-500" /> Singapore
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500">
              <div className="size-2 rounded-full bg-yellow-500" /> Tokyo
            </div>
          </div>
        </div>
        <div className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="Berlin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="SF" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Singapore" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Tokyo" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="glass rounded-2xl border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <Terminal className="text-primary" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Spanner GQL Console</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded transition-colors">Clear</button>
              <button className="px-3 py-1 bg-primary text-white text-xs rounded font-bold hover:bg-primary/80 transition-all">Execute Query</button>
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-auto min-h-[150px]">
            <p className="text-purple-400">SELECT</p>
            <p className="pl-4 text-blue-300">warehouse_id, stock_count, last_updated</p>
            <p className="text-purple-400">FROM</p>
            <p className="pl-4 text-white">Inventory_Distribution</p>
            <p className="text-purple-400">WHERE</p>
            <p className="pl-4 text-white">sku_id = <span className="text-orange-400">'GLOBAL-77X'</span></p>
            <p className="text-purple-400">AND</p>
            <p className="pl-4 text-white">region = <span className="text-orange-400">'EMEA'</span></p>
            <p className="text-slate-600 mt-4 italic">-- Results limited to top 50 rows</p>
            <p className="animate-pulse border-l-2 border-primary pl-1">&nbsp;</p>
          </div>
        </div>
      </div>

      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold">Inventory Distribution</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input className="bg-slate-900 border-slate-700 rounded-lg text-xs pl-9 pr-4 py-2 focus:ring-primary focus:border-primary" placeholder="Filter warehouses..." type="text" />
            </div>
            <button className="flex items-center gap-2 text-xs bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
              <RefreshCw size={14} /> Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Warehouse Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Region</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Capacity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sync Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {inventory.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{row.loc}</td>
                  <td className="px-6 py-4 text-slate-400">{row.region}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${row.stock < STOCK_THRESHOLD ? 'text-yellow-500 font-bold' : 'text-slate-200'}`}>
                        {row.stock.toLocaleString()}
                      </span>
                      {row.trend && <span className="text-[10px] text-green-500">{row.trend}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${row.stock < STOCK_THRESHOLD ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (row.stock / 150000) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-xs ${
                      row.status === 'Updating' ? 'text-primary animate-pulse font-medium' : 
                      row.status === 'Error' ? 'text-red-500 font-bold' :
                      'text-green-400'
                    }`}>
                      {row.status === 'Updating' ? <RefreshCw size={12} /> : 
                       row.status === 'Error' ? <AlertTriangle size={12} /> :
                       <div className="size-1.5 rounded-full bg-green-400" />}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MoreVertical className="text-slate-500 hover:text-white inline cursor-pointer" size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const BigQueryDetailView = () => {
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bigquery/analytics');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAnalyticsData(data.data);
    } catch (err) {
      console.error('Failed to fetch BigQuery analytics:', err);
      setError('The BigQuery Analytics Agent is currently unreachable. Please check your network connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className="text-slate-400 font-medium animate-pulse">Fetching Real-time Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="max-w-md w-full glass p-8 rounded-3xl border-red-500/30 text-center space-y-6">
          <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Analytics Unavailable</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl text-sm font-bold transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-8 max-w-[1600px] mx-auto w-full space-y-6 relative z-10">
      <section className="w-full">
        <div className="glass dark:bg-slate-900/40 border border-slate-200 dark:border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]"></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 border border-purple-500/30">
                  <TrendingUp size={24} />
                </div>
                Marketing Insights: User Segment Growth
              </h2>
              <p className="text-slate-400 mt-2 text-sm">Monthly acquisition and retention performance across key demographics.</p>
            </div>
            <div className="flex gap-4">
              <div className="glass px-4 py-2 rounded-xl flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Conversions</span>
                <span className="text-xl font-mono text-white">{analyticsData?.metrics?.totalConversions?.toLocaleString()}</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Avg ROI</span>
                <span className="text-xl font-mono text-primary">{analyticsData?.metrics?.avgRoi}%</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData?.campaigns}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="id" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickFormatter={(value: string) => value.split('_')[2]}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}
                />
                <Bar dataKey="conversions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Conversions" />
                <Bar dataKey="roi" fill="#a855f7" radius={[4, 4, 0, 0]} name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-10 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-blue-500"></div>
              <span className="text-slate-300">Conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-purple-500"></div>
              <span className="text-slate-300">ROI %</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass dark:bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                <RefreshCw size={20} />
              </div>
              Customer Segment Performance
            </h3>
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase tracking-widest border border-green-500/20">
              Live
            </span>
          </div>
          
          <div className="space-y-4">
            {analyticsData?.segments?.map((segment: any, i: number) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{segment.name}</p>
                  <p className="text-xs text-slate-500">Growth Potential: <span className="text-primary">{segment.value}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono text-green-500">+{segment.growth}%</p>
                  <div className="w-24 h-1 bg-slate-800 rounded-full mt-1">
                    <div className="h-full bg-green-500" style={{ width: `${segment.growth * 5}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass dark:bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 border border-cyan-500/30">
              <GitBranch size={20} />
            </div>
            Data Lineage
          </h3>
          <div className="flex items-center justify-between h-48 relative z-10 px-4">
            {[
              { label: 'Raw App Events', icon: Download, color: 'slate' },
              { label: 'Dataflow Pipeline', icon: RefreshCw, color: 'blue' },
              { label: 'Analytics Table', icon: Table, color: 'purple' },
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2 w-20 group">
                  <div className={`size-12 rounded-xl flex items-center justify-center group-hover:border-${node.color}-400 transition-colors shadow-lg ${
                    node.color === 'slate' ? 'bg-slate-800 border-slate-600' :
                    node.color === 'blue' ? 'bg-blue-500/20 border-blue-500/40' :
                    'bg-purple-500/20 border-purple-500/50'
                  }`}>
                    <node.icon className={`text-${node.color}-400`} size={20} />
                  </div>
                  <span className="text-[10px] text-center text-slate-400 leading-tight">{node.label}</span>
                </div>
                {i < 2 && (
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-[2px] w-full bg-slate-700 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-cyan-400" style={{ width: '100%', animation: 'slide 2s linear infinite' }} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const SourceModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900/90 backdrop-blur-xl w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Terminal className="text-purple-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Source Output: BigQuery Analytics Agent</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-[#161b22] flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Table size={14} />
                <span>raw_output.json</span>
              </div>
              <span>JSON</span>
            </div>
            <div className="flex-1 overflow-auto p-4 text-sm font-mono leading-relaxed bg-[#0d1117] text-[#c9d1d9]">
              <pre>
                <code>{`{
  "status": "success",
  "query_id": "bq-job-9842a1f-4c",
  "domain": "marketing_insights",
  "results": [
    {
      "campaign_id": "CMP_2023_Q4_RTL",
      "conversions": 14529,
      "roi_percentage": 312.4,
      "active": true,
      "segments_analyzed": ["demographic", "geographic", "behavioral"]
    },
    {
      "campaign_id": "CMP_2023_Q4_B2B",
      "conversions": 3841,
      "roi_percentage": 185.7,
      "active": false,
      "segments_analyzed": ["firmographic", "technographic"]
    }
  ],
  "agent_reasoning": {
    "confidence_score": 0.98,
    "context_sources": ["bq_marketing_ds", "crm_alloy_sync"]
  }
}`}</code>
              </pre>
            </div>
          </div>
          <div className="w-64 border-l border-white/10 bg-slate-900/60 p-5 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Metadata</h3>
              <div className="space-y-4">
                {[
                  { label: 'Execution Time', icon: RefreshCw, value: '142ms', color: 'green' },
                  { label: 'Tokens Used', icon: Database, value: '4,092', color: 'blue' },
                  { label: 'Data Freshness', icon: RefreshCw, value: 'Just now', color: 'purple' },
                ].map((meta, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-slate-500 mb-1">{meta.label}</p>
                    <div className="flex items-center gap-2">
                      <meta.icon className={`text-${meta.color}-400`} size={14} />
                      <span className="text-sm font-mono text-slate-200">{meta.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-end gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10">
            <Download size={16} /> Export JSON
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20">
            <Copy size={16} /> Copy to Clipboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const OracleDetailView = () => {
  const financialData = [
    { month: 'Jan', revenue: 450000, expenses: 320000, compliance: 98 },
    { month: 'Feb', revenue: 520000, expenses: 340000, compliance: 99 },
    { month: 'Mar', revenue: 480000, expenses: 310000, compliance: 97 },
    { month: 'Apr', revenue: 610000, expenses: 380000, compliance: 99 },
    { month: 'May', revenue: 590000, expenses: 360000, compliance: 98 },
    { month: 'Jun', revenue: 650000, expenses: 400000, compliance: 100 },
  ];

  const agentPerformance = [
    { name: 'Agent Alpha', queries: 1240, success: 99.2, latency: 12 },
    { name: 'Agent Beta', queries: 890, success: 98.5, latency: 15 },
    { name: 'Agent Gamma', queries: 2100, success: 99.8, latency: 8 },
    { name: 'Agent Delta', queries: 1560, success: 97.4, latency: 22 },
    { name: 'Agent Epsilon', queries: 1100, success: 99.5, latency: 10 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Oracle ERP</h2>
          <p className="text-slate-400">Global Resource Planning & Financial Governance.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2">
            <Download size={16} /> Export Ledger
          </button>
          <button className="bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20">
            Reconcile Accounts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Financial Performance</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#475569" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Data Agent Performance Metrics</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} name="Queries" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} name="Success %" domain={[90, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar yAxisId="left" dataKey="queries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Queries" />
                  <Bar yAxisId="right" dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {agentPerformance.map((agent, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs text-slate-500 uppercase mb-1">{agent.name}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-mono font-bold text-white">{agent.latency}ms</span>
                    <span className="text-[10px] text-slate-400">Avg Latency</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Procurement Status</h4>
              <div className="space-y-4">
                {[
                  { label: 'Pending Approvals', value: 12, color: 'orange' },
                  { label: 'Active POs', value: 145, color: 'blue' },
                  { label: 'Vendor Disputes', value: 3, color: 'red' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-300">{item.label}</span>
                    <span className={`font-mono font-bold text-${item.color}-500`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance Audit</h4>
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">99.8%</p>
                  <p className="text-xs text-slate-500 mt-1">Global Compliance Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Recent Ledger Entries</h3>
            <div className="space-y-4">
              {[
                { id: 'TX-9021', desc: 'Cloud Infrastructure', amount: '-$12,400', status: 'Cleared' },
                { id: 'TX-9022', desc: 'Vendor Payment: Logistics', amount: '-$45,000', status: 'Pending' },
                { id: 'TX-9023', desc: 'Service Revenue: EMEA', amount: '+$128,000', status: 'Cleared' },
                { id: 'TX-9024', desc: 'Payroll: R&D Dept', amount: '-$210,000', status: 'Cleared' },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{tx.id}</p>
                    <p className="text-[10px] text-slate-500">{tx.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono font-bold ${tx.amount.startsWith('+') ? 'text-green-500' : 'text-white'}`}>{tx.amount}</p>
                    <p className="text-[10px] text-slate-500">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 rounded-xl">
              View Full Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlloyDetailView = () => {
  return (
    <div className="p-8 flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-4">
        <div className="size-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mx-auto">
          <Users size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white">AlloyDB CRM Detail</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Detailed view for AlloyDB CRM is currently under development. 
          Check back soon for real-time customer insights and relationship mapping.
        </p>
      </div>
    </div>
  );
};

const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setSettings(data);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleToggleSource = (id: string) => {
    const newSources = settings.dataSources.map((s: any) => 
      s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'online' : 'offline' } : s
    );
    const newSettings = { ...settings, dataSources: newSources };
    setSettings(newSettings);
    
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
  };

  const handleAgentAction = async (id: string, action: 'restart' | 'logs') => {
    if (action === 'restart') {
      await fetch(`/api/agents/${id}/restart`, { method: 'POST' });
      // Refresh settings
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } else {
      const res = await fetch(`/api/agents/${id}/logs`);
      const data = await res.json();
      alert(data.logs.join('\n'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">System Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Data Sources</h3>
                <div className="grid grid-cols-1 gap-4">
                  {settings.dataSources.map((source: any) => (
                    <div key={source.id} className={`flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 transition-opacity ${!source.enabled ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${
                          source.id === 'oracle' ? 'bg-orange-500/10 text-orange-500' :
                          source.id === 'spanner' ? 'bg-blue-500/10 text-blue-500' :
                          source.id === 'bigquery' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-cyan-500/10 text-cyan-500'
                        }`}>
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{source.name}</p>
                          <p className={`text-[10px] font-bold uppercase ${source.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                            {source.enabled ? source.status : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleSource(source.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          source.enabled 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {source.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Active Agents</h3>
                <div className="grid grid-cols-1 gap-4">
                  {settings.agents.map((agent: any) => (
                    <div key={agent.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Bot size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{agent.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{agent.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAgentAction(agent.id, 'logs')}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                          title="View Logs"
                        >
                          <Terminal size={16} />
                        </button>
                        <button 
                          onClick={() => handleAgentAction(agent.id, 'restart')}
                          className="p-2 bg-slate-700 hover:bg-primary/20 hover:text-primary rounded-lg text-slate-300 transition-colors"
                          title="Restart Agent"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Close
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DataDomainsView = () => {
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddSource = async () => {
    const name = prompt('Enter Data Source Name:');
    if (!name) return;
    await fetch('/api/settings/add-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: name.toLowerCase().replace(/\s/g, '-'), name })
    });
    fetchSettings();
  };

  const handleAddAgent = async () => {
    const name = prompt('Enter Agent Name:');
    if (!name) return;
    await fetch('/api/settings/add-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: name.toLowerCase().replace(/\s/g, '-'), name })
    });
    fetchSettings();
  };

  if (loading) return <div className="p-8 text-slate-400">Loading domains...</div>;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Data Domains & Agents</h2>
          <p className="text-slate-400">Manage your enterprise data domains and the agents orchestrating them.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAddSource}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Connect Source
          </button>
          <button 
            onClick={handleAddAgent}
            className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Domain Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass rounded-3xl border-slate-800 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Database className="text-primary" /> Connected Sources
          </h3>
          <div className="space-y-4">
            {settings.dataSources.map((source: any) => (
              <div key={source.id} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{source.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{source.id}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${source.enabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {source.enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-3xl border-slate-800 p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Bot className="text-primary" /> Domain Agents
          </h3>
          <div className="space-y-4">
            {settings.agents.map((agent: any) => (
              <div key={agent.id} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{agent.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{agent.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const CrossDomainInventoryView = () => {
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
};

export default function App() {
  const [activeView, setActiveView] = React.useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const getBreadcrumbs = () => {
    switch (activeView) {
      case 'dashboard': return ['Dashboard'];
      case 'query-analysis': return ['Dashboard', 'Query Analysis'];
      case 'spanner-detail': return ['Dashboard', 'Spanner Retail'];
      case 'bigquery-detail': return ['Dashboard', 'BigQuery Analytics'];
      case 'oracle-detail': return ['Dashboard', 'Oracle ERP'];
      case 'alloy-detail': return ['Dashboard', 'AlloyDB CRM'];
      case 'cross-domain-inventory': return ['Dashboard', 'Cross-Domain Inventory'];
      case 'marketplace': return ['Dashboard', 'Data Marketplace'];
      case 'governance': return ['Dashboard', 'Federated Governance'];
      case 'governance-detail': return ['Dashboard', 'Federated Governance', 'Compliance Detail'];
      case 'data-domains': return ['Dashboard', 'Data Domains'];
      default: return ['Dashboard'];
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header breadcrumbs={getBreadcrumbs()} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {activeView === 'dashboard' && <DashboardView onNavigate={setActiveView} />}
            {activeView === 'query-analysis' && <QueryAnalysisView onShowSource={() => setIsModalOpen(true)} />}
            {activeView === 'spanner-detail' && <SpannerDetailView />}
            {activeView === 'bigquery-detail' && <BigQueryDetailView />}
            {activeView === 'oracle-detail' && <OracleDetailView />}
            {activeView === 'alloy-detail' && <AlloyDetailView />}
            {activeView === 'cross-domain-inventory' && <CrossDomainInventoryView />}
            {activeView === 'marketplace' && <MarketplaceView />}
            {activeView === 'governance' && <GovernanceView onNavigate={setActiveView} />}
            {activeView === 'governance-detail' && <GovernanceDetailView />}
            {activeView === 'data-domains' && <DataDomainsView />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-auto px-12 py-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500"></div>
              <span>System Latency: 4ms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary"></div>
              <span>Data Integrity: 99.99%</span>
            </div>
          </div>
          <div>Last sync: 2 minutes ago</div>
        </footer>
      </main>

      <SourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
