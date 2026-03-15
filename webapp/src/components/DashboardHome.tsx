import { Database, Store, BarChart3, Users, Zap, Shield, Search, Activity } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto flex flex-col gap-16 py-16 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">
                    <Activity size={12} className="animate-pulse" />
                    Mesh Operational Status: Nominal
                </div>
                <h1 className="text-7xl font-black tracking-tighter leading-none mb-2">
                   Strategic Intelligence <br/>
                   <span className="text-white/20">Operational Layer</span>
                </h1>
                <p className="text-sm text-white/40 max-w-xl mx-auto font-medium leading-relaxed tracking-tight">
                    Real-time autonomous coordination between federated domain specialists. <br/>
                    Powered by GraphRAG Grounding & Intent Lineage.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatusCard
                    icon={<Database size={20} />}
                    title="Financial"
                    subTitle="Oracle ERP Core"
                    {...getAgentStatus('FinancialAgent', 'Monitoring Invoices')}
                    color="blue"
                    latency="12ms"
                />
                <StatusCard
                    icon={<Store size={20} />}
                    title="Retail"
                    subTitle="Spanner Inventory"
                    {...getAgentStatus('RetailAgent', 'Global Stock Sync')}
                    color="emerald"
                    latency="24ms"
                />
                <StatusCard
                    icon={<BarChart3 size={20} />}
                    title="Analytics"
                    subTitle="BigQuery EDW"
                    {...getAgentStatus('AnalyticsAgent', 'Trend Synthesis')}
                    color="purple"
                    latency="45ms"
                />
                <StatusCard
                    icon={<Users size={20} />}
                    title="HR Intel"
                    subTitle="AlloyDB CMP"
                    {...getAgentStatus('HRAgent', 'Talent Analytics')}
                    color="pink"
                    latency="18ms"
                />
                <StatusCard
                    icon={<Search size={20} />}
                    title="Catalog"
                    subTitle="Metadata Hub"
                    {...getAgentStatus('CatalogAgent', 'Lineage Tracking')}
                    color="orange"
                    latency="8ms"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-primary" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Logic Mesh Performance</h2>
                        </div>
                        <span className="text-[10px] font-mono text-white/20">Updated: Just Now</span>
                    </div>
                    
                    <div className="glass-card rounded-3xl p-8 border-white/5 relative overflow-hidden group scanline">
                        <div className="flex items-end gap-1 mb-8">
                            {[40, 65, 45, 90, 85, 40, 60, 55, 75, 50, 45, 60].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/5 rounded-t-sm hover:bg-primary/40 transition-all duration-500" style={{ height: `${h}px` }} />
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                            <div className="flex gap-10">
                                <Metric label="Throughput" value="1.2k req/s" />
                                <Metric label="Avg Latency" value="301ms" />
                                <Metric label="Context Depth" value="128k" />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mesh-glow" />
                                Optimal
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 px-2">
                        <Shield size={16} className="text-accent" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Governance Check</h2>
                    </div>
                    <div className="glass-card rounded-3xl p-8 border-white/5 flex flex-col gap-6">
                        <GovernanceItem label="Contract Validation" status="Passed" />
                        <GovernanceItem label="Lineage Recording" status="Active" />
                        <GovernanceItem label="Identity Mesh" status="Verified" />
                        <div className="mt-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Mesh Health Score</p>
                            <p className="text-3xl font-black text-white selection:bg-primary/30">99.8</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ icon, title, subTitle, status, detail, color, latency }: any) {
    const isProcessing = status === 'processing' || status === 'dispatching' || status === 'tool_executing';
    
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
        orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    };

    return (
        <div className={`glass-card p-6 rounded-3xl border border-white/5 group hover:border-white/20 transition-all duration-500`}>
            <div className="flex justify-between items-start mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]} border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500`}>
                    {icon}
                </div>
                <div className={`px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest ${isProcessing ? 'text-primary' : 'text-white/20'}`}>
                    {isProcessing ? 'Syncing' : 'Ready'}
                </div>
            </div>
            
            <div className="space-y-1 mb-6">
                <h3 className="font-black text-white text-base tracking-tight leading-none group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">{subTitle}</p>
            </div>
            
            <p className="text-[10px] text-white/40 leading-relaxed font-medium line-clamp-2 h-8">
                {isProcessing ? "Processing complex domain request..." : detail}
            </p>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center transition-all group-hover:border-white/10">
                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{latency}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-primary animate-ping' : 'bg-green-500/20'}`} />
            </div>
        </div>
    );
}

function Metric({ label, value }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">{label}</span>
            <span className="text-sm font-bold text-white/80">{value}</span>
        </div>
    );
}

function GovernanceItem({ label, status }: any) {
    return (
        <div className="flex items-center justify-between group cursor-default">
            <span className="text-[11px] font-bold text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-tight">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-green-500/80 uppercase tracking-widest">{status}</span>
                <div className="w-1 h-1 rounded-full bg-green-500/60" />
            </div>
        </div>
    );
}


