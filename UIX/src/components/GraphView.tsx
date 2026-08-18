import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../utils/api';
import { 
    Database, Activity, RefreshCw, ZoomIn, ZoomOut, Focus, 
    Play, Pause, Maximize2, Minimize2, Search, X, Table, Layers 
} from 'lucide-react';
import { 
    getDomainStyle, 
    drawSourceNodeCanvas, 
    drawEntityNodeCanvas 
} from '../utils/graphTheme';

export function GraphView({ data: initialData }: { data?: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const [graphData, setGraphData] = useState<any>(initialData || { nodes: [], links: [] });
    const [loading, setLoading] = useState(!initialData);
    const [dimensions, setDimensions] = useState({ width: 900, height: 520 });

    // Interactive States
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [hoverNode, setHoverNode] = useState<any | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isPhysicsPaused, setIsPhysicsPaused] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Compute Highlighted Neighborhood
    const { highlightNodes, highlightLinks } = useMemo(() => {
        const hNodes = new Set<string>();
        const hLinks = new Set<any>();
        const focusNode = hoverNode || selectedNode;

        if (focusNode) {
            hNodes.add(focusNode.id);
            (graphData.links || []).forEach((link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                if (sId === focusNode.id || tId === focusNode.id) {
                    hLinks.add(link);
                    hNodes.add(sId);
                    hNodes.add(tId);
                }
            });
        }
        return { highlightNodes: hNodes, highlightLinks: hLinks };
    }, [hoverNode, selectedNode, graphData]);

    // Filter nodes by domain
    const filteredGraphData = useMemo(() => {
        const nodes = graphData.nodes || [];
        const links = graphData.links || [];

        if (selectedDomain === 'ALL') {
            const allNodeIds = new Set(nodes.map((n: any) => n.id));
            const safeLinks = links.filter((l: any) => {
                const sId = typeof l.source === 'object' ? l.source?.id : l.source;
                const tId = typeof l.target === 'object' ? l.target?.id : l.target;
                return allNodeIds.has(sId) && allNodeIds.has(tId);
            });
            return { nodes, links: safeLinks };
        }

        const visibleNodes = nodes.filter((n: any) => {
            const domain = n.domain || n.properties?.domain || '';
            const style = getDomainStyle(domain, n.sourceId || n.id);
            return style.name.toLowerCase().includes(selectedDomain.toLowerCase()) || 
                   domain.toLowerCase().includes(selectedDomain.toLowerCase());
        });
        
        const visibleNodeIds = new Set(visibleNodes.map((n: any) => n.id));
        const visibleLinks = links.filter((l: any) => {
            const sId = typeof l.source === 'object' ? l.source?.id : l.source;
            const tId = typeof l.target === 'object' ? l.target?.id : l.target;
            return visibleNodeIds.has(sId) && visibleNodeIds.has(tId);
        });

        return { nodes: visibleNodes, links: visibleLinks };
    }, [graphData, selectedDomain]);

    // Responsive dimensions
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width === 0) continue;
                setDimensions({
                    width: entry.contentRect.width,
                    height: isFullscreen ? window.innerHeight - 80 : 520
                });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [isFullscreen]);

    const fetchGraph = useCallback(async () => {
        if (initialData) return;
        try {
            const res = await api.get('/api/catalog/graph');
            const defaultNodes = [
                { id: 'gateway', label: 'One MCP Gateway', type: 'source', domain: 'Unified', val: 18 },
                { id: 'orchestrator', label: 'Master Orchestrator', type: 'source', domain: 'Unified', val: 18 },
                { id: 'oracle', label: 'Oracle ERP', type: 'source', domain: 'Finance', val: 16 },
                { id: 'spanner', label: 'Spanner Retail', type: 'source', domain: 'Sales', val: 16 },
                { id: 'bigquery', label: 'BigQuery Analytics', type: 'source', domain: 'Analytics', val: 16 },
                { id: 'alloy', label: 'AlloyDB CRM', type: 'source', domain: 'CRM', val: 16 },
                { id: 'warehouse', label: 'Warehouse Spatial', type: 'source', domain: 'Warehouse', val: 16 },
                { id: 'netsuite', label: 'NetSuite ERP', type: 'source', domain: 'NetSuite', val: 16 },
                { id: 'sku500', label: 'SKU-500 Battery Path', type: 'table', domain: 'Warehouse', val: 10 }
            ];
            
            const defaultLinks = [
                { source: 'gateway', target: 'orchestrator', type: 'ownership' },
                { source: 'orchestrator', target: 'oracle', type: 'ownership' },
                { source: 'orchestrator', target: 'spanner', type: 'ownership' },
                { source: 'orchestrator', target: 'bigquery', type: 'ownership' },
                { source: 'orchestrator', target: 'alloy', type: 'ownership' },
                { source: 'orchestrator', target: 'warehouse', type: 'ownership' },
                { source: 'orchestrator', target: 'netsuite', type: 'ownership' },
                { source: 'warehouse', target: 'sku500', type: 'relationship' },
                { source: 'spanner', target: 'bigquery', type: 'cross_domain', label: 'cross_query' }
            ];

            if (!res || !res.nodes || res.nodes.length === 0) {
                setGraphData((prev: any) => ({
                    nodes: defaultNodes.map((node: any) => {
                        const prevNode = prev.nodes?.find((n: any) => n.id === node.id);
                        return prevNode ? { ...node, x: prevNode.x, y: prevNode.y } : node;
                    }),
                    links: defaultLinks
                }));
            } else {
                setGraphData((prev: any) => ({
                    nodes: res.nodes.map((node: any) => {
                        const prevNode = prev.nodes?.find((n: any) => n.id === node.id);
                        return prevNode ? { ...node, x: prevNode.x, y: prevNode.y } : node;
                    }),
                    links: res.links || []
                }));
            }
        } catch (e) {
            console.error("Failed to fetch graph data", e);
        } finally {
            setLoading(false);
        }
    }, [initialData]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    // Force simulation parameters
    useEffect(() => {
        if (!fgRef.current) return;
        try {
            if (typeof fgRef.current.d3Force === 'function') {
                const charge = fgRef.current.d3Force('charge');
                if (charge && typeof charge.strength === 'function') {
                    charge.strength(-220);
                }
                const link = fgRef.current.d3Force('link');
                if (link && typeof link.distance === 'function') {
                    link.distance(85);
                }
            }
        } catch (err) {
            console.warn("GraphView force simulation warning:", err);
        }
    }, [graphData]);

    const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 400);
    const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 400);
    const handleFitView = () => fgRef.current?.zoomToFit(500, 60);

    const togglePhysics = () => {
        if (!fgRef.current) return;
        if (isPhysicsPaused) {
            fgRef.current.resumeAnimation();
            setIsPhysicsPaused(false);
        } else {
            fgRef.current.pauseAnimation();
            setIsPhysicsPaused(true);
        }
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 500);
            fgRef.current.zoom(1.8, 500);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const matched = graphData.nodes?.find((n: any) => 
            (n.label || n.name || n.id).toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matched) handleNodeClick(matched);
    };

    const domainOptions = ['ALL', 'Finance', 'Sales', 'Analytics', 'CRM', 'Warehouse', 'NetSuite'];

    return (
        <div 
            ref={containerRef} 
            className={`bg-slate-950/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden isolate flex flex-col transition-all duration-300 ${
                isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950/95 h-screen' : 'h-[580px]'
            }`}
        >
            {/* Top Toolbar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                
                {/* Title & Domain Chips */}
                <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white tracking-wide">Live Architecture Telemetry</span>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto max-w-[340px] scrollbar-none py-0.5">
                        {domainOptions.map(domain => {
                            const style = domain !== 'ALL' ? getDomainStyle(domain) : null;
                            const isActive = selectedDomain === domain;
                            return (
                                <button
                                    key={domain}
                                    onClick={() => setSelectedDomain(domain)}
                                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                                        isActive 
                                            ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary' 
                                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                                    }`}
                                >
                                    {style && (
                                        <span 
                                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" 
                                            style={{ backgroundColor: style.primary }} 
                                        />
                                    )}
                                    {domain}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900/80 border border-white/10 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 w-24 focus:w-36 transition-all"
                        />
                    </form>

                    <div className="h-4 w-[1px] bg-white/10 mx-1" />

                    <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        <ZoomIn size={14} />
                    </button>
                    <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        <ZoomOut size={14} />
                    </button>
                    <button onClick={handleFitView} title="Fit View" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        <Focus size={14} />
                    </button>
                    <button onClick={togglePhysics} title="Toggle Physics" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        {isPhysicsPaused ? <Play size={14} className="text-amber-400" /> : <Pause size={14} />}
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={fetchGraph} title="Refresh" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
                    </button>
                </div>
            </div>

            {/* Selected Node Quick Info Toast */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl max-w-sm flex items-start justify-between gap-4 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                                {selectedNode.type || selectedNode.group || 'Node'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{selectedNode.domain || 'Unified'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{selectedNode.label || selectedNode.name || selectedNode.id}</h4>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* Canvas View */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center">
                {loading && (
                    <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
                        <RefreshCw size={32} className="animate-spin text-primary mb-3" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Mapping Mesh Architecture...</span>
                    </div>
                )}
                <ForceGraph2D
                    ref={fgRef}
                    graphData={filteredGraphData}
                    width={dimensions.width}
                    height={dimensions.height}
                    nodeLabel="label"
                    nodeRelSize={6}
                    d3VelocityDecay={0.35}
                    d3AlphaDecay={0.02}
                    onNodeClick={handleNodeClick}
                    onNodeHover={(node: any) => setHoverNode(node || null)}
                    cooldownTicks={120}
                    minZoom={0.2}
                    maxZoom={4.5}
                    linkDirectionalArrowLength={(link: any) => link.type === 'relationship' ? 5 : 0}
                    linkDirectionalArrowRelPos={0.92}
                    linkColor={(link: any) => {
                        const isHighlighted = highlightLinks.has(link);
                        const isDimmed = (hoverNode || selectedNode) && !isHighlighted;
                        if (isDimmed) return 'rgba(255,255,255,0.03)';
                        if (link.type === 'cross_domain') return isHighlighted ? '#fbbf24' : 'rgba(245, 158, 11, 0.7)';
                        if (link.type === 'relationship') return isHighlighted ? '#22d3ee' : 'rgba(6, 182, 212, 0.5)';
                        return isHighlighted ? '#818cf8' : 'rgba(99, 102, 241, 0.35)';
                    }}
                    linkWidth={(link: any) => {
                        const isHighlighted = highlightLinks.has(link);
                        return isHighlighted ? 2.5 : 1.2;
                    }}
                    linkDirectionalParticles={(link: any) => {
                        const isHighlighted = highlightLinks.has(link);
                        return isHighlighted ? 4 : 2;
                    }}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleColor={() => '#60a5fa'}
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const isSelected = selectedNode && selectedNode.id === node.id;
                        const isHovered = hoverNode && hoverNode.id === node.id;
                        const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
                        const isDimmed = !isHighlighted;

                        if (node.type === 'source' || node.group === 'source' || !node.sourceId) {
                            drawSourceNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
                        } else {
                            drawEntityNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
                        }
                    }}
                />
            </div>
        </div>
    );
}
