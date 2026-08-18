import React, { useRef, useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Shield, CheckCircle2, Clock, Lock, ZoomIn, ZoomOut, Focus, 
  Play, Pause, Maximize2, Minimize2, Search, X, ArrowRight, Table, Layers, FileText, User
} from 'lucide-react';
import { drawTierNodeCanvas } from '../utils/graphTheme';

interface Node {
  id: string;
  type: 'table' | 'product' | 'contract' | 'subscriber';
  label: string;
  domain: string;
  sla?: string;
  status?: string;
  privacy?: string;
  subscriber?: string;
  val?: number;
}

interface Edge {
  source: string;
  target: string;
  type?: string;
}

export const ContractsLineageGraph = ({ products = [], contracts = [] }: { products?: any[], contracts?: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
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
          height: isFullscreen ? window.innerHeight - 80 : 480
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isFullscreen]);

  // Build Multi-Tier Directed Graph Data
  const { nodes, links } = useMemo(() => {
    const nList: Node[] = [];
    const lList: Edge[] = [];
    const nodeIds = new Set<string>();

    const addNode = (node: Node) => {
      if (!nodeIds.has(node.id)) {
        nList.push(node);
        nodeIds.add(node.id);
      }
    };

    // 1. Add Products & Source Tables
    products.forEach(p => {
      addNode({
        id: p.id,
        type: 'product',
        label: p.name,
        domain: p.domain || 'General',
        val: 14
      });

      if (p.tables && Array.isArray(p.tables)) {
        p.tables.forEach((t: string) => {
          const tableId = `table-${t}`;
          addNode({
            id: tableId,
            type: 'table',
            label: t,
            domain: p.domain || 'General',
            val: 8
          });
          lList.push({ source: tableId, target: p.id, type: 'feeds_product' });
        });
      }

      if (p.composite && p.components && Array.isArray(p.components)) {
        p.components.forEach((comp: any) => {
          if (comp.product) {
            lList.push({ source: comp.product, target: p.id, type: 'composite' });
          }
        });
      }
    });

    // 2. Add Contracts & Consumers
    contracts.forEach(c => {
      addNode({
        id: c.id,
        type: 'contract',
        label: `${c.product} Contract`,
        domain: c.domain || 'General',
        sla: c.sla || '99.9% Uptime',
        status: c.status || 'Active',
        privacy: c.privacy || 'Standard',
        subscriber: c.subscriber,
        val: 12
      });

      if (c.subscriber) {
        const subId = `sub-${c.subscriber}`;
        addNode({
          id: subId,
          type: 'subscriber',
          label: c.subscriber,
          domain: c.domain || 'General',
          val: 10
        });
        lList.push({ source: c.id, target: subId, type: 'subscribes' });
      }

      const matchedProduct = products.find(p => 
        p.name.toLowerCase().includes(c.product.toLowerCase()) || 
        c.product.toLowerCase().includes(p.name.toLowerCase()) ||
        p.id === c.product
      );

      if (matchedProduct) {
        lList.push({ source: matchedProduct.id, target: c.id, type: 'governs' });
      }
    });

    return { nodes: nList, links: lList };
  }, [products, contracts]);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  // Neighborhood highlighting
  const { highlightNodes, highlightLinks } = useMemo(() => {
    const hNodes = new Set<string>();
    const hLinks = new Set<any>();
    const focusNode = hoverNode || selectedNode;

    if (focusNode) {
      hNodes.add(focusNode.id);
      links.forEach((link: any) => {
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
  }, [hoverNode, selectedNode, links]);

  // Force simulation tuning
  useEffect(() => {
    if (!fgRef.current) return;
    try {
      if (typeof fgRef.current.d3Force === 'function') {
        const charge = fgRef.current.d3Force('charge');
        if (charge && typeof charge.strength === 'function') {
          charge.strength(-200);
        }
        const link = fgRef.current.d3Force('link');
        if (link && typeof link.distance === 'function') {
          link.distance(75);
        }
      }
    } catch (err) {
      console.warn("Contracts force simulation warning:", err);
    }
  }, [graphData]);

  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 400);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 400);
  const handleFitView = () => fgRef.current?.zoomToFit(500, 50);

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

  const getTierInfo = (type: string) => {
    switch (type) {
      case 'table': return { color: '#64748b', title: 'Source Table' };
      case 'product': return { color: '#3b82f6', title: 'Data Product' };
      case 'contract': return { color: '#10b981', title: 'Data Contract' };
      case 'subscriber': return { color: '#a855f7', title: 'Subscriber' };
      default: return { color: '#94a3b8', title: 'Entity' };
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`bg-slate-950/80 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden isolate flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950/95 h-screen' : 'h-[500px]'
      }`}
    >
      {/* Top Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Shield size={14} />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Data Contracts & Lineage Flow</span>
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
        </div>
      </div>

      {/* Bottom HUD Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-4 text-[10px] text-slate-300 font-bold uppercase tracking-wider shadow-xl">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500"/> Tables</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"/> Products</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Contracts</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"/> Subscribers</div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="absolute top-16 right-4 z-30 pointer-events-auto bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl w-72 space-y-2.5 animate-fade-in text-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                selectedNode.type === 'contract' ? 'bg-emerald-500/20 text-emerald-400' :
                selectedNode.type === 'product' ? 'bg-blue-500/20 text-blue-400' :
                selectedNode.type === 'subscriber' ? 'bg-purple-500/20 text-purple-400' :
                'bg-slate-700 text-slate-300'
              }`}>
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
            {selectedNode.sla && (
              <div className="flex justify-between">
                <span className="text-slate-400">SLA Guarantee</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedNode.sla}</span>
              </div>
            )}
            {selectedNode.status && (
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-bold">{selectedNode.status}</span>
              </div>
            )}
            {selectedNode.privacy && (
              <div className="flex justify-between">
                <span className="text-slate-400">Privacy Scope</span>
                <span className="text-slate-200 font-mono">{selectedNode.privacy}</span>
              </div>
            )}
            {selectedNode.subscriber && (
              <div className="flex justify-between">
                <span className="text-slate-400">Consumer</span>
                <span className="text-purple-400 font-bold">{selectedNode.subscriber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Force Canvas */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center">
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
            if (link.type === 'governs') return isHighlighted ? '#34d399' : 'rgba(16, 185, 129, 0.6)';
            if (link.type === 'subscribes') return isHighlighted ? '#c084fc' : 'rgba(168, 85, 247, 0.6)';
            return isHighlighted ? '#60a5fa' : 'rgba(59, 130, 246, 0.35)';
          }}
          linkWidth={(link: any) => highlightLinks.has(link) ? 2.5 : 1.2}
          linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 4 : 2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#34d399'}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isHovered = hoverNode && hoverNode.id === node.id;
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
            const isDimmed = !isHighlighted;

            const tier = getTierInfo(node.type);
            drawTierNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed, tier.color, tier.title);
          }}
        />
      </div>
    </div>
  );
};
