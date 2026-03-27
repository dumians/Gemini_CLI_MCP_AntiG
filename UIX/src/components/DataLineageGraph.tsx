import React from 'react';
import { motion } from 'motion/react';
import { Database, Server, Package, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  type: 'source' | 'table' | 'product';
  label: string;
  domain: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
}

export const DataLineageGraph = () => {
  const nodes: Node[] = [
    { id: 's1', type: 'source', label: 'BigQuery DB', domain: 'Sales', x: 50, y: 100 },
    { id: 's2', type: 'source', label: 'Spanner CRM', domain: 'Marketing', x: 50, y: 250 },
    { id: 't1', type: 'table', label: 'Cleaned Transactions', domain: 'Sales', x: 350, y: 100 },
    { id: 't2', type: 'table', label: 'Customer Profiles', domain: 'Marketing', x: 350, y: 250 },
    { id: 'p1', type: 'product', label: 'Sales Forecast Product', domain: 'Sales', x: 650, y: 175 },
  ];

  const edges: Edge[] = [
    { from: 's1', to: 't1' },
    { from: 's2', to: 't2' },
    { from: 't1', to: 'p1' },
    { from: 't2', to: 'p1' },
  ];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source': return <Database size={18} />;
      case 'table': return <Server size={18} />;
      case 'product': return <Package size={18} />;
      default: return <Database size={18} />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'source': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400';
      case 'table': return 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400';
      case 'product': return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400';
      default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="glass rounded-2xl border-slate-700/50 p-6 h-[500px] relative overflow-hidden bg-slate-900/50 w-full">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <ArrowRight size={20} className="text-primary" /> Data Lineage Graph
      </h3>

      <div className="absolute inset-0 p-6 pt-16">
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            
            // Adjust coordinates for center of node (assume node width 200, height 70 approx)
            const x1 = fromNode.x + 180; // right edge of from node
            const y1 = fromNode.y + 35;
            const x2 = toNode.x - 10; // left edge of to node with offset for arrow
            const y2 = toNode.y + 35;

            return (
              <path 
                key={i}
                d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            style={{ left: node.x, top: node.y }}
            className={`absolute w-[200px] p-4 bg-gradient-to-br border rounded-xl shadow-lg backdrop-blur-sm flex flex-col gap-2 cursor-pointer hover:border-primary/50 transition-colors ${getNodeColor(node.type)}`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getNodeIcon(node.type)}
                <span className="text-sm font-bold text-white truncate">{node.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Domain</span>
              <span className="text-slate-300 font-medium">{node.domain}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
