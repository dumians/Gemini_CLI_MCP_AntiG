import React from 'react';
import { 
  Package, Search, RefreshCw, AlertTriangle, MoreVertical, Terminal
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';

import { api } from '../utils/api';

const STOCK_THRESHOLD = 50000;

export const SpannerDetailView = () => {
  const [inventory, setInventory] = React.useState([
    { id: 'WH-EU-01', loc: 'Berlin Hub', region: 'EMEA', stock: 124500, status: 'Synced', trend: '+2.4%' },
    { id: 'WH-US-02', loc: 'SF Distribution', region: 'NAMER', stock: 89000, status: 'Synced', trend: '-1.2%' },
    { id: 'WH-AP-01', loc: 'Singapore Central', region: 'APAC', stock: 45200, status: 'Updating', trend: '+0.8%' },
    { id: 'WH-AP-02', loc: 'Tokyo Logistics', region: 'APAC', stock: 156000, status: 'Synced', trend: '+5.1%' },
    { id: 'WH-EU-02', loc: 'London Gateway', region: 'EMEA', stock: 32000, status: 'Error', trend: '-4.5%' },
  ]);

  const [performanceData, setPerformanceData] = React.useState<any[]>([
    { day: 'Mon', latency: 12, uptime: 99.9 },
    { day: 'Tue', latency: 15, uptime: 99.8 },
    { day: 'Wed', latency: 8, uptime: 100 },
    { day: 'Thu', latency: 22, uptime: 99.5 },
    { day: 'Fri', latency: 14, uptime: 99.9 },
    { day: 'Sat', latency: 10, uptime: 100 },
    { day: 'Sun', latency: 11, uptime: 100 },
  ]);

  const stockHistoryData = [
    { day: 'Mon', Berlin: 120000, SF: 85000, Singapore: 42000, Tokyo: 150000 },
    { day: 'Tue', Berlin: 121000, SF: 86000, Singapore: 43000, Tokyo: 152000 },
    { day: 'Wed', Berlin: 119000, SF: 84000, Singapore: 44000, Tokyo: 151000 },
    { day: 'Thu', Berlin: 122000, SF: 87000, Singapore: 45000, Tokyo: 154000 },
    { day: 'Fri', Berlin: 123000, SF: 88000, Singapore: 44000, Tokyo: 155000 },
    { day: 'Sat', Berlin: 124000, SF: 89000, Singapore: 45000, Tokyo: 156000 },
    { day: 'Sun', Berlin: 124500, SF: 89000, Singapore: 45200, Tokyo: 156000 },
  ];

  const [stockHistory, setStockHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await api.get('/api/spanner/inventory');
        if (data.data?.length > 0) {
          const mapped = data.data.map((item: any) => ({
            id: item.transaction_id,
            loc: `Store ${item.store_id}`,
            region: 'Global',
            stock: Number(item.quantity_sold) * 100, // Scale for visual
            status: 'Synced',
            trend: '+0.5%'
          }));
          setInventory(mapped);

          // Aggregate by timestamp for trend chart (simulated days)
          const trendMap: { [key: string]: any } = {};
          data.data.forEach((item: any) => {
            const day = item.timestamp ? item.timestamp.split('T')[0] : 'Unknown';
            if (!trendMap[day]) trendMap[day] = { day, Berlin: 0, SF: 0, Singapore: 0, Tokyo: 0 };
            
            // Map store_id to a city for the chart
            if (item.store_id === 'NYC-01') trendMap[day].SF += Number(item.quantity_sold) * 50;
            else if (item.store_id === 'LDN-05') trendMap[day].Berlin += Number(item.quantity_sold) * 80;
            else trendMap[day].Singapore += Number(item.quantity_sold) * 30;
          });
          setStockHistory(Object.values(trendMap));
        }
        if (data.performance?.length > 0) {
          setPerformanceData(data.performance);
        }
      } catch (err) {
        console.error('Failed to fetch Spanner inventory:', err);
      }
    };
    
    fetchInventory();
  }, []);

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isShipping, setIsShipping] = React.useState(false);
  const [spannerMessage, setSpannerMessage] = React.useState('');

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSpannerMessage('Global Inventory explicitly synced across 5 regions.');
      setTimeout(() => setSpannerMessage(''), 3500);
    }, 1800);
  };

  const handleNewShipment = () => {
    setIsShipping(true);
    setTimeout(() => {
      setIsShipping(false);
      setSpannerMessage('New cargo logged. Replicating to Spanner clusters.');
      setTimeout(() => setSpannerMessage(''), 3500);
    }, 1200);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {spannerMessage && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          {spannerMessage}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Spanner Retail Database</h2>
          <p className="text-slate-400">Global, strongly consistent inventory management.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleForceSync}
            disabled={isSyncing}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-white"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> 
            {isSyncing ? 'Synchronizing...' : 'Force Sync'}
          </button>
          <button 
            onClick={handleNewShipment}
            disabled={isShipping}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 transition-all"
          >
            <Package size={16} /> {isShipping ? 'Deploying...' : 'New Shipment'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass rounded-2xl border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Health</h3>
              <p className="text-xs text-slate-400">Primary Node: us-east1</p>
            </div>
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
            <LineChart data={stockHistory.length > 0 ? stockHistory : stockHistoryData}>
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

      <div className="grid grid-cols-1 gap-8">
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
};
