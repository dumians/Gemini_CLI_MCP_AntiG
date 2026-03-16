import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingUp, Search, RefreshCw, MoreVertical, Terminal } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, 
  LineChart, Line 
} from 'recharts';
import { api } from '../utils/api';

export function SpannerDetailView() {
  const [inventory, setInventory] = React.useState([
    { id: 1, loc: 'Berlin-Central-01', region: 'EMEA', stock: 84203, trend: '+1.2k', cap: 75, status: 'Synchronized' },
    { id: 2, loc: 'SF-Bay-Logistics', region: 'US-West', stock: 122900, trend: null, cap: 92, status: 'Synchronized' },
    { id: 3, loc: 'Singapore-Hub-C', region: 'APAC', stock: 45112, trend: null, cap: 40, status: 'Updating' },
    { id: 4, loc: 'Tokyo-East-Data', region: 'APAC', stock: 1200, trend: '-200', cap: 15, status: 'Synchronized' },
  ]);

  const [alerts, setAlerts] = React.useState<{id: string, message: string, type: 'warning' | 'error'}[]>([]);
  const STOCK_THRESHOLD = 5000;

  const performanceData = [
    { day: 'Mon', latency: 14, uptime: 99.98 },
    { day: 'Tue', latency: 12, uptime: 99.99 },
    { day: 'Wed', latency: 18, uptime: 99.95 },
    { day: 'Thu', latency: 11, uptime: 99.99 },
    { day: 'Fri', latency: 13, uptime: 99.97 },
    { day: 'Sat', latency: 10, uptime: 100.00 },
    { day: 'Sun', latency: 12, uptime: 99.99 },
  ];

  const stockHistoryData = [
    { day: 'Mon', Berlin: 82000, SF: 120000, Singapore: 42000, Tokyo: 1500 },
    { day: 'Tue', Berlin: 83500, SF: 121500, Singapore: 43500, Tokyo: 1400 },
    { day: 'Wed', Berlin: 81000, SF: 123000, Singapore: 41000, Tokyo: 1300 },
    { day: 'Thu', Berlin: 84000, SF: 122000, Singapore: 45000, Tokyo: 1250 },
    { day: 'Fri', Berlin: 85000, SF: 124000, Singapore: 44000, Tokyo: 1200 },
    { day: 'Sat', Berlin: 84203, SF: 122900, Singapore: 45112, Tokyo: 1200 },
    { day: 'Sun', Berlin: 84500, SF: 123500, Singapore: 46000, Tokyo: 1150 },
  ];

  // Simulation of real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setInventory(prev => prev.map(item => {
        const change = Math.floor(Math.random() * 1000) - 500;
        const newStock = Math.max(0, item.stock + change);
        
        let newStatus = item.status;
        if (Math.random() > 0.95) {
          newStatus = Math.random() > 0.5 ? 'Updating' : 'Synchronized';
        }
        if (Math.random() > 0.98) {
          newStatus = 'Error';
        }

        return { ...item, stock: newStock, status: newStatus };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Alert monitoring logic
  React.useEffect(() => {
    const newAlerts: {id: string, message: string, type: 'warning' | 'error'}[] = [];
    
    inventory.forEach(item => {
      if (item.stock < STOCK_THRESHOLD) {
        newAlerts.push({
          id: `stock-${item.id}`,
          message: `Low stock alert: ${item.loc} (${item.stock} units)`,
          type: 'warning'
        });
      }
      if (item.status === 'Error') {
        newAlerts.push({
          id: `sync-${item.id}`,
          message: `Sync failure detected: ${item.loc}`,
          type: 'error'
        });
      }
    });

    setAlerts(newAlerts);
  }, [inventory]);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Alerts Section */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  alert.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}
              >
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">{alert.message}</span>
                <button 
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="ml-auto hover:opacity-70"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative w-full h-[400px] glass rounded-2xl overflow-hidden border-slate-800">
        <div className="absolute inset-0 bg-[#0c0c1e]">
          <svg className="w-full h-full opacity-40" viewBox="0 0 1000 500">
            <path d="M150,100 Q200,80 250,120 T350,150 T450,100" fill="none" stroke="#1e293b" strokeWidth="2" />
            <path d="M600,200 Q700,180 800,250 T900,200" fill="none" stroke="#1e293b" strokeWidth="2" />
            <path className="map-glow" d="M220,150 Q400,50 780,220" fill="none" stroke="#22c55e" strokeDasharray="8 4" strokeWidth="1.5" />
            <path className="map-glow" d="M220,150 Q300,300 500,400" fill="none" stroke="#22c55e" strokeDasharray="4 4" strokeWidth="1.5" />
            <path className="map-glow" d="M780,220 Q850,350 500,400" fill="none" stroke="#22c55e" strokeDasharray="6 2" strokeWidth="1.5" />
            <circle className="map-glow" cx="220" cy="150" fill="#22c55e" r="4" />
            <circle className="map-glow" cx="780" cy="220" fill="#22c55e" r="4" />
            <circle className="map-glow" cx="500" cy="400" fill="#22c55e" r="4" />
          </svg>
        </div>
        <div className="absolute top-6 left-6 z-10">
          <h2 className="text-2xl font-bold text-white mb-1">Global Inventory Flow</h2>
          <p className="text-slate-400 text-sm">Real-time cross-region synchronization active</p>
        </div>
        <div className="absolute bottom-6 right-6 flex gap-4">
          <div className="glass p-3 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Nodes</p>
            <p className="text-xl font-mono text-green-500">142</p>
          </div>
          <div className="glass p-3 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sync Velocity</p>
            <p className="text-xl font-mono text-green-500">4.2GB/s</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass rounded-2xl p-6 border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-100">Performance</h3>
            <TrendingUp className="text-slate-500" size={20} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Avg Latency</p>
                  <p className="text-3xl font-bold text-green-500">12ms</p>
                </div>
                <span className="text-xs text-green-400 font-mono mb-1">↓ 2.4%</span>
              </div>
              <div className="h-16 w-full flex items-end gap-1 overflow-hidden">
                {[0.8, 0.5, 0.7, 0.9, 0.6, 0.75, 0.85, 0.65].map((h, i) => (
                  <div key={i} className="flex-1 bg-green-500/20 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Uptime (24h)</span>
                <span className="text-sm font-bold text-white">99.99%</span>
              </div>
              <div className="mt-3 flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 bg-green-500 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">7-Day Performance History</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 text-green-500">
                <div className="size-2 rounded-full bg-green-500" /> Latency (ms)
              </div>
              <div className="flex items-center gap-1.5 text-blue-500">
                <div className="size-2 rounded-full bg-blue-500" /> Uptime (%)
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUptime)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">7-Day Stock Level Trends</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
            <div className="flex items-center gap-1.5 text-blue-500">
              <div className="size-2 rounded-full bg-blue-500" /> Berlin
            </div>
            <div className="flex items-center gap-1.5 text-purple-500">
              <div className="size-2 rounded-full bg-purple-500" /> SF
            </div>
            <div className="flex items-center gap-1.5 text-green-500">
              <div className="size-2 rounded-full bg-green-500" /> Singapore
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500">
              <div className="size-2 rounded-full bg-yellow-500" /> Tokyo
            </div>
          </div>
        </div>
        <div className="p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="Berlin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="SF" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Singapore" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Tokyo" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="glass rounded-2xl border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <Terminal className="text-primary" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Spanner GQL Console</h3>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded transition-colors">Clear</button>
              <button className="px-3 py-1 bg-primary text-white text-xs rounded font-bold hover:bg-primary/80 transition-all">Execute Query</button>
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-auto min-h-[150px]">
            <p className="text-purple-400">SELECT</p>
            <p className="pl-4 text-blue-300">warehouse_id, stock_count, last_updated</p>
            <p className="text-purple-400">FROM</p>
            <p className="pl-4 text-white">Inventory_Distribution</p>
            <p className="text-purple-400">WHERE</p>
            <p className="pl-4 text-white">sku_id = <span className="text-orange-400">'GLOBAL-77X'</span></p>
            <p className="text-purple-400">AND</p>
            <p className="pl-4 text-white">region = <span className="text-orange-400">'EMEA'</span></p>
            <p className="text-slate-600 mt-4 italic">-- Results limited to top 50 rows</p>
            <p className="animate-pulse border-l-2 border-primary pl-1">&nbsp;</p>
          </div>
        </div>
      </div>

      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold">Inventory Distribution</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input className="bg-slate-900 border-slate-700 rounded-lg text-xs pl-9 pr-4 py-2 focus:ring-primary focus:border-primary" placeholder="Filter warehouses..." type="text" />
            </div>
            <button className="flex items-center gap-2 text-xs bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
              <RefreshCw size={14} /> Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Warehouse Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Region</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Capacity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sync Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {inventory.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{row.loc}</td>
                  <td className="px-6 py-4 text-slate-400">{row.region}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${row.stock < STOCK_THRESHOLD ? 'text-yellow-500 font-bold' : 'text-slate-200'}`}>
                        {row.stock.toLocaleString()}
                      </span>
                      {row.trend && <span className="text-[10px] text-green-500">{row.trend}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${row.stock < STOCK_THRESHOLD ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (row.stock / 150000) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-xs ${
                      row.status === 'Updating' ? 'text-primary animate-pulse font-medium' : 
                      row.status === 'Error' ? 'text-red-500 font-bold' :
                      'text-green-400'
                    }`}>
                      {row.status === 'Updating' ? <RefreshCw size={12} /> : 
                       row.status === 'Error' ? <AlertTriangle size={12} /> :
                       <div className="size-1.5 rounded-full bg-green-400" />}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MoreVertical className="text-slate-500 hover:text-white inline cursor-pointer" size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
