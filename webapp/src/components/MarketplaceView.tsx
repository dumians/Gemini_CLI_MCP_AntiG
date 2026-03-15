import { useEffect, useState } from 'react';
import { Share2, Info, Boxes, Search, Database, ShoppingBag } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function MarketplaceView() {
    const [catalog, setCatalog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/catalog`);
                const data = await res.json();
                setCatalog(data);
            } catch (e) {
                console.error("Failed to fetch catalog", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCatalog();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const sources = Object.values(catalog?.sources || {});
    const entities = Object.values(catalog?.entities || {});

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight gradient-text">Mesh Marketplace</h1>
                    <p className="text-white/40 font-medium uppercase tracking-widest text-xs mt-1">Discover, Inspect, and Utilize Data Products</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-white/5">
                        <Boxes size={18} className="text-primary" />
                        <span className="text-sm font-bold">{entities.length} Active Products</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {sources.map((source: any) => (
                        <div key={source.id} className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Database size={16} className="text-white/30" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/40">{source.name}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entities
                                    .filter((e: any) => e.source === source.id)
                                    .map((entity: any) => (
                                        <div 
                                            key={entity.id}
                                            onClick={() => setSelectedEntity(entity)}
                                            className={`p-5 glass rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${selectedEntity?.id === entity.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-white/5 hover:border-white/20'}`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-2 rounded-lg ${entity.type === 'PROPERTY_GRAPH' ? 'bg-pink-500/10 text-pink-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {entity.type === 'PROPERTY_GRAPH' ? <Share2 size={18} /> : <Database size={18} />}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                                                    {entity.type.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-lg mb-1">{entity.name}</h4>
                                            <p className="text-xs text-white/40 line-clamp-2 italic mb-4">{entity.schema?.description || 'Agent-curated data product for domain operations.'}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold uppercase text-white/30 border border-white/5">v1.2.0</span>
                                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold uppercase text-white/30 border border-white/5">Verified</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Inspector Panel */}
                <div className="lg:col-span-1">
                    {selectedEntity ? (
                        <div className="glass rounded-3xl p-6 border-white/10 sticky top-4 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tight text-white/90">Product Inspector</h3>
                                    <p className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Deep Metadata View</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Identity</label>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-xs font-mono text-white/60 mb-1">{selectedEntity.id}</p>
                                        <h4 className="font-bold text-white">{selectedEntity.name}</h4>
                                    </div>
                                </div>

                                {selectedEntity.type === 'PROPERTY_GRAPH' ? (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Graph Components</label>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[10px] text-white/40 font-bold uppercase">Vertex Labels (Nodes)</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedEntity.nodes?.map((n: string) => (
                                                        <span key={n} className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold border border-pink-500/20">{n}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 pt-2">
                                                <p className="text-[10px] text-white/40 font-bold uppercase">Relationship Types (Edges)</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedEntity.edges?.map((e: any) => (
                                                        <span key={e.label} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">{e.label}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Schema Attributes</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                            {selectedEntity.schema?.columns?.map((col: any) => (
                                                <div key={col.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                                    <span className="text-xs font-bold text-white/80">{col.name}</span>
                                                    <span className="text-[10px] font-mono text-white/20">{col.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button className="w-full py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all text-sm">
                                    <ShoppingBag size={16} />
                                    Subscribe to Endpoint
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] glass rounded-3xl border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4 border border-white/10">
                                <Search size={24} />
                            </div>
                            <h3 className="font-bold text-white/40 uppercase tracking-widest text-xs">Select a product to inspect</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
