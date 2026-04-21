import React from 'react';
import { Package, MapPin, Shield, RefreshCw, AlertCircle, Navigation, Globe } from 'lucide-react';

export const WarehouseDetailView = () => {
  const [loading, setLoading] = React.useState(false);
  const [spatialData, setSpatialData] = React.useState({
    warehouses: [
      { id: 'WH-101', name: 'Austin Tech Hub', coords: '30.2672° N, 97.7431° W', status: 'Critical', alert: 'SKU-500 Stockout Risk' },
      { id: 'WH-202', name: 'Phoenix Desert Fulfillment', coords: '33.4484° N, 112.0740° W', status: 'Optimal', alert: 'None' }
    ],
    skus: [
      { id: 'SKU-500', name: 'Sustainable Battery Pack', stock: 150, reorder: 200 }
    ]
  });

  const triggerAction = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full relative z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl text-primary">
            <Package size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Warehouse Spatial Operations</h2>
            <p className="text-slate-400">Oracle AI Graph & Geospatial mapping constraints.</p>
          </div>
        </div>
        <button 
          onClick={triggerAction}
          disabled={loading}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Syncing...' : 'Re-Index Coordinates'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass rounded-3xl border-slate-800 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400">
              <Navigation size={14} className="animate-pulse" /> Live Spatial Mapping
            </div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <MapPin className="text-primary" /> Asset Locations (Oracle SDO_GEOMETRY)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {spatialData.warehouses.map(wh => (
                <div key={wh.id} className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">{wh.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">{wh.id}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      wh.status === 'Critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {wh.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl font-mono flex items-center gap-2">
                    <MapPin size={12} className="text-slate-600" />
                    {wh.coords}
                  </div>
                  {wh.alert !== 'None' && (
                    <div className="mt-4 text-xs text-rose-400 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 flex items-center gap-2">
                      <AlertCircle size={14} />
                      {wh.alert}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-3xl border-slate-800 p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Globe className="text-primary" /> Oracle Spatial Supply Route (A2A Gateway Topology)
            </h3>
            <div className="h-[400px] relative bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 800 400" className="transform-gpu">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Simulated World Map Vectors (Abstract Continents) */}
                <path d="M 100,120 Q 180,100 250,140 T 320,180 Q 280,220 200,200 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M 450,150 Q 520,100 650,120 T 720,180 Q 600,280 480,220 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M 200,280 Q 280,250 320,300 T 400,350 Q 300,380 200,320 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Route Paths (Curved) */}
                <path d="M 180,150 Q 350,80 550,180" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeDasharray="5,5" className="animate-[pulse_2s_infinite]" />
                <path d="M 550,180 Q 400,260 240,310" fill="none" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="2" strokeDasharray="5,5" />

                {/* Entity Coordinates (Map Pins) */}
                {/* 1. Austin Tech Hub (Source) */}
                <g transform="translate(180, 150)">
                  <circle r="12" fill="rgba(59, 130, 246, 0.2)" />
                  <circle r="6" fill="#3b82f6" className="animate-pulse" />
                  <text x="15" y="5" fill="#fff" className="text-[10px] font-bold tracking-wide drop-shadow">Austin (WH-101)</text>
                </g>

                {/* 2. Phoenix desert fulfillment */}
                <g transform="translate(240, 310)">
                  <circle r="12" fill="rgba(16, 185, 129, 0.2)" />
                  <circle r="6" fill="#10b981" />
                  <text x="15" y="5" fill="#fff" className="text-[10px] font-bold tracking-wide drop-shadow">Phoenix (WH-202)</text>
                </g>

                {/* 3. EcoMetals Supplier */}
                <g transform="translate(550, 180)">
                  <circle r="16" fill="rgba(244, 63, 94, 0.2)" />
                  <circle r="8" fill="#f43f5e" className="animate-ping opacity-75 duration-1000" />
                  <circle r="6" fill="#f43f5e" />
                  <text x="15" y="5" fill="#fff" className="text-[10px] font-bold tracking-wide drop-shadow">EcoMetals (SUP-01)</text>
                </g>
              </svg>

              <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] bg-black/60 px-3 py-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" /> Warehouse</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Optimal</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" /> Supplier</div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-3xl border-slate-800 p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="text-primary" /> Governed Action Gate
            </h3>
            <div className="space-y-4">
              {spatialData.skus.map(sku => (
                <div key={sku.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">{sku.name}</span>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{sku.id}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/50">
                    <span>Current Stock: <b className="text-rose-500">{sku.stock}</b></span>
                    <span>Reorder Point: <b className="text-white">{sku.reorder}</b></span>
                  </div>
                </div>
              ))}
              <button 
                onClick={triggerAction}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-rose-500/20 transition-all mt-4"
              >
                Approve Cross-Domain Transfer
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
export default WarehouseDetailView;
