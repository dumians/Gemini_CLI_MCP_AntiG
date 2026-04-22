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
    const [dimensions, setDimensions] = useState({ width: 900, height: 400 });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width === 0) continue;
                setDimensions({
                    width: entry.contentRect.width,
                    height: 400
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
        return <div className="h-[400px] flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px] font-bold">Mapping Inventory Assets...</div>;
    }

    return (
        <div ref={containerRef} className="bg-slate-900/40 rounded-3xl border border-white/10 h-[400px] relative overflow-hidden isolate transform-gpu">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                <Database size={12} className="text-primary" />
                Asset Trace
            </div>

            <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={400}
                nodeLabel="label"
                nodeRelSize={6}
                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    const domain = node.properties?.domain || 'Unified';
                    const color = domainColors[domain] || '#6366f1';
                    
                    const fontSize = 11 / globalScale;
                    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                    const textWidth = ctx.measureText(label).width;
                    const padding = 6 / globalScale;
                    const bckgDimensions = [textWidth + padding * 2, fontSize + padding];

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();

                    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (12 / globalScale), ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, node.y + (12 / globalScale) + bckgDimensions[1] / 2);
                }}
            />
        </div>
    );
}
