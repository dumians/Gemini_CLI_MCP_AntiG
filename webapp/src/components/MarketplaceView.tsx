import { useEffect, useState } from 'react';
import { Share2, Info, Boxes, Database, ShoppingBag, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { auth } from '../utils/auth';

export function MarketplaceView() {
    const [catalog, setCatalog] = useState<any>(null);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const token = auth.getToken();
                const res = await fetch(`${API_BASE_URL}/api/catalog`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    window.location.reload();
                    return;
                }

                const data = await res.json();
                setCatalog(data);
            } catch (e) {
                console.error("Failed to fetch catalog", e);
            }
        };
        fetchCatalog();
    }, []);

    if (!catalog) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] animate-pulse">Syncing Mesh Catalog...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Marketplace Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Data Provisioning Hub</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <ShoppingBag size={12} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{catalog.products?.length || 0} Products Indexed</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Domain Coverage: GLOBAL-9</span>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-4 border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Active Links</span>
                            <span className="text-sm font-black tracking-tight">1,248</span>
                        </div>
                        <Activity className="text-primary" size={20} />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-10">
                {/* Catalog Grid */}
                <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                    <div className="grid grid-cols-2 gap-6">
                        {catalog.products?.map((product: any, i: number) => (
                            <div 
                                key={i}
                                onClick={() => setSelectedEntity(product)}
                                className={`group relative glass-card p-8 rounded-[2rem] border-white/5 transition-all duration-500 cursor-pointer overflow-hidden ${selectedEntity === product ? 'ring-2 ring-primary shadow-2xl shadow-primary/20 scale-[0.98]' : 'hover:scale-[1.02] hover:border-white/20'}`}
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <Database size={80} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                                            <Boxes size={28} />
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                            <ShieldCheck size={10} className="text-green-400" />
                                            <span className="text-[9px] font-black uppercase text-white/60 tracking-tighter">Verified</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black mb-2 tracking-tighter uppercase leading-tight">{product.name}</h3>
                                    <p className="text-xs text-white/40 line-clamp-2 mb-6 font-medium uppercase tracking-wide leading-relaxed">{product.description}</p>
                                    
                                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Owner</span>
                                            <span className="text-[11px] font-black uppercase text-primary">{product.owner}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Latency</span>
                                            <span className="text-[11px] font-black uppercase">45ms</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inspector Panel */}
                <div className="w-[450px] glass-card rounded-[2.5rem] border-white/5 p-10 flex flex-col animate-in slide-in-from-right-8 duration-700 bg-[#0d0d0f]/50">
                    {selectedEntity ? (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30">
                                    <Info size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Entity Inspector</h2>
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Deep Metadata Analysis</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Technical Specifications</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: 'Asset UUID', value: 'DS-' + Math.random().toString(36).substr(2, 9).toUpperCase() },
                                            { label: 'Protocal', value: 'MESH-GRPC-V4' },
                                            { label: 'Governance', value: 'Auto-Managed' },
                                            { label: 'Tier', value: 'Strategic Business' }
                                        ].map((spec, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{spec.label}</span>
                                                <span className="text-[10px] font-mono font-bold text-white/80">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Schema Definition</h4>
                                    <div className="p-6 rounded-2xl bg-[#050506] border border-white/10 font-mono text-[11px] leading-relaxed text-white/60">
                                        <pre className="whitespace-pre-wrap">
                                            {JSON.stringify({
                                                fields: [
                                                    { id: "timestamp", type: "UTC_TIMESTAMP" },
                                                    { id: "payload_hash", type: "SHA256" },
                                                    { id: "origin_node", type: "EDGENODE_REF" }
                                                ],
                                                validation: "STRICT_PROTOCOL_V2"
                                            }, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <button className="mt-10 w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-white/5">
                                <Share2 size={16} />
                                Provision Access
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-20 group">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-8 group-hover:rotate-45 transition-transform duration-500">
                                <ArrowUpRight size={40} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Awaiting Selection</h3>
                            <p className="text-xs font-medium leading-relaxed uppercase tracking-widest">Select a data product from the telemetry grid to inspect governance controls and access protocols.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
