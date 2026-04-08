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
                    const domain = node.properties?.domain || 'Unified';
                    const color = domainColors[domain] || '#6366f1';
                    
                    const fontSize = 11 / globalScale;
                    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                    const textWidth = ctx.measureText(label).width;
                    const padding = 6 / globalScale;
                    const bckgDimensions = [textWidth + padding * 2, fontSize + padding];

                    // Node Circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / globalScale;
                    ctx.stroke();

                    // Label Background (Pill)
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                    const rx = node.x - bckgDimensions[0] / 2;
                    const ry = node.y + (12 / globalScale);
                    const rw = bckgDimensions[0];
                    const rh = bckgDimensions[1];
                    const radius = rh / 2;

                    ctx.beginPath();
                    ctx.moveTo(rx + radius, ry);
                    ctx.lineTo(rx + rw - radius, ry);
                    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
                    ctx.lineTo(rx + rw, ry + rh - radius);
                    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
                    ctx.lineTo(rx + radius, ry + rh);
                    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
                    ctx.lineTo(rx, ry + radius);
                    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
                    ctx.closePath();
                    ctx.fill();

                    // Label Text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, ry + rh / 2);
                }}
            />
        </div>
    );
}

