import { Database, Store, BarChart3, Users, Zap, Globe, Shield } from 'lucide-react';

export function DashboardHome() {
    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-12 py-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-extrabold tracking-tight gradient-text">
                    Enterprise Data Nexus
                </h1>
                <p className="text-xl text-white/40 max-w-2xl mx-auto uppercase tracking-[0.2em] font-medium text-sm">
                    A2A Orchestration • Multi-Domain Intelligence • Real-time Insights
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatusCard
                    icon={<Database className="text-blue-400" />}
                    title="Oracle ERP"
                    status="Active"
                    desc="Global Resource Planning"
                    color="blue"
                />
                <StatusCard
                    icon={<Store className="text-emerald-400" />}
                    title="Spanner Retail"
                    status="Syncing"
                    desc="Distributed Inventory Cloud"
                    color="emerald"
                />
                <StatusCard
                    icon={<BarChart3 className="text-purple-400" />}
                    title="BigQuery Analytics"
                    status="Live"
                    desc="High-Performance Analytics"
                    color="purple"
                />
                <StatusCard
                    icon={<Users className="text-orange-400" />}
                    title="AlloyDB CRM"
                    status="Standby"
                    desc="Customer Relationship Cluster"
                    color="orange"
                />
                <StatusCard
                    icon={<Users className="text-pink-400" />}
                    title="Oracle HR"
                    status="Live"
                    desc="Human Capital Management"
                    color="pink"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <Feature icon={<Zap size={24} className="text-yellow-400" />} title="A2A Orchestration" desc="Multi-agent coordination using specialized domain-expert sub-agents." />
                <Feature icon={<Globe size={24} className="text-blue-400" />} title="Graph Reasoning" desc="Native property graph traversal across Spanner and Oracle relations." />
                <Feature icon={<Shield size={24} className="text-white" />} title="Secure Nexus" desc="Enterprise-grade security and authentication via Google Cloud ADC." />
            </div>
        </div>
    );
}

function StatusCard({ icon, title, status, desc, color }: any) {
    const colorMap: any = {
        blue: "border-blue-500/30 text-blue-400 bg-blue-500/5",
        emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
        purple: "border-purple-500/30 text-purple-400 bg-purple-500/5",
        orange: "border-orange-500/30 text-orange-400 bg-orange-500/5",
        pink: "border-pink-500/30 text-pink-400 bg-pink-500/5",
    };

    return (
        <div className={`glass p-6 rounded-2xl border ${colorMap[color]} transition-all hover:scale-105 cursor-default group`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/5">{icon}</div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
                </div>
            </div>
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
        </div>
    );
}

function Feature({ icon, title, desc }: any) {
    return (
        <div className="flex flex-col gap-4 p-6 glass rounded-2xl border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
