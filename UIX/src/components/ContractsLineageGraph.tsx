import React, { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Shield } from 'lucide-react';

interface Node {
  id: string;
  type: 'table' | 'product' | 'contract' | 'subscriber';
  label: string;
  domain: string;
}

interface Edge {
  source: string;
  target: string;
}

export const ContractsLineageGraph = ({ products = [], contracts = [] }: { products?: any[], contracts?: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
              if (entry.contentRect.width === 0) continue;
              setDimensions({
                  width: entry.contentRect.width,
                  height: 500
              });
          }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, []);

  // Build Graph Data
  const nodes: Node[] = [];
  const links: Edge[] = [];

  // Track added nodes to avoid duplicates
  const nodeIds = new Set<string>();

  const addNode = (node: Node) => {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  };

  // 1. Add Products
  products.forEach(p => {
    addNode({
      id: p.id,
      type: 'product',
      label: p.name,
      domain: p.domain || 'General'
    });

    // Add Tables
    if (p.tables && Array.isArray(p.tables)) {
      p.tables.forEach((t: string) => {
        const tableId = `table-${t}`;
        addNode({
          id: tableId,
          type: 'table',
          label: t,
          domain: p.domain || 'General'
        });
        links.push({ source: tableId, target: p.id });
      });
    }

    // Add Component Links for Composites
    if (p.composite && p.components && Array.isArray(p.components)) {
      p.components.forEach((comp: any) => {
        if (comp.product) {
          links.push({ source: comp.product, target: p.id });
        }
      });
    }
  });

  // 2. Add Contracts & Subscribers
  contracts.forEach(c => {
    addNode({
      id: c.id,
      type: 'contract',
      label: `${c.product} Contract`,
      domain: c.domain || 'General'
    });

    if (c.subscriber) {
      const subId = `sub-${c.subscriber}`;
      addNode({
        id: subId,
        type: 'subscriber',
        label: c.subscriber,
        domain: c.domain || 'General'
      });
      links.push({ source: c.id, target: subId });
    }

    // Link Product to Contract
    const matchedProduct = products.find(p => 
      p.name.toLowerCase().includes(c.product.toLowerCase()) || 
      c.product.toLowerCase().includes(p.name.toLowerCase()) ||
      p.id === c.product
    );

    if (matchedProduct) {
      links.push({ source: matchedProduct.id, target: c.id });
    }
  });

  const graphData = { nodes, links };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'table': return '#64748b'; // slate-500
      case 'product': return '#3b82f6'; // blue-500
      case 'contract': return '#10b981'; // emerald-500
      case 'subscriber': return '#a855f7'; // purple-500
      default: return '#94a3b8';
    }
  };

  return (
    <div ref={containerRef} className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/10 h-[600px] relative overflow-hidden isolate transform-gpu flex flex-col pt-16 p-6">
      <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
        <Shield size={12} className="text-primary animate-pulse" />
        Contracts & Lineage
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex gap-4 bg-slate-100 dark:bg-black/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500"/> Tables</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"/> Products</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Contracts</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"/> Subscribers</div>
      </div>

      <div className="flex-1 relative">
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={500}
          nodeLabel="label"
          nodeRelSize={6}
          linkColor={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const sourceNode = nodes.find((n: any) => n.id === sourceId);
            const domain = sourceNode?.domain || 'General';
            const colors: { [key: string]: string } = {
              Finance: '#f97316',
              Sales: '#3b82f6',
              Unified: '#a855f7',
              General: 'rgba(255,255,255,0.15)'
            };
            return colors[domain] || 'rgba(255,255,255,0.15)';
          }}
          linkWidth={1.5}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.4}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label;
              const color = getNodeColor(node.type);
              const type = node.type || 'entity';
              
              const nodeSize = 50 / globalScale;

              // 1. Squared Transparent Background
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

              // 2. Border Colored by Type
              ctx.strokeStyle = color;
              ctx.lineWidth = 2 / globalScale;
              ctx.strokeRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

              // 3. Name inside the square
              const fontSize = Math.max(6, 10 / globalScale);
              ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#ffffff';

              let displayText = label;
              const textWidth = ctx.measureText(label).width;
              if (textWidth > nodeSize - 4) {
                  displayText = label.substring(0, Math.floor((nodeSize / textWidth) * label.length) - 3) + '...';
              }
              
              ctx.fillText(displayText, node.x, node.y - (nodeSize / 6));

              // 4. Type Label
              const typeFontSize = Math.max(5, 8 / globalScale);
              ctx.font = `${typeFontSize}px Inter, system-ui, sans-serif`;
              ctx.fillStyle = '#94a3b8';
              ctx.fillText(type.toUpperCase(), node.x, node.y + (nodeSize / 4));
          }}
        />
      </div>
    </div>
  );
};
