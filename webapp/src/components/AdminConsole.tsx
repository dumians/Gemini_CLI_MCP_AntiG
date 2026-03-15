import { useState, useEffect } from 'react';
import { Terminal, Workflow, Activity, Clock, Server, ShieldCheck, Cpu, Database } from 'lucide-react';
import { A2AVisualizer } from './A2AVisualizer';
import { API_BASE_URL } from '../config';
import { auth } from '../utils/auth';

export function AdminConsole() {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('logs');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = auth.getToken();
                const res = await fetch(`${API_BASE_URL}/api/admin/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.status === 401) {
                    window.location.reload(); // App.tsx will handle logout
                    return;
                }

                const data = await res.json();
                setLogs(data);
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const getLogColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'success': return 'text-green-400';
            default: return 'text-primary';
        }
    };

    return (
        <div className="p-8 h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Governance Command</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Mesh Integrity Optimal</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Node: PRIMARY-BRAVO-9</span>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        Diagnostic Stream
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        Protocol Guard
                    </button>
                </div>
            </div>

            {/* Tactical Stats */}
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Uptime', value: '99.98%', icon: Clock, color: 'text-primary' },
                    { label: 'Active Agents', value: '24', icon: Workflow, color: 'text-accent' },
                    { label: 'Network Load', value: '12%', icon: Activity, color: 'text-green-400' },
                    { label: 'Secure Buffer', value: 'Active', icon: ShieldCheck, color: 'text-primary' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border-white/5 group hover:border-primary/30 transition-all duration-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/40 w-2/3" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black tracking-tight uppercase">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 grid grid-cols-3 gap-8">
                {/* Visualizer - Takes 2/3 */}
                <div className="col-span-2 glass-card rounded-[2.5rem] border-white/5 p-8 relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Cpu size={20} className="text-primary" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tighter">Real-time Architecture</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-primary" />
                                <span className="text-[10px] font-bold text-white/40 uppercase">Domain</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-accent" />
                                <span className="text-[10px] font-bold text-white/40 uppercase">Agent</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                        <A2AVisualizer />
                    </div>
                </div>

                {/* Log Stream */}
                <div className="col-span-1 glass-card rounded-[2.5rem] border-white/5 p-8 flex flex-col bg-[#0d0d0f]/50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30">
                            <Terminal size={20} className="text-accent" />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-tighter">Event Logs</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 space-y-4 font-mono scrollbar-hide">
                        {logs.length > 0 ? (
                            logs.map((log: any, i: number) => (
                                <div key={i} className="group border-l border-white/5 pl-4 py-1 hover:border-primary/40 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${getLogColor(log.status)}`}>
                                            [{log.status}]
                                        </span>
                                        <span className="text-[9px] text-white/20">{log.time}</span>
                                    </div>
                                    <p className="text-[11px] text-white/60 leading-relaxed font-medium group-hover:text-white transition-colors">
                                        {log.message}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4 mt-20">
                                <Server size={40} strokeWidth={1} />
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting Stream...</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secure Link Active</span>
                        </div>
                        <Database size={14} className="text-white/20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
