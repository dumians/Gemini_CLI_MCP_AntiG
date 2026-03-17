import React from 'react';
import { AlertTriangle, Download, Database, Users, Server, FileText, CheckCircle2, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../utils/api';

export const GovernanceDetailView = () => {
    const [alerts, setAlerts] = React.useState<any[]>([
      { id: 'ALT-992', severity: 'high', title: 'Unauthorized IAM Role Assignment', source: 'AlloyDB', time: '12m ago',
        desc: 'Detect anomalous permission grant for role "db_admin" to external service account.' },
      { id: 'ALT-993', severity: 'medium', title: 'Unusual Data Exfiltration Volume', source: 'BigQuery', time: '1h ago',
        desc: 'Query results exporting 50GB to unknown GCS bucket.' },
      { id: 'ALT-994', severity: 'low', title: 'Failed Authentication Spikes', source: 'Spanner', time: '3h ago',
        desc: 'Multiple failed login attempts from IP range 192.168.x.x.' }
    ]);
  
    // Simulate real-time governance alerts from API
    React.useEffect(() => {
      const fetchAlerts = async () => {
        try {
           // We might fetch actual simulated alerts here from a specific endpoint in the future
           // For now, let's keep the initial mock data and simulate a new alert appearing
           const data = await api.get('/api/status');
           if (data.status === 'processing' && Math.random() > 0.8) {
               setAlerts(prev => [{
                   id: `ALT-${Math.floor(Math.random() * 1000)}`,
                   severity: 'medium',
                   title: 'Agent Policy Evaluation Triggered',
                   source: 'ADK-Core',
                   time: 'Just now',
                   desc: `Data Agent [${data.agents[0]?.agent || 'Unknown'}] initiated cross-domain join requiring dynamic PII masking.`
               }, ...prev].slice(0, 5));
           }
        } catch (err) {
            console.error(err);
        }
      };
      
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/5">
          <div className="flex gap-4 items-center">
             <div className="size-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
               <AlertTriangle size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white mb-1">Compliance & Threat Detail</h2>
               <p className="text-slate-400">Real-time monitoring of policy violations and anomalous data access.</p>
             </div>
          </div>
          <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all text-slate-300 flex items-center gap-2">
            <Download size={16} /> Export Audit Log
          </button>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <section className="glass rounded-2xl border border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <AlertTriangle className="text-yellow-500" size={20} /> Active Alerts
                  </h3>
                  <div className="space-y-4">
                      {alerts.map(alert => (
                           <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={alert.id} 
                              className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-colors"
                           >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                  alert.severity === 'high' ? 'bg-rose-500' :
                                  alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex justify-between items-start pl-3">
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <span className="font-mono text-xs text-slate-500">{alert.id}</span>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                              alert.severity === 'high' ? 'bg-rose-500/10 text-rose-500' :
                                              alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                                          }`}>
                                              {alert.severity} Severity
                                          </span>
                                      </div>
                                      <h4 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">{alert.title}</h4>
                                      <p className="text-sm text-slate-400 mt-2">{alert.desc}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-slate-500">{alert.time}</p>
                                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 font-medium">
                                          {alert.source === 'BigQuery' ? <Database size={12}/> : 
                                           alert.source === 'AlloyDB' ? <Users size={12}/> :
                                           alert.source === 'ADK-Core' ? <Bot size={12} /> : <Server size={12} />}
                                          {alert.source}
                                      </div>
                                  </div>
                              </div>
                           </motion.div>
                      ))}
                  </div>
              </section>
           </div>
  
           <div className="space-y-6">
               <section className="glass rounded-2xl border border-slate-800 p-6 flex flex-col items-center text-center">
                    <div className="size-24 rounded-full border-4 border-rose-500/20 flex flex-col items-center justify-center p-2 mb-4 relative">
                         <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                         <span className="text-3xl font-bold text-white">3</span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Critical</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Action Required</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">Immediate remediation needed for high-severity policy violations across interconnected domains.</p>
                    <button className="w-full mt-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-sm font-bold rounded-xl transition-colors">
                        Initiate Lockdown Protocol
                    </button>
               </section>
  
               <section className="glass rounded-2xl border border-slate-800 p-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-3">Automated Remedies</h3>
                   <div className="space-y-3">
                       <div className="flex gap-3 text-sm text-slate-300 items-start">
                           <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                           <p>Revoked temporary IAM roles for BigQuery Service Account <span className="font-mono text-xs text-slate-500">svc-bq-temp-admin</span>.</p>
                       </div>
                       <div className="flex gap-3 text-sm text-slate-300 items-start">
                           <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                           <p>Enforced row-level masking on AlloyDB CRM table <span className="font-mono text-xs text-slate-500">customer_pii</span>.</p>
                       </div>
                   </div>
               </section>
           </div>
        </div>
      </div>
    );
};
