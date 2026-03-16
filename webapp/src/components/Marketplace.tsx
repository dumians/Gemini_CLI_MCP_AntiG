import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, GitBranch, Database, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../utils/api';

export function MarketplaceView() {
  const [dataProducts, setDataProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    type: 'All Types',
    quality: 'All Quality',
    access: 'All Access'
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await api.get('/api/catalog');
        // Transform backend catalog into marketplace products format
        const sources = Object.entries(data.sources || {}).map(([id, src]: [string, any]) => ({
          id: `src-${id}`,
          name: src.name,
          type: 'Source',
          domain: src.description || 'Enterprise Data Source',
          owner: 'System Admin',
          quality: 99,
          access: 'Approved'
        }));
        
        const entities = Object.entries(data.entities || {}).map(([id, ent]: [string, any]) => ({
          id: `ent-${id}`,
          name: ent.name,
          type: ent.type === 'PROPERTY_GRAPH' ? 'Graph' : 'Table',
          domain: ent.description || 'Derived Entity',
          owner: 'Data Steward',
          quality: 95,
          access: ent.type === 'PROPERTY_GRAPH' ? 'Request' : 'Approved'
        }));

        setDataProducts([...sources, ...entities]);
      } catch (e) {
        console.error("Failed to fetch catalog:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const filteredProducts = dataProducts.filter(p => {
    if (filters.type !== 'All Types' && p.type !== filters.type) return false;
    if (filters.access !== 'All Access' && p.access !== filters.access) return false;
    return true;
  });

  if (loading) {
    return <div className="p-8 text-slate-400">Loading catalog...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Data Marketplace</h2>
          <p className="text-slate-400">Discover and request access to federated data products across the mesh.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all text-sm"
            />
          </div>
          <button className="glass hover:bg-white/5 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <ShoppingCart size={18} /> My Requests <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full ml-1">2</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 glass rounded-2xl border-slate-800">
        <Filter className="text-slate-500 mr-2" size={18} />
        <select 
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option>All Types</option>
          <option>Graph</option>
          <option>Table</option>
          <option>Source</option>
        </select>
        
        <select 
          value={filters.access}
          onChange={(e) => setFilters(prev => ({ ...prev, access: e.target.value }))}
          className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option>All Access</option>
          <option>Approved</option>
          <option>Request</option>
          <option>Restricted</option>
        </select>

        {(filters.type !== 'All Types' || filters.quality !== 'All Quality' || filters.access !== 'All Access') && (
          <button 
            onClick={() => setFilters({ type: 'All Types', quality: 'All Quality', access: 'All Access' })}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                {product.type === 'Graph' ? <GitBranch size={24} /> : <Database size={24} />}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                product.access === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                product.access === 'Request' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {product.access}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{product.domain}</p>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Owner</span>
                <span className="text-slate-300">{product.owner}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Data Quality</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${product.quality}%` }} />
                  </div>
                  <span className="text-primary font-bold">{product.quality}%</span>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary/20 rounded-xl text-xs font-bold transition-all border border-white/5">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
