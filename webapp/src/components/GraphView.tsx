import { useRef } from 'react';
import { ForceGraph2D } from 'react-force-graph';

export function GraphView({ data }: { data: any }) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Sample graph data if none provided
    const graphData = data || {
        nodes: [
            { id: 'User', group: 1, label: 'User Query' },
            { id: 'Orchestrator', group: 2, label: 'Master Orchestrator' },
            { id: 'Financial', group: 3, label: 'Financial Agent' },
            { id: 'Retail', group: 3, label: 'Retail Agent' },
            { id: 'Analytics', group: 3, label: 'Analytics Agent' },
            { id: 'Oracle', group: 4, label: 'Oracle DB' },
            { id: 'Spanner', group: 4, label: 'Spanner' },
            { id: 'BigQuery', group: 4, label: 'BigQuery' },
        ],
        links: [
            { source: 'User', target: 'Orchestrator' },
            { source: 'Orchestrator', target: 'Financial' },
            { source: 'Orchestrator', target: 'Retail' },
            { source: 'Orchestrator', target: 'Analytics' },
            { source: 'Financial', target: 'Oracle' },
            { source: 'Retail', target: 'Spanner' },
            { source: 'Analytics', target: 'BigQuery' },
            { source: 'Oracle', target: 'Spanner', label: 'Cross-Domain Sync' },
        ]
    };

    return (
        <div ref={containerRef} className="glass rounded-3xl overflow-hidden border-white/10 h-[400px] relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Live Relation Graph
            </div>
            <ForceGraph2D
                graphData={graphData}
                width={900}
                height={400}
                nodeLabel="label"
                nodeAutoColorBy="group"
                linkColor={() => 'rgba(255,255,255,0.1)'}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Inter`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) as [number, number];

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x, node.y);
                }}
            />
        </div>
    );
}
