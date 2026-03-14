import { useState, useEffect } from 'react';
import { Workflow, ArrowRight, Zap, Database, Search, MessageSquare, Clock } from 'lucide-react';

interface A2AEvent {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    type: string;
    meta?: any;
}

export function A2AVisualizer() {
    const [events, setEvents] = useState<A2AEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/admin/events');
                const data = await res.json();
                setEvents(data);
                setIsLoading(false);
            } catch (e) {
                console.error("Failed to fetch A2A events", e);
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 2000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) return <div className="p-8 text-center text-white/20">Initializing Mesh Monitor...</div>;

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Workflow size={24} className="text-accent" />
                        A2A Communication Flow
                    </h3>
                    <p className="text-xs text-white/40 mt-1">Real-time trace of agent-to-agent delegatons and context fusion.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        <span className="text-[10px] font-bold text-white/60">DISPATCH</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400" />
                        <span className="text-[10px] font-bold text-white/60">RESPONSE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400" />
                        <span className="text-[10px] font-bold text-white/60">TOOL CALL</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pr-4">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-20">
                        <Zap size={48} className="mb-4" />
                        <p className="font-medium italic">Monitor standing by for mesh activity</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))
                )}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: A2AEvent }) {
    const isDispatch = event.type === 'A2A_DISPATCH';
    const isResponse = event.type === 'A2A_RESPONSE';
    const isTool = event.type === 'TOOL_CALL' || event.type === 'TOOL_RESULT';
    const isContext = event.type === 'A2A_CONTEXT_SYNC';

    const getIcon = () => {
        if (isDispatch) return <ArrowRight size={16} className="text-cyan-400" />;
        if (isResponse) return <Zap size={16} className="text-green-400" />;
        if (isTool) return <Database size={16} className="text-yellow-400" />;
        if (isContext) return <MessageSquare size={16} className="text-blue-400" />;
        return <Search size={16} />;
    };

    const getBorderColor = () => {
        if (isDispatch) return 'border-cyan-400/30 bg-cyan-400/5';
        if (isResponse) return 'border-green-400/30 bg-green-400/5';
        if (isTool) return 'border-yellow-400/30 bg-yellow-400/5';
        if (isContext) return 'border-blue-400/30 bg-blue-400/5';
        return 'border-white/10 bg-white/5';
    };

    return (
        <div className={`p-4 rounded-2xl border ${getBorderColor()} transition-all hover:translate-x-1 duration-300`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/5 border border-white/10`}>
                        {getIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-white/90">{event.agent}</span>
                            <span className="text-[10px] font-bold text-white/30 italic">/ {event.type.replace('A2A_', '')}</span>
                        </div>
                        <p className="text-sm text-white/70 mt-1 font-medium leading-relaxed">
                            {event.message}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 text-white/20">
                        <Clock size={10} />
                        <span className="text-[10px] font-bold tracking-tighter">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {event.meta && (
                <div className="mt-3 ml-11 overflow-hidden">
                    <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(event.meta).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                    <p className="text-[9px] uppercase font-bold text-white/20 tracking-widest mb-0.5">{key}</p>
                                    <p className="text-[11px] text-white/60 font-mono break-all line-clamp-2">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
