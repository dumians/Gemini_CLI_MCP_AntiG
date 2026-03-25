import React from 'react';
import { 
  Users, BarChart3, TrendingUp, Search, RefreshCw, AlertTriangle, MoreVertical, ShieldCheck, Heart, Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';
import { api } from '../utils/api';

export const AlloyDetailView = () => {
  const [crmMetrics, setCrmMetrics] = React.useState({
    totalLeads: 2450,
    conversionRate: 18.5,
    customerSentiment: 88,
    avgResponseTime: "1.2h"
  });

  const [sentimentData] = React.useState([
    { day: 'Mon', positive: 65, neutral: 25, negative: 10 },
    { day: 'Tue', positive: 70, neutral: 20, negative: 10 },
    { day: 'Wed', positive: 68, neutral: 22, negative: 10 },
    { day: 'Thu', positive: 72, neutral: 20, negative: 8 },
    { day: 'Fri', positive: 75, neutral: 18, negative: 7 },
    { day: 'Sat', positive: 80, neutral: 15, negative: 5 },
    { day: 'Sun', positive: 82, neutral: 13, negative: 5 },
  ]);

  const [leadConversion] = React.useState([
    { stage: 'Prospects', value: 5000 },
    { stage: 'Qualified', value: 3400 },
    { stage: 'Proposal', value: 1800 },
    { stage: 'Negotiation', value: 900 },
    { stage: 'Won', value: 450 },
  ]);

  const [activeCustomers] = React.useState([
    { id: 'CUST-390', name: 'Alpha Corp', tier: 'Enterprise', health: 'Healthy', val: '$120K' },
    { id: 'CUST-412', name: 'Beta Solutions', tier: 'Mid-Market', health: 'At Risk', val: '$45K' },
    { id: 'CUST-501', name: 'Global Industries', tier: 'Enterprise', health: 'Healthy', val: '$230K' },
    { id: 'CUST-223', name: 'Tech Start', tier: 'SMB', health: 'Healthy', val: '$12K' },
    { id: 'CUST-611', name: 'Zeta Finance', tier: 'Enterprise', health: 'Critical', val: '$95K' },
  ]);

  React.useEffect(() => {
    const fetchCrmData = async () => {
      try {
        const data = await api.get('/api/alloy/crm_data');
        if (data.status === 'success') {
          setCrmMetrics(data.metrics || crmMetrics);
          // If the mock extends to customers/sentiment, update those too.
        }
      } catch (err) {
        console.error('Failed to fetch Alloy CRM data:', err);
      }
    };

    fetchCrmData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">AlloyDB CRM Nexus</h2>
          <p className="text-slate-400">Deep customer insights running on AlloyDB for PostgreSQL.</p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2">
            <RefreshCw size={16} /> Sync CRM Hub
          </button>
          <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
            <ShieldCheck size={16} /> Governance Check
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, label: "Total Leads", val: crmMetrics.totalLeads, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: TrendingUp, label: "Conversion Rate", val: `${crmMetrics.conversionRate}%`, color: "text-green-500", bg: "bg-green-500/10" },
          { icon: Heart, label: "Customer Sentiment", val: `${crmMetrics.customerSentiment}%`, color: "text-pink-500", bg: "bg-pink-500/10" },
          { icon: Clock, label: "Avg Response", val: crmMetrics.avgResponseTime, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6 h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Sentiment Projections (7 Days)</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <span className="text-green-500 flex items-center gap-1.5"><div className="size-2 rounded-full bg-green-500" /> Positive</span>
              <span className="text-slate-500 flex items-center gap-1.5"><div className="size-2 rounded-full bg-slate-500" /> Neutral</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="positive" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="neutral" stroke="#64748b" fill="#64748b" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 h-[350px] flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-6">CRM Conversion Funnel</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadConversion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="glass rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-white/5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Customer Relationship Roster</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input className="bg-slate-900/50 border-slate-700 rounded-lg text-xs pl-9 pr-4 py-2 focus:ring-primary focus:border-primary" placeholder="Search accounts..." type="text" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Account Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tier</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ACV</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Relationship Health</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {activeCustomers.map((row) => (
                <tr key={row.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{row.name}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{row.tier}</td>
                  <td className="px-6 py-4 text-slate-200 font-mono text-sm">{row.val}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-xs font-bold ${
                      row.health === 'Healthy' ? 'text-green-500' : 
                      row.health === 'At Risk' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      <div className={`size-1.5 rounded-full ${
                        row.health === 'Healthy' ? 'bg-green-500' : 
                        row.health === 'At Risk' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                      }`} />
                      {row.health}
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
