import { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../utils/api';
import { Database } from 'lucide-react';

const domainColors: { [key: string]: string } = {
    Finance: '#f97316', // orange-500
    Sales: '#3b82f6', // blue-500
    Unified: '#a855f7' // purple-500
};

export function InventoryGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

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
        const fetchGraph = async () => {
            try {
                const res = await api.get('/api/catalog/graph');
                
                const defaultNodes = [
                    { id: 'oracle', type: 'source', label: 'Oracle ERP', properties: { domain: 'Finance' } },
                    { id: 'spanner', type: 'source', label: 'Spanner Retail', properties: { domain: 'Sales' } },
                    { id: 'bigquery', type: 'source', label: 'BigQuery Analytics', properties: { domain: 'Unified' } },
                    
                    { id: 'suppliers', type: 'table', label: 'Suppliers', properties: { domain: 'Finance' } },
                    { id: 'purchase_orders', type: 'table', label: 'Purchase Orders', properties: { domain: 'Finance' } },
                    
                    { id: 'global_inventory', type: 'table', label: 'Global Inventory', properties: { domain: 'Sales' } },
                    { id: 'stores', type: 'table', label: 'Stores', properties: { domain: 'Sales' } },
                    
                    { id: 'customer_segments', type: 'table', label: 'Customer Segments', properties: { domain: 'Unified' } },
                    { id: 'sales_forecasting', type: 'table', label: 'Sales Forecasting', properties: { domain: 'Unified' } }
                ];

                const defaultLinks = [
                    { source: 'oracle', target: 'suppliers' },
                    { source: 'oracle', target: 'purchase_orders' },
                    { source: 'spanner', target: 'global_inventory' },
                    { source: 'spanner', target: 'stores' },
                    { source: 'bigquery', target: 'customer_segments' },
                    { source: 'bigquery', target: 'sales_forecasting' },
                    
                    { source: 'suppliers', target: 'global_inventory', label: 'supplies' },
                    { source: 'global_inventory', target: 'sales_forecasting', label: 'forecasts' }
                ];

                if (!res || !res.nodes || res.nodes.length === 0) {
                    setGraphData({ nodes: defaultNodes, links: defaultLinks });
                } else {
                    // Filter for inventory relevant nodes or map properly
                    const mappedNodes = res.nodes.map((n: any) => ({
                        id: n.id,
                        type: n.group === 'source' ? 'source' : 'table',
                        label: n.label,
                        properties: { domain: n.id.includes('ora') ? 'Finance' : n.id.includes('span') ? 'Sales' : 'Unified' }
                    }));
                    setGraphData({ nodes: mappedNodes, links: res.links });
                }
            } catch (e) {
                console.error("Failed to load graph", e);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, []);

    if (loading) {
        return <div className="h-[520px] flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px] font-bold bg-slate-900/40 rounded-3xl border border-white/10">Mapping Inventory Assets...</div>;
    }

    return (
        <div ref={containerRef} className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/10 h-[600px] relative overflow-hidden isolate transform-gpu flex flex-col pt-16 p-6">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
                <Database size={12} className="text-primary" />
                Asset Trace
            </div>

            <div className="flex-1 relative">

            <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={520}
                nodeLabel="label"
                nodeRelSize={6}
                linkColor={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
                  const domain = sourceNode?.properties?.domain || sourceNode?.domain || 'Unified';
                  const colors: { [key: string]: string } = {
                    Finance: '#f97316',
                    Sales: '#3b82f6',
                    Unified: '#a855f7'
                  };
                  return colors[domain] || 'rgba(255,255,255,0.15)';
                }}
                linkWidth={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const isPhysical = sourceId === 'oracle' || sourceId === 'spanner' || sourceId === 'bigquery';
                  return isPhysical ? 2.5 : 1;
                }}
                linkDirectionalParticles={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const isPhysical = sourceId === 'oracle' || sourceId === 'spanner' || sourceId === 'bigquery';
                  return isPhysical ? 4 : 0;
                }}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    let displayName = label;
                    if (label && label.includes('.')) {
                        displayName = label.split('.').pop() || label;
                    }
                    const domain = node.properties?.domain || node.domain || 'Unified';
                    const type = node.type || 'entity';
                    const color = domainColors[domain] || '#6366f1';
                    
                    const nodeSize = 50 / globalScale;

                    // 1. Squared Transparent Background
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    ctx.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

                    // 2. Border Colored by Domain
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 / globalScale;
                    ctx.strokeRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);

                    // 3. Name inside the square
                    const fontSize = Math.max(6, 10 / globalScale);
                    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';

                    let displayText = displayName;
                    const textWidth = ctx.measureText(displayName).width;
                    if (textWidth > nodeSize - 4) {
                        displayText = displayName.substring(0, Math.floor((nodeSize / textWidth) * displayName.length) - 3) + '...';
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
}
