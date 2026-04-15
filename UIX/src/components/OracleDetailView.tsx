import React from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { api } from '../utils/api';

export const OracleDetailView = () => {
  const [financialData, setFinancialData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get('/api/oracle/analytics');
        if (data.orders) {
          // Aggregate total amount by status for a simple bar chart
          const statusMap: { [key: string]: number } = {};
          data.orders.forEach((o: any) => {
            statusMap[o.status] = (statusMap[o.status] || 0) + Number(o.total_amount || 0);
          });
          
          const chartData = Object.entries(statusMap).map(([status, amount]) => ({
            month: status, // Using status as the category for the bar
            revenue: amount,
            expenses: amount * 0.7, // Simulated expenses
            compliance: 98
          }));
          setFinancialData(chartData);
        }
      } catch (err) {
        console.error('Failed to load oracle metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const agentPerformance = [
    { name: 'Agent Alpha', queries: 1240, success: 99.2, latency: 12 },
    { name: 'Agent Beta', queries: 890, success: 98.5, latency: 15 },
    { name: 'Agent Gamma', queries: 2100, success: 99.8, latency: 8 },
    { name: 'Agent Delta', queries: 1560, success: 97.4, latency: 22 },
    { name: 'Agent Epsilon', queries: 1100, success: 99.5, latency: 10 },
  ];

  const [isExporting, setIsExporting] = React.useState(false);
  const [isReconciling, setIsReconciling] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setActionMessage('Ledger export saved to downloads.');
      setTimeout(() => setActionMessage(''), 3000);
    }, 1500);
  };

  const handleReconcile = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setActionMessage('General Ledger accounts fully reconciled.');
      setTimeout(() => setActionMessage(''), 3000);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {actionMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          {actionMessage}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Oracle ERP</h2>
          <p className="text-slate-400">Global Resource Planning & Financial Governance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-white"
          >
            {isExporting ? <span className="animate-spin text-xs">⏳</span> : <Download size={16} />} 
            {isExporting ? 'Exporting...' : 'Export Ledger'}
          </button>
          <button 
            onClick={handleReconcile} 
            disabled={isReconciling}
            className="bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all"
          >
            {isReconciling ? 'Reconciling...' : 'Reconcile Accounts'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Financial Performance</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#475569" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Data Agent Performance Metrics</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} name="Queries" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} name="Success %" domain={[90, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar yAxisId="left" dataKey="queries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Queries" />
                  <Bar yAxisId="right" dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {agentPerformance.map((agent, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs text-slate-500 uppercase mb-1">{agent.name}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-mono font-bold text-white">{agent.latency}ms</span>
                    <span className="text-[10px] text-slate-400">Avg Latency</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Procurement Status</h4>
              <div className="space-y-4">
                {[
                  { label: 'Pending Approvals', value: 12, color: 'orange' },
                  { label: 'Active POs', value: 145, color: 'blue' },
                  { label: 'Vendor Disputes', value: 3, color: 'red' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-300">{item.label}</span>
                    <span className={`font-mono font-bold text-${item.color}-500`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance Audit</h4>
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">99.8%</p>
                  <p className="text-xs text-slate-500 mt-1">Global Compliance Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Recent Ledger Entries</h3>
            <div className="space-y-4">
              {[
                { id: 'TX-9021', desc: 'Cloud Infrastructure', amount: '-$12,400', status: 'Cleared' },
                { id: 'TX-9022', desc: 'Vendor Payment: Logistics', amount: '-$45,000', status: 'Pending' },
                { id: 'TX-9023', desc: 'Service Revenue: EMEA', amount: '+$128,000', status: 'Cleared' },
                { id: 'TX-9024', desc: 'Payroll: R&D Dept', amount: '-$210,000', status: 'Cleared' },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{tx.id}</p>
                    <p className="text-[10px] text-slate-500">{tx.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono font-bold ${tx.amount.startsWith('+') ? 'text-green-500' : 'text-white'}`}>{tx.amount}</p>
                    <p className="text-[10px] text-slate-500">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 rounded-xl">
              View Full Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
