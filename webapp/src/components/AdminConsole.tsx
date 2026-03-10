import { useState, useEffect } from 'react';
import { Terminal, Workflow, Activity, Clock, Server } from 'lucide-react';

export function AdminConsole() {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'logs' | 'mesh'>('logs');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/admin/logs');
                const data = await res.json();
                setLogs(data);
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-6 h-full pb-8">
            {/* Header Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Server size={20} className="text-primary" />} label="Domain Health" value="4 Online" subValue="All systems nominal" />
                <StatCard icon={<Workflow size={20} className="text-accent" />} label="Mesh Traffic" value="24 queries/hr" subValue="+12% from last hour" />
                <StatCard icon={<Activity size={20} className="text-green-500" />} label="System Latency" value="1.2s" subValue="P95 Response time" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <TabButton active={activeTab === 'logs'} label="Diagnostic Logs" icon={<Terminal size={18} />} onClick={() => setActiveTab('logs')} />
                <TabButton active={activeTab === 'mesh'} label="A2A Visualizer" icon={<Workflow size={18} />} onClick={() => setActiveTab('mesh')} />
            </div>

            {activeTab === 'logs' ? (
                <div className="flex-1 glass rounded-3xl border-white/10 overflow-hidden flex flex-col p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Terminal size={20} className="text-primary" />
                            Real-time Diagnostic Stream
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-medium border border-white/10">ALL DOMAINS</span>
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-medium border border-primary/20">LIVE</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {logs.map((log, i) => (
                            <LogEntry key={i} log={log} />
                        ))}
                        {logs.length === 0 && <p className="text-white/30 text-center mt-20">Waiting for mesh events...</p>}
                    </div>
                </div>
            ) : (
                <div className="flex-1 glass rounded-3xl border-white/10 p-8 flex flex-col items-center justify-center gap-6">
                    <Workflow size={48} className="text-white/20 animate-pulse" />
                    <p className="text-white/40 font-medium">Coming Soon: Interactive A2A Communication Flow Map</p>
                    <p className="text-xs text-white/20 max-w-sm text-center">This view will provide a real-time graph visualization of agent calls, message passing, and context fusion paths.</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, subValue }: any) {
    return (
        <div className="glass rounded-2xl p-6 border-white/10 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                {icon}
            </div>
            <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[10px] text-white/30 mt-1">{subValue}</p>
            </div>
        </div>
    );
}

function TabButton({ active, label, icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${active ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
            {icon}
            <span className="font-semibold text-sm">{label}</span>
        </button>
    );
}

function LogEntry({ log }: { log: any }) {
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'REASONING': return 'text-accent bg-accent/10 border-accent/20';
            case 'DEBUG': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            default: return 'text-primary bg-primary/10 border-primary/20';
        }
    };

    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeStyles(log.type)}`}>
                        {log.type}
                    </span>
                    <span className="text-xs font-bold text-white/80">{log.agent}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/30">
                    <Clock size={12} />
                    <span className="text-[10px] font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-mono">
                {log.message}
            </p>
        </div>
    );
}
