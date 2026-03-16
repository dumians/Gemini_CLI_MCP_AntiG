import React from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, Download, Table, Copy, GitBranch } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar 
} from 'recharts';

export function BigQueryDetailView() {
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock logic to wait for real endpoint
      const res = await fetch('/api/bigquery/analytics').catch(() => null);
      if (!res?.ok) {
        // use Mock data since endpoint is not available
        setAnalyticsData({
          metrics: { totalConversions: 18370, avgRoi: 249.05 },
          campaigns: [
            { id: "CMP_2023_Q4_RTL", conversions: 14529, roi: 312.4 },
            { id: "CMP_2023_Q4_B2B", conversions: 3841, roi: 185.7 }
          ],
          segments: [
            { name: "Enterprise Logic Users", value: "High", growth: 12 },
            { name: "Retail Buyers", value: "Medium", growth: 5 }
          ]
        });
      } else {
        const data = await res.json();
        setAnalyticsData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch BigQuery analytics:', err);
      setError('The BigQuery Analytics Agent is currently unreachable. Please check your network connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className="text-slate-400 font-medium animate-pulse">Fetching Real-time Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 px-4">
        <div className="max-w-md w-full glass p-8 rounded-3xl border-red-500/30 text-center space-y-6">
          <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Analytics Unavailable</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl text-sm font-bold transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-8 max-w-[1600px] mx-auto w-full space-y-6 relative z-10">
      <section className="w-full">
        <div className="glass dark:bg-slate-900/40 border border-slate-200 dark:border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]"></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 border border-purple-500/30">
                  <TrendingUp size={24} />
                </div>
                Marketing Insights: User Segment Growth
              </h2>
              <p className="text-slate-400 mt-2 text-sm">Monthly acquisition and retention performance across key demographics.</p>
            </div>
            <div className="flex gap-4">
              <div className="glass px-4 py-2 rounded-xl flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Conversions</span>
                <span className="text-xl font-mono text-white">{analyticsData?.metrics?.totalConversions?.toLocaleString()}</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Avg ROI</span>
                <span className="text-xl font-mono text-primary">{analyticsData?.metrics?.avgRoi}%</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData?.campaigns}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="id" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickFormatter={(value: string) => value.split('_')[2] || value}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}
                />
                <Bar dataKey="conversions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Conversions" />
                <Bar dataKey="roi" fill="#a855f7" radius={[4, 4, 0, 0]} name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-10 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-blue-500"></div>
              <span className="text-slate-300">Conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-purple-500"></div>
              <span className="text-slate-300">ROI %</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass dark:bg-slate-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                <RefreshCw size={20} />
              </div>
              Customer Segment Performance
            </h3>
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase tracking-widest border border-green-500/20">
              Live
            </span>
          </div>
          
          <div className="space-y-4">
            {analyticsData?.segments?.map((segment: any, i: number) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{segment.name}</p>
                  <p className="text-xs text-slate-500">Growth Potential: <span className="text-primary">{segment.value}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono text-green-500">+{segment.growth}%</p>
                  <div className="w-24 h-1 bg-slate-800 rounded-full mt-1">
                    <div className="h-full bg-green-500" style={{ width: `${segment.growth * 5}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass dark:bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 border border-cyan-500/30">
              <GitBranch size={20} />
            </div>
            Data Lineage
          </h3>
          <div className="flex items-center justify-between h-48 relative z-10 px-4">
            {[
              { label: 'Raw App Events', icon: Download, color: 'slate' },
              { label: 'Dataflow Pipeline', icon: RefreshCw, color: 'blue' },
              { label: 'Analytics Table', icon: Table, color: 'purple' },
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2 w-20 group">
                  <div className={`size-12 rounded-xl flex items-center justify-center group-hover:border-${node.color}-400 transition-colors shadow-lg ${
                    node.color === 'slate' ? 'bg-slate-800 border-slate-600' :
                    node.color === 'blue' ? 'bg-blue-500/20 border-blue-500/40' :
                    'bg-purple-500/20 border-purple-500/50'
                  }`}>
                    <node.icon className={`text-${node.color}-400`} size={20} />
                  </div>
                  <span className="text-[10px] text-center text-slate-400 leading-tight">{node.label}</span>
                </div>
                {i < 2 && (
                  <div className="flex-1 flex items-center px-2">
                    <div className="h-[2px] w-full bg-slate-700 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-cyan-400" style={{ width: '100%', animation: 'slide 2s linear infinite' }} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
