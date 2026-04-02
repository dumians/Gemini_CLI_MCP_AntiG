import { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../utils/api';

export function GraphView({ data: initialData }: { data?: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [graphData, setGraphData] = useState<any>(initialData || { nodes: [], links: [] });
    const [loading, setLoading] = useState(!initialData);
    const [dimensions, setDimensions] = useState({ width: 900, height: 400 });

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

    useEffect(() => {
        if (initialData) return;

        const fetchGraph = async () => {
            try {
                const data = await api.get('/api/catalog/graph');
                setGraphData(data);
            } catch (e) {
                console.error("Failed to fetch graph data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
        const interval = setInterval(fetchGraph, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [initialData]);

    if (loading) {
        return <div className="h-[400px] flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px] font-bold">Mapping Mesh Topology...</div>;
    }

    return (
        <div ref={containerRef} className="bg-slate-900/40 rounded-3xl border border-white/10 h-[400px] relative overflow-hidden isolate transform-gpu">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Mesh Topology
            </div>
            <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={400}
                nodeLabel="label"
                nodeRelSize={2}
                linkColor={() => 'rgba(255,255,255,0.12)'}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.004}
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.2}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4) as [number, number];

                    // Node Circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color || '#4f46e5';
                    ctx.fill();
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1 / globalScale;
                    ctx.stroke();

                    // Label Background
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (12 / globalScale), ...bckgDimensions);

                    // Label Text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, node.y + (12 / globalScale) + bckgDimensions[1] / 2);
                }}
            />
        </div>
    );
}

