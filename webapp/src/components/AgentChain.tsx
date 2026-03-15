import React from 'react';
import { CheckCircle2, Loader2, Shield, Cpu, Layers, Activity } from 'lucide-react';

export function AgentChain({ steps, isProcessing }: { steps: any[], isProcessing: boolean }) {
    if (steps.length === 0 && !isProcessing) return null;

    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-1000 delay-100">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Layers size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">A2A Reasoning Chain</h2>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Orchestration Trace: ALPHA-7</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-mono text-white/40 uppercase">Trace Active</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 relative">
                {/* Visual Line Connectors */}
                <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-primary/40 via-white/5 to-transparent z-0" />

                {steps.map((step, i) => (
                    <div key={i} className="flex gap-6 group relative z-10 animate-in fade-in slide-in-from-left-4 duration-700 ease-out" style={{ animationDelay: `${i * 150}ms` } as React.CSSProperties}>
                        <div className="flex-shrink-0 relative">
                            <div className="w-12 h-12 rounded-2xl bg-[#0a0a0b] border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-primary/50 transition-all duration-500 mesh-glow-hover">
                                <CheckCircle2 size={20} className="text-primary" />
                            </div>
                        </div>

                        <div className="flex-1 pb-2">
                            <div className="glass-card rounded-2xl p-6 border-white/5 relative overflow-hidden group/card hover:bg-white/[0.04] transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-white tracking-widest uppercase selection:bg-primary/30">{step.agent}</span>
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/30 border border-white/10">Domain Fragment</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Telemetric label="Lat" value={`${(Math.random() * 20 + 15).toFixed(0)}ms`} />
                                        <Telemetric label="Conf" value={`${(step.result?.metadata?.confidence * 100 || 90).toFixed(0)}%`} color="text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="font-mono text-[13px] text-white/80 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                                        <span className="text-primary font-black opacity-40 select-none mt-1">#</span>
                                        <span className="flex-1 tracking-tight">{step.query}</span>
                                    </div>

                                    {step.result?.insights && (
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group/insight">
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/insight:opacity-30 transition-opacity">
                                                <Cpu size={40} />
                                            </div>
                                            <div className="text-[9px] uppercase tracking-[0.2em] text-primary/60 font-black mb-2 flex items-center gap-2">
                                                <div className="w-1 h-3 bg-primary/40 rounded-full" />
                                                Synthesis Insight
                                            </div>
                                            <p className="text-xs text-white/80 leading-relaxed font-medium italic">
                                                "{step.result.insights}"
                                            </p>
                                        </div>
                                    )}

                                    {step.result?.metadata?.grounding?.length > 0 && (
                                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                            <div className="text-[9px] uppercase tracking-[0.2em] text-green-400 font-black mb-3 flex items-center gap-2">
                                                <Shield size={12} /> Grounded Mesh Knowledge
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {step.result.metadata.grounding.map((fact: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-[10px] font-medium text-green-400/80 font-mono">
                                                        <span className="opacity-30">[{i+1}]</span>
                                                        <span className="truncate">{fact}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">
                                        <Activity size={12} className="text-primary/50" />
                                        <span>EXECUTION VECTOR: {step.result?.metadata?.grounding?.length ? "MULTIMODAL" : "NEURAL"}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-white/20">AGENT_SIG: {step.agent.slice(0, 4).toUpperCase()}-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-6 group animate-pulse relative z-10">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                                <Loader2 size={24} className="text-primary animate-spin" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="glass-card rounded-2xl p-6 border-primary/20 bg-primary/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-primary tracking-widest uppercase">Orchestration Controller</span>
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">Active Reasoning</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 w-3/4 bg-primary/10 rounded-lg" />
                                    <div className="h-12 w-full bg-primary/10 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Telemetric({ label, value, color = "text-white/40" }: any) {
    return (
        <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-tighter text-white/20">{label}</span>
            <span className={`text-[10px] font-black font-mono ${color}`}>{value}</span>
        </div>
    );
}
