import { Database, Store, BarChart3, Users, Zap, Globe, Shield, Search } from 'lucide-react';

interface DashboardProps {
    agentStatuses?: any[];
}

export function DashboardHome({ agentStatuses = [] }: DashboardProps) {
    const getAgentStatus = (id: string, defaultName: string) => {
        const found = agentStatuses.find(a => a.agent === id);
        return {
            status: found ? found.status : 'idle',
            detail: found ? found.detail : defaultName
        };
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-12 py-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-black tracking-tight gradient-text pb-2">
                    MeshOS Fabric
                </h1>
                <p className="text-xl text-white/40 max-w-2xl mx-auto uppercase tracking-[0.3em] font-black text-xs">
                    Autonomous A2A Coordination • Federated Governance
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatusCard
                    icon={<Database className="text-blue-400" />}
                    title="Oracle ERP"
                    {...getAgentStatus('FinancialAgent', 'Monitoring Financial Ops')}
                    color="blue"
                />
                <StatusCard
                    icon={<Store className="text-emerald-400" />}
                    title="Spanner Retail"
                    {...getAgentStatus('RetailAgent', 'Global Inventory Loop')}
                    color="emerald"
                />
                <StatusCard
                    icon={<BarChart3 className="text-purple-400" />}
                    title="Analytics Hub"
                    {...getAgentStatus('AnalyticsAgent', 'Synthesizing Segments')}
                    color="purple"
                />
                <StatusCard
                    icon={<Users className="text-orange-400" />}
                    title="AlloyDB CRM"
                    {...getAgentStatus('AnalyticsAgent', 'Customer Experience Base')}
                    color="orange"
                />
                <StatusCard
                    icon={<Users className="text-pink-400" />}
                    title="People Analytics"
                    {...getAgentStatus('HRAgent', 'Human Capital Intel')}
                    color="pink"
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2 px-2">
                    <Search size={18} className="text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Active Metadata Intelligence</h2>
                </div>
                <div className={`p-6 glass rounded-2xl border border-primary/20 flex items-center justify-between transition-all ${getAgentStatus('CatalogAgent', '').status === 'processing' ? 'ring-2 ring-primary/50' : ''}`}>
                   <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 ${getAgentStatus('CatalogAgent', '').status === 'processing' ? 'animate-pulse' : ''}`}>
                            <Search size={22} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase tracking-tighter text-lg">Catalog Agent</h3>
                            <p className="text-xs text-white/40 font-medium">{getAgentStatus('CatalogAgent', 'Scanning cross-domain entities and lineage').detail}</p>
                        </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Integrity Check</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500" />
                        </div>
                        <p className="text-[10px] text-white/20 font-bold italic">Mesh Knowledge Base: 100% Synced</p>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                <Feature icon={<Zap size={24} className="text-yellow-400" />} title="Logic Orchestration" desc="Recursive query decomposition across domain specialists." />
                <Feature icon={<Globe size={24} className="text-blue-400" />} title="GraphRAG Grounding" desc="Verified reasoning using property graph traversals." />
                <Feature icon={<Shield size={24} className="text-white" />} title="Federated Access" desc="Decentralized data ownership with central discovery." />
            </div>
        </div>
    );
}

function StatusCard({ icon, title, status, detail, color }: any) {
    const isProcessing = status === 'processing' || status === 'dispatching' || status === 'tool_executing';
    
    const colorMap: any = {
        blue: "border-blue-500/30 text-blue-400 bg-blue-500/5",
        emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
        purple: "border-purple-500/30 text-purple-400 bg-purple-500/5",
        orange: "border-orange-500/30 text-orange-400 bg-orange-500/5",
        pink: "border-pink-500/30 text-pink-400 bg-pink-500/5",
    };

    return (
        <div className={`glass p-5 rounded-2xl border ${colorMap[color]} transition-all hover:scale-[1.02] cursor-default group h-full flex flex-col`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">{icon}</div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${isProcessing ? 'animate-ping' : 'animate-pulse'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{isProcessing ? 'Analyzing' : 'Ready'}</span>
                </div>
            </div>
            <h3 className="font-black text-white/90 text-sm uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-[10px] text-white/40 leading-tight font-medium line-clamp-2 italic">{detail}</p>
            <div className="mt-auto pt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase text-white/20">Telemetric Link</span>
                <span className="text-[10px] font-bold uppercase text-white/20 tracking-tighter">0.02ms</span>
            </div>
        </div>
    );
}

function Feature({ icon, title, desc }: any) {
    return (
        <div className="flex flex-col gap-4 p-6 glass rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                {icon}
            </div>
            <div>
                <h4 className="font-black text-white mb-1 uppercase tracking-tight">{title}</h4>
                <p className="text-xs text-white/40 leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
    );
}

