import React, { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Database, Server, Package, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  type: 'source' | 'table' | 'product';
  label: string;
  domain: string;
}

interface Edge {
  source: string;
  target: string;
}

export const DataLineageGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 400 });

  const nodes: Node[] = [
    { id: 's1', type: 'source', label: 'BigQuery DB', domain: 'Sales' },
    { id: 's2', type: 'source', label: 'Spanner CRM', domain: 'Marketing' },
    { id: 't1', type: 'table', label: 'Cleaned Transactions', domain: 'Sales' },
    { id: 't2', type: 'table', label: 'Customer Profiles', domain: 'Marketing' },
    { id: 'p1', type: 'product', label: 'Sales Forecast Product', domain: 'Sales' },
  ];

  const links: Edge[] = [
    { source: 's1', target: 't1' },
    { source: 's2', target: 't2' },
    { source: 't1', target: 'p1' },
    { source: 't2', target: 'p1' },
  ];

  const graphData = { nodes, links };

  useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
              if (entry.contentRect.width === 0) continue; // Ignore 0 width during component mount
              setDimensions({
                  width: entry.contentRect.width,
                  height: 400
              });
          }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'source': return '#3b82f6'; // blue-500
      case 'table': return '#a855f7'; // purple-500
      case 'product': return '#10b981'; // emerald-500
      default: return '#64748b'; // slate-500
    }
  };

  return (
    <div ref={containerRef} className="glass rounded-2xl border-slate-700/50 p-6 h-[500px] relative overflow-hidden bg-slate-900/50 w-full">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <ArrowRight size={20} className="text-primary" /> Data Lineage Graph
      </h3>

      <div className="absolute inset-0 p-6 pt-16">
        <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={400}
            nodeLabel="label"
            nodeRelSize={4}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4) as [number, number];

                // Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI, false);
                ctx.fillStyle = getNodeColor(node.type);
                ctx.fill();
                
                // Outer ring for "product"
                if (node.type === 'product') {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 12 / globalScale, 0, 2 * Math.PI, false);
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 1.5 / globalScale;
                    ctx.stroke();
                }

                // Label Background
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // slate-900
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (12 / globalScale), ...bckgDimensions);

                // Label Text
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(label, node.x, node.y + (12 / globalScale) + bckgDimensions[1] / 2);
                
                // Type Label (Small)
                ctx.font = `${8 / globalScale}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = '#94a3b8'; // slate-400
                ctx.fillText(node.type.toUpperCase(), node.x, node.y + (12 / globalScale) + bckgDimensions[1] + (6 / globalScale));
            }}
        />
      </div>
    </div>
  );
};
