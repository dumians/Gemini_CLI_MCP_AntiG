import { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { API_BASE_URL } from '../config';

export function GraphView({ data: initialData }: { data?: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [graphData, setGraphData] = useState<any>(initialData || { nodes: [], links: [] });
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) return;

        const fetchGraph = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/catalog/graph`);
                const data = await res.json();
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
        <div ref={containerRef} className="glass rounded-3xl overflow-hidden border-white/10 h-[400px] relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Mesh Topology
            </div>
            <ForceGraph2D
                graphData={graphData}
                width={containerRef.current?.clientWidth || 900}
                height={400}
                nodeLabel="label"
                nodeRelSize={1}
                linkColor={() => 'rgba(255,255,255,0.08)'}
                linkDirectionalParticles={1}
                linkDirectionalParticleSpeed={0.005}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    const fontSize = 11 / globalScale;
                    ctx.font = `${fontSize}px Inter`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4) as [number, number];

                    // Node Circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val / globalScale + 2, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color || '#4f46e5';
                    ctx.fill();
                    ctx.shadowColor = node.color || '#4f46e5';
                    ctx.shadowBlur = 10 / globalScale;

                    // Label Background
                    ctx.fillStyle = 'rgba(10, 10, 11, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (node.val / globalScale + 4), ...bckgDimensions);

                    // Label Text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowBlur = 0;
                    ctx.fillText(label, node.x, node.y + (node.val / globalScale + 4) + bckgDimensions[1] / 2);
                }}
            />
        </div>
    );
}

