import { useState, useEffect } from 'react';
import { Terminal, Workflow, Activity, Clock, Server } from 'lucide-react';
import { A2AVisualizer } from './A2AVisualizer';
import { API_BASE_URL } from '../config';

export function AdminConsole() {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'logs' | 'mesh'>('logs');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/logs`);
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
                <StatCard icon={<Server size={20} className="text-primary" />} label="Mesh Fabric Health" value="5 Active Domains" subValue="All agents responsive" />
                <StatCard icon={<Workflow size={20} className="text-accent" />} label="Cross-Domain Links" value="12 Relationships" subValue="Derived via Catalog Agent" />
                <StatCard icon={<Activity size={20} className="text-green-500" />} label="System Sync" value="99.9%" subValue="Uptime across MCP servers" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <TabButton active={activeTab === 'logs'} label="Diagnostic Logs" icon={<Terminal size={18} />} onClick={() => setActiveTab('logs')} />
                <TabButton active={activeTab === 'mesh'} label="A2A Visualizer" icon={<Workflow size={18} />} onClick={() => setActiveTab('mesh')} />
            </div>

            <div className="flex-1 glass rounded-3xl border-white/10 overflow-hidden flex flex-col">
                {activeTab === 'logs' ? (
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Terminal size={20} className="text-primary" />
                                Real-time Diagnostic Stream
                            </h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-medium border border-white/10 text-white/40 tracking-wider">GLOBAL MESH</span>
                                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-medium border border-primary/20 animate-pulse">LIVE</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <LogEntry key={log.id || i} log={log} />
                            ))}
                            {logs.length === 0 && <p className="text-white/30 text-center mt-20 italic">Waiting for telemetry from the mesh...</p>}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-hidden">
                        <A2AVisualizer />
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subValue }: any) {
    return (
        <div className="glass rounded-2xl p-6 border-white/10 flex flex-col gap-4 group hover:bg-white/10 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-white/90">{value}</p>
                <p className="text-[10px] text-white/30 mt-1 font-medium leading-tight">{subValue}</p>
            </div>
        </div>
    );
}

function TabButton({ active, label, icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
            {icon}
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </button>
    );
}

function LogEntry({ log }: { log: any }) {
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'REASONING': return 'text-accent bg-accent/10 border-accent/20';
            case 'A2A_DISPATCH': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
            case 'A2A_RESPONSE': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'TOOL_CALL': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            default: return 'text-primary bg-primary/10 border-primary/20';
        }
    };

    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 hover:bg-white/10 transition-all group duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter border ${getTypeStyles(log.type)}`}>
                        {log.type}
                    </span>
                    <span className="text-xs font-black text-white/90 uppercase tracking-widest">{log.agent}</span>
                    {log.traceId && (
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-white/40 font-mono font-bold tracking-tight group-hover:bg-white/10 transition-colors">
                            TRC: {log.traceId.slice(0, 8)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-white/30 group-hover:text-white/50 transition-colors">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-mono whitespace-pre-wrap break-words">
                {log.message}
            </p>
        </div>
    );
}

