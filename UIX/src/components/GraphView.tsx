import { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../utils/api';

const domainColors: { [key: string]: string } = {
    Finance: '#ef4444',
    HR: '#10b981',
    Sales: '#3b82f6',
    Logistics: '#f59e0b',
    Unified: '#6366f1'
};

export function GraphView({ data: initialData }: { data?: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [graphData, setGraphData] = useState<any>(initialData || { nodes: [], links: [] });
    const [loading, setLoading] = useState(!initialData);
    const [dimensions, setDimensions] = useState({ width: 900, height: 500 });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width === 0) continue; // Ignore 0 width during component mount
                setDimensions({
                    width: entry.contentRect.width,
                    height: 500
                });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (initialData) return;

        const fetchGraph = async () => {
            try {
                const res = await api.get('/api/catalog/graph');
                // Ensure we have highly reactive visual connections representing our live topology
                const defaultNodes = [
                    { id: 'gateway', label: 'One MCP Gateway', properties: { domain: 'Unified' } },
                    { id: 'orchestrator', label: 'Master Orchestrator', properties: { domain: 'Unified' } },
                    { id: 'oracle', label: 'Oracle ERP', properties: { domain: 'Finance' } },
                    { id: 'spanner', label: 'Spanner Retail', properties: { domain: 'Sales' } },
                    { id: 'bigquery', label: 'BigQuery Analytics', properties: { domain: 'Unified' } },
                    { id: 'alloy', label: 'AlloyDB CRM', properties: { domain: 'Sales' } },
                    { id: 'warehouse', label: 'Warehouse Spatial (Oracle)', properties: { domain: 'Logistics' } },
                    { id: 'sku500', label: 'SKU-500 Battery Path', properties: { domain: 'Logistics' } }
                ];
                
                const defaultLinks = [
                    { source: 'gateway', target: 'orchestrator' },
                    { source: 'orchestrator', target: 'oracle' },
                    { source: 'orchestrator', target: 'spanner' },
                    { source: 'orchestrator', target: 'bigquery' },
                    { source: 'orchestrator', target: 'alloy' },
                    { source: 'orchestrator', target: 'warehouse' },
                    { source: 'warehouse', target: 'sku500' },
                    { source: 'spanner', target: 'bigquery' }
                ];

                if (!res || !res.nodes || res.nodes.length === 0) {
                    setGraphData((prev: any) => {
                        const mergedNodes = defaultNodes.map((node: any) => {
                            const prevNode = prev.nodes.find((n: any) => n.id === node.id);
                            return prevNode ? { ...node, x: prevNode.x, y: prevNode.y, vx: prevNode.vx, vy: prevNode.vy, fx: prevNode.fx, fy: prevNode.fy } : node;
                        });
                        return { nodes: mergedNodes, links: defaultLinks };
                    });
                } else {
                    setGraphData((prev: any) => {
                        const mergedNodes = res.nodes.map((node: any) => {
                            const prevNode = prev.nodes.find((n: any) => n.id === node.id);
                            return prevNode ? { ...node, x: prevNode.x, y: prevNode.y, vx: prevNode.vx, vy: prevNode.vy, fx: prevNode.fx, fy: prevNode.fy } : node;
                        });
                        return { nodes: mergedNodes, links: res.links };
                    });
                }
            } catch (e) {
                console.error("Failed to fetch graph data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
        const interval = setInterval(fetchGraph, 10000); // Refresh closer to live ticks
        return () => clearInterval(interval);
    }, [initialData]);

    if (loading) {
        return <div className="h-[600px] flex items-center justify-center text-slate-500 uppercase tracking-widest text-[10px] font-bold bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">Mapping Mesh Topology...</div>;
    }

    return (
        <div ref={containerRef} className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/10 h-[600px] relative overflow-hidden isolate transform-gpu flex flex-col p-6 pt-16">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Architecture Telemetry
            </div>
            <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={500}
                nodeLabel="label"
                nodeRelSize={6}
                linkColor={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
                  const domain = sourceNode?.properties?.domain || sourceNode?.domain || 'Unified';
                  const colors: { [key: string]: string } = {
                    Finance: '#f97316',
                    Sales: '#3b82f6',
                    Unified: '#a855f7',
                    HR: '#10b981',
                    Logistics: '#f59e0b'
                  };
                  return colors[domain] || 'rgba(255,255,255,0.15)';
                }}
                linkWidth={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const isPhysical = sourceId?.includes('mcp') || sourceId?.includes('ora') || sourceId?.includes('span');
                  return isPhysical ? 2.5 : 1;
                }}
                linkDirectionalParticles={(link: any) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const isPhysical = sourceId?.includes('mcp') || sourceId?.includes('ora') || sourceId?.includes('span');
                  return isPhysical ? 4 : 0;
                }}
                linkDirectionalParticleSpeed={0.006}
                linkDirectionalParticleWidth={2}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.4}
                cooldownTicks={100}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    let displayName = label;
                    if (label && label.includes('.')) {
                        displayName = label.split('.').pop() || label;
                    }
                    const domain = node.properties?.domain || node.domain || 'Unified';
                    const type = node.type || node.group || 'entity';
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
    );
}

