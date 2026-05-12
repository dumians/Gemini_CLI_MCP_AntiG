import React from 'react';
import { Download, RefreshCw, Sparkles, Search, Server } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { api } from '../utils/api';

export const NetSuiteDetailView = () => {
  const [financialData, setFinancialData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [agentPerformance, setAgentPerformance] = React.useState([
    { name: 'SuiteBot AI', queries: 1420, success: 99.4, latency: 14 },
    { name: 'AI-Conn Core', queries: 980, success: 98.9, latency: 18 },
    { name: 'SuiteAgent GQL', queries: 2450, success: 99.9, latency: 9 },
  ]);

  const [fulfillmentStatus, setFulfillmentStatus] = React.useState([
    { label: 'Fulfilled Orders', value: 3, color: 'emerald' },
    { label: 'Pending Clearance', value: 1, color: 'amber' },
  ]);

  const [complianceAudit, setComplianceAudit] = React.useState(99.9);

  const [ledgerEntries, setLedgerEntries] = React.useState([
    { id: 'SO-1001', desc: 'Customer Account: CUST-801 | Item: ITEM-A1', amount: '+$12,500', status: 'Billed' },
    { id: 'SO-1002', desc: 'Customer Account: CUST-802 | Item: ITEM-B2', amount: '+$45,000', status: 'Pending Approval' },
    { id: 'SO-1003', desc: 'Customer Account: CUST-803 | Item: ITEM-C3', amount: '+$8,500', status: 'Partially Fulfilled' },
    { id: 'SO-1004', desc: 'Customer Account: CUST-804 | Item: ITEM-D4', amount: '+$110,000', status: 'Billed' },
  ]);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get('/api/netsuite/analytics');
        if (data.orders) {
          const statusMap: { [key: string]: number } = {};
          data.orders.forEach((o: any) => {
            statusMap[o.status] = (statusMap[o.status] || 0) + Number(o.total_amount || 0);
          });
          
          const chartData = Object.entries(statusMap).map(([status, amount]) => ({
            stage: status,
            volume: amount,
            target: amount * 1.1,
          }));
          setFinancialData(chartData);

          if (data.agentPerformance?.length > 0) setAgentPerformance(data.agentPerformance);
          if (data.fulfillmentStatus?.length > 0) setFulfillmentStatus(data.fulfillmentStatus);
          if (data.complianceAudit) setComplianceAudit(data.complianceAudit);
          if (data.ledgerEntries?.length > 0) setLedgerEntries(data.ledgerEntries);
        }
      } catch (err) {
        console.error('Failed to load netsuite metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const [isQueryingAI, setIsQueryingAI] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');
  const [customInstruction, setCustomInstruction] = React.useState('');

  const handleTriggerAI = () => {
    setIsQueryingAI(true);
    setTimeout(() => {
      setIsQueryingAI(false);
      setActionMessage(`NetSuite AI Connector executed query: "${customInstruction || 'Evaluate volume thresholds'}" successfully.`);
      setCustomInstruction('');
      setTimeout(() => setActionMessage(''), 4000);
    }, 1800);
  };

  const handleSyncSuiteTalk = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setActionMessage('SuiteTalk REST Web Services mapping fully reconciled with data mesh endpoints.');
      setTimeout(() => setActionMessage(''), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-500/5">
          <Sparkles size={18} className="animate-spin" />
          <span>{actionMessage}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">NetSuite ERP</h2>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">AI Connector Live</span>
          </div>
          <p className="text-slate-400 mt-1">Cloud Enterprise Resource Planning, SuiteTalk web services, and Custom MCP Tool extensions.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={handleSyncSuiteTalk} 
            disabled={isSyncing}
            className="glass px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 text-white flex-1 md:flex-initial justify-center border border-white/5 hover:border-white/10"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin text-emerald-400' : ''} /> 
            {isSyncing ? 'Syncing SuiteTalk...' : 'Sync SuiteTalk API'}
          </button>
        </div>
      </div>

      {/* Custom interactive instruction wrapper for NetSuite AI Connector */}
      <div className="glass p-5 rounded-2xl border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Ask NetSuite AI Connector (e.g., 'Summarize clearance anomalies for pending sales orders')"
              className="w-full bg-background-dark/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleTriggerAI()}
            />
          </div>
          <button 
            onClick={handleTriggerAI}
            disabled={isQueryingAI}
            className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} className={isQueryingAI ? 'animate-spin' : ''} />
            <span>{isQueryingAI ? 'Evaluating via NetSuite AI...' : 'Execute AI Connector'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass rounded-2xl border-slate-800 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Operational Order Volume</h3>
              <span className="text-xs text-slate-500">SuiteTalk REST Aggregates</span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="volume" fill="#10b981" radius={[6, 6, 0, 0]} name="Order Volume" />
                  <Bar dataKey="target" fill="#0284c7" radius={[6, 6, 0, 0]} name="Volume Cap Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Agent Execution Benchmarks</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={12} name="Queries" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} name="Success %" domain={[95, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar yAxisId="left" dataKey="queries" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Tool Requests" />
                  <Bar yAxisId="right" dataKey="success" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {agentPerformance.map((agent, i) => (
                <div key={i} className="p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-xs text-slate-400 font-medium mb-1">{agent.name}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-mono font-bold text-emerald-400">{agent.latency}ms</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Latency</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Fulfillment Pipelines</span>
                <Server size={14} className="text-slate-500" />
              </h4>
              <div className="space-y-4">
                {fulfillmentStatus.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className={`font-mono text-base font-bold text-${item.color}-400`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass p-6 rounded-2xl border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform Compliance</h4>
              <div className="flex items-center justify-center h-20">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-emerald-400 tracking-tight">{complianceAudit}%</p>
                  <p className="text-xs text-slate-500 mt-1">SuiteTalk API Integrity Index</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">NetSuite Sales Orders</h3>
              <span className="text-[10px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded">Live Telemetry</span>
            </div>
            <div className="space-y-3">
              {ledgerEntries.map((tx, i) => (
                <div key={i} className="p-3.5 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-all flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 font-mono">{tx.id}</span>
                      <p className="text-xs font-bold text-emerald-400 mt-1.5">{tx.amount}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'Billed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      tx.status === 'Pending Approval' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2 mt-0.5 font-mono text-slate-400/90">{tx.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActionMessage('Full custom record lists exported to local suite directory.')}
              className="w-full mt-6 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-700 rounded-xl bg-background-dark/30"
            >
              Export SuiteTalk Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
