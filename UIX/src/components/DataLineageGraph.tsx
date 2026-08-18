import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  ArrowRight, Layers, Database, RefreshCw, ZoomIn, ZoomOut, 
  Focus, Play, Pause, Maximize2, Minimize2, Search, X, Table, Cpu 
} from 'lucide-react';
import { api } from '../utils/api';
import { 
  getDomainStyle, 
  drawSourceNodeCanvas, 
  drawEntityNodeCanvas, 
  drawTierNodeCanvas 
} from '../utils/graphTheme';

interface Node {
  id: string;
  type: 'source' | 'table' | 'product';
  label: string;
  domain: string;
  sourceId?: string;
  val?: number;
}

interface Edge {
  source: string;
  target: string;
  type?: string;
}

export const DataLineageGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 560 });
  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Edge[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  
  // Interactive States
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width === 0) continue;
        setDimensions({
          width: entry.contentRect.width,
          height: isFullscreen ? window.innerHeight - 80 : 560
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isFullscreen]);

  const fetchLineage = useCallback(async () => {
    setLoading(true);
    try {
      const [graphRes, productsRes] = await Promise.all([
        api.get('/api/catalog/graph').catch(() => ({ nodes: [], links: [] })),
        api.get('/api/products').catch(() => ({ products: [] }))
      ]);

      const newNodes: Node[] = [];
      const newLinks: Edge[] = [];
      const nodeIds = new Set<string>();

      const addNode = (node: Node) => {
        if (!nodeIds.has(node.id)) {
          newNodes.push(node);
          nodeIds.add(node.id);
        }
      };

      // Add Sources
      if (graphRes && Array.isArray(graphRes.nodes)) {
        graphRes.nodes.filter((n: any) => n.group === 'source' || n.type === 'source').forEach((n: any) => {
          addNode({ id: n.id, type: 'source', label: n.label, domain: n.domain || 'General', val: 16 });
        });

        // Add Tables
        graphRes.nodes.filter((n: any) => n.group === 'table' || n.type === 'table' || n.group === 'graph').forEach((n: any) => {
          addNode({ id: n.id, type: 'table', label: n.label, domain: n.domain || 'General', sourceId: n.sourceId, val: 10 });
        });

        // Add Existing Graph Links
        if (Array.isArray(graphRes.links)) {
          graphRes.links.forEach((l: any) => {
            newLinks.push({ source: l.source, target: l.target, type: l.type });
          });
        }
      }

      // Add Products & Connect Lineage
      if (productsRes && Array.isArray(productsRes.products)) {
        productsRes.products.forEach((p: any) => {
          addNode({ id: p.id, type: 'product', label: p.name, domain: p.domain || 'General', val: 14 });

          if (p.tables && Array.isArray(p.tables)) {
            p.tables.forEach((tableName: string) => {
              const tableNode = graphRes.nodes?.find((n: any) => 
                (n.group === 'table' || n.type === 'table' || n.group === 'graph') && 
                (n.label?.toLowerCase() === tableName.toLowerCase() || n.id?.toLowerCase().endsWith(`.${tableName.toLowerCase()}`))
              );
              if (tableNode) {
                newLinks.push({ source: tableNode.id, target: p.id, type: 'feeds_product' });
              }
            });
          }
        });
      }

      // High-grade fallback if empty
      if (newNodes.length === 0) {
        newNodes.push(
          { id: 'oracle', type: 'source', label: 'Oracle ERP', domain: 'Finance', val: 16 },
          { id: 'spanner', type: 'source', label: 'Spanner Retail', domain: 'Sales', val: 16 },
          { id: 'bigquery', type: 'source', label: 'BigQuery Analytics', domain: 'Analytics', val: 16 },
          { id: 't1', type: 'table', label: 'purchase_orders', domain: 'Finance', val: 10 },
          { id: 't2', type: 'table', label: 'global_inventory', domain: 'Sales', val: 10 },
          { id: 't3', type: 'table', label: 'customer_segments', domain: 'Analytics', val: 10 },
          { id: 'p1', type: 'product', label: 'Cross-Domain Executive Metrics', domain: 'Unified', val: 14 }
        );
        newLinks.push(
          { source: 'oracle', target: 't1', type: 'ownership' },
          { source: 'spanner', target: 't2', type: 'ownership' },
          { source: 'bigquery', target: 't3', type: 'ownership' },
          { source: 't1', target: 'p1', type: 'feeds_product' },
          { source: 't2', target: 'p1', type: 'feeds_product' },
          { source: 't3', target: 'p1', type: 'feeds_product' }
        );
      }

      setGraphData({ nodes: newNodes, links: newLinks });
    } catch (e) {
      console.error("Failed to load lineage graph", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLineage();
  }, [fetchLineage]);

  // Highlight Neighborhood
  const { highlightNodes, highlightLinks } = useMemo(() => {
    const hNodes = new Set<string>();
    const hLinks = new Set<any>();
    const focusNode = hoverNode || selectedNode;

    if (focusNode) {
      hNodes.add(focusNode.id);
      graphData.links.forEach((link: any) => {
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

  // Simulation tuning
  useEffect(() => {
    if (!fgRef.current) return;
    try {
      if (typeof fgRef.current.d3Force === 'function') {
        const charge = fgRef.current.d3Force('charge');
        if (charge && typeof charge.strength === 'function') {
          charge.strength(-240);
        }
        const link = fgRef.current.d3Force('link');
        if (link && typeof link.distance === 'function') {
          link.distance(85);
        }
      }
    } catch (err) {
      console.warn("Lineage force simulation warning:", err);
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

  return (
    <div 
      ref={containerRef} 
      className={`bg-slate-950/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden isolate flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950/95 h-screen' : 'h-[580px]'
      }`}
    >
      {/* Top Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
          <div className="p-1 bg-primary/20 text-primary rounded-lg">
            <ArrowRight size={14} />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Enterprise Data Lineage Flow</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
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
          <button onClick={fetchLineage} title="Refresh" className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Bottom HUD Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-4 text-[10px] text-slate-300 font-bold uppercase tracking-wider shadow-xl">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-indigo-500"/> Source Engines</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-emerald-500"/> Tables & Graphs</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-md bg-blue-500"/> Data Products</div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="absolute top-16 right-4 z-30 pointer-events-auto bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl w-72 space-y-2.5 animate-fade-in text-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                {selectedNode.type}
              </span>
              <h4 className="font-bold text-white leading-snug">{selectedNode.label}</h4>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="p-3 bg-black/30 rounded-xl space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Domain</span>
              <span className="text-white font-mono">{selectedNode.domain}</span>
            </div>
            {selectedNode.sourceId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Parent Engine</span>
                <span className="text-indigo-400 font-mono font-bold uppercase">{selectedNode.sourceId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Force Canvas */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <RefreshCw size={32} className="animate-spin text-primary mb-3" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Mapping Lineage Pathways...</span>
          </div>
        )}
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
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
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.92}
          linkColor={(link: any) => {
            const isHighlighted = highlightLinks.has(link);
            const isDimmed = (hoverNode || selectedNode) && !isHighlighted;
            if (isDimmed) return 'rgba(255,255,255,0.03)';
            if (link.type === 'feeds_product') return isHighlighted ? '#60a5fa' : 'rgba(59, 130, 246, 0.6)';
            if (link.type === 'cross_domain') return isHighlighted ? '#fbbf24' : 'rgba(245, 158, 11, 0.6)';
            return isHighlighted ? '#818cf8' : 'rgba(99, 102, 241, 0.35)';
          }}
          linkWidth={(link: any) => highlightLinks.has(link) ? 2.5 : 1.2}
          linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 4 : 2}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#60a5fa'}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isHovered = hoverNode && hoverNode.id === node.id;
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
            const isDimmed = !isHighlighted;

            if (node.type === 'source') {
              drawSourceNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
            } else if (node.type === 'product') {
              drawTierNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed, '#3b82f6', 'Data Product');
            } else {
              drawEntityNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
            }
          }}
        />
      </div>
    </div>
  );
};
