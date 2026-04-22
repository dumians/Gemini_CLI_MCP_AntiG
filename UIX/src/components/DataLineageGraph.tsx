import React, { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

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
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Edge[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
              if (entry.contentRect.width === 0) continue;
              setDimensions({
                  width: entry.contentRect.width,
                  height: 600
              });
          }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
      const fetchLineage = async () => {
          try {
              const [graphRes, productsRes] = await Promise.all([
                  api.get('/api/catalog/graph'),
                  api.get('/api/products')
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
                  graphRes.nodes.filter((n: any) => n.group === 'source').forEach((n: any) => {
                      addNode({ id: n.id, type: 'source', label: n.label, domain: n.domain || 'General' });
                  });

                  // Add Tables
                  graphRes.nodes.filter((n: any) => n.group === 'table' || n.group === 'graph').forEach((n: any) => {
                      addNode({ id: n.id, type: 'table', label: n.label, domain: n.domain || 'General' });
                  });

                  // Add existing links
                  if (Array.isArray(graphRes.links)) {
                      graphRes.links.forEach((l: any) => {
                          newLinks.push({ source: l.source, target: l.target });
                      });
                  }
              }

              // Add Products
              if (productsRes && Array.isArray(productsRes.products)) {
                  productsRes.products.forEach((p: any) => {
                      addNode({ id: p.id, type: 'product', label: p.name, domain: p.domain || 'General' });

                      // Link Tables to Product
                      if (p.tables && Array.isArray(p.tables)) {
                          p.tables.forEach((tableName: string) => {
                              const tableNode = graphRes.nodes?.find((n: any) => 
                                  (n.group === 'table' || n.group === 'graph') && 
                                  (n.label.toLowerCase() === tableName.toLowerCase() || n.id.toLowerCase().endsWith(`.${tableName.toLowerCase()}`))
                              );
                              if (tableNode) {
                                  newLinks.push({ source: tableNode.id, target: p.id });
                              }
                          });
                      }
                  });
              }

              // Fallback if empty
              if (newNodes.length === 0) {
                  newNodes.push(
                    { id: 's1', type: 'source', label: 'BigQuery DB', domain: 'Sales' },
                    { id: 's2', type: 'source', label: 'Spanner CRM', domain: 'Marketing' },
                    { id: 't1', type: 'table', label: 'Cleaned Transactions', domain: 'Sales' },
                    { id: 't2', type: 'table', label: 'Customer Profiles', domain: 'Marketing' },
                    { id: 'p1', type: 'product', label: 'Sales Forecast Product', domain: 'Sales' }
                  );
                  newLinks.push(
                    { source: 's1', target: 't1' },
                    { source: 's2', target: 't2' },
                    { source: 't1', target: 'p1' },
                    { source: 't2', target: 'p1' }
                  );
              }

              setGraphData({ nodes: newNodes, links: newLinks });
          } catch (e) {
              console.error("Failed to load lineage graph", e);
          } finally {
              setLoading(false);
          }
      };

      fetchLineage();
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'source': return '#3b82f6'; // blue-500
      case 'table': return '#a855f7'; // purple-500
      case 'product': return '#10b981'; // emerald-500
      default: return '#64748b'; // slate-500
    }
  };

  if (loading) {
      return <div className="h-[650px] flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px] font-bold bg-slate-900/50 rounded-2xl border border-slate-700/50">Mapping Lineage...</div>;
  }

  return (
    <div ref={containerRef} className="glass rounded-2xl border-slate-700/50 p-6 h-[650px] relative overflow-hidden bg-slate-900/50 w-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <ArrowRight size={20} className="text-primary" /> Data Lineage Graph
      </h3>

      <div className="flex-1 relative">
        <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={580}
            nodeLabel={(node: any) => `
              <div style="background: #0f172a; color: #fff; padding: 8px; border-radius: 8px; border: 1px solid #334155; font-size: 11px; font-family: monospace;">
                <div style="font-weight: bold; color: #3b82f6; margin-bottom: 4px;">${node.label}</div>
                <div>Type: ${node.type.toUpperCase()}</div>
                <div>Domain: ${node.domain}</div>
              </div>
            `}
            nodeRelSize={4}
            linkColor={(link: any) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
              const domain = sourceNode?.domain || 'General';
              const colors: { [key: string]: string } = {
                Finance: '#f97316',
                Sales: '#3b82f6',
                Unified: '#a855f7',
                General: 'rgba(255,255,255,0.2)'
              };
              return colors[domain] || 'rgba(255,255,255,0.2)';
            }}
            linkWidth={(link: any) => link.type === 'source' ? 2.5 : 1}
            linkDirectionalParticles={(link: any) => link.type === 'source' ? 4 : 0}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label;
                const fontSize = Math.max(6, 10 / globalScale);
                ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                const color = getNodeColor(node.type);
                
                const nodeSize = 50 / globalScale;

                // 1. Squared Transparent Background
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

                // 2. Border Colored by Type
                ctx.strokeStyle = color;
                ctx.lineWidth = 2 / globalScale;
                ctx.strokeRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

                // 3. Name inside the square
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
                ctx.fillText(node.type.toUpperCase(), node.x, node.y + (nodeSize / 4));
            }}
        />
      </div>
    </div>
  );
};
