import { Terminal, CheckCircle2, Loader2, ChevronRight, Shield } from 'lucide-react';

export function AgentChain({ steps, isProcessing }: { steps: any[], isProcessing: boolean }) {
    if (steps.length === 0 && !isProcessing) return null;

    return (
        <div className="glass rounded-3xl p-6 border-white/10 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 text-white/50 font-semibold tracking-wider text-xs uppercase">
                <Terminal size={14} />
                A2A Reasoning Chain
            </div>

            <div className="flex flex-col gap-3">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-4 group animate-in slide-in-from-left-4 duration-500">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 size={16} />
                            </div>
                            {i < steps.length - 1 && <div className="w-px h-full bg-white/10" />}
                        </div>
                        <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white/80 tracking-wide uppercase">{step.agent}</span>
                                <span className="text-[10px] text-white/30 tracking-tight">• Delegation Fragment</span>
                            </div>
                            <p className="text-sm text-white/60 font-mono bg-black/30 p-3 rounded-lg border border-white/5">
                                <span className="text-emerald-400/70 mr-2">$</span>
                                {step.query}
                            </p>

                            {step.result?.insights && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="text-[10px] uppercase tracking-tighter text-primary/60 font-bold mb-1">Domain Insight</div>
                                    <p className="text-xs text-white/70 italic leading-relaxed">
                                        "{step.result.insights}"
                                    </p>
                                </div>
                            )}

                            {step.result?.metadata?.grounding?.length > 0 && (
                                <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-1">
                                        <Shield size={10} /> Grounded Graph Fact
                                    </div>
                                    <ul className="space-y-1">
                                        {step.result.metadata.grounding.map((fact: string, i: number) => (
                                            <li key={i} className="text-[10px] text-emerald-400/80 font-mono">
                                                • {fact}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-2 text-[10px] text-white/30 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <ChevronRight size={10} />
                                    <span>Source: {step.result?.metadata?.source || "Standard Engine"}</span>
                                </div>
                                <div className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                    Confidence: {(step.result?.metadata?.confidence * 100 || 90).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-4 group animate-pulse">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                <Loader2 size={16} className="animate-spin" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white/80 tracking-wide uppercase">Orchestrator</span>
                                <span className="text-[10px] text-primary/70 animate-pulse uppercase tracking-wider font-bold">Scaling...</span>
                            </div>
                            <div className="h-4 w-48 bg-white/5 rounded-full" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
