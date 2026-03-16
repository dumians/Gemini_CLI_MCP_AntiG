import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Activity, Shield, Users, Server, Globe, Store, Database } from 'lucide-react';

import type { View } from '../types';

export function GovernanceView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Federated Governance</h2>
          <p className="text-slate-400">Global policy enforcement, compliance monitoring, and data access controls.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
            <ShieldCheck size={18} /> New Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs">Active Policies</h3>
            <ShieldCheck className="text-green-500" size={20} />
          </div>
          <p className="text-4xl font-mono text-white">124</p>
          <div className="flex text-xs items-center gap-2 text-slate-400">
            <span className="text-green-500">↑ 12</span> applied this week
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs">Policy Violations</h3>
            <ShieldAlert className="text-amber-500" size={20} />
          </div>
          <p className="text-4xl font-mono text-white">3</p>
          <div className="flex text-xs items-center gap-2 text-slate-400">
            <span className="text-amber-500">↓ 2</span> from yesterday
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs">Global Compliance</h3>
            <CheckCircle2 className="text-blue-500" size={20} />
          </div>
          <p className="text-4xl font-mono text-white">99.8%</p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full w-[99.8%]"></div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button 
            className={`px-8 py-4 text-sm font-bold transition-colors relative ${activeTab === 'active' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Policies
            {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>}
          </button>
          <button 
            className={`px-8 py-4 text-sm font-bold transition-colors relative ${activeTab === 'violations' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('violations')}
          >
            Violations <span className="ml-2 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-[10px]">3</span>
            {activeTab === 'violations' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>}
          </button>
        </div>

        <div className="p-6">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Policy Name</th>
                <th className="px-6 py-4">Domain Focus</th>
                <th className="px-6 py-4">Enforcement Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Existing PII Policy */}
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <Shield size={16} className="text-primary" />
                  PII Data Masking - Global Stringent
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] uppercase font-bold flex items-center gap-1"><Users size={10} /> HR</span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] uppercase font-bold flex items-center gap-1"><Store size={10} /> Retail</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] uppercase font-bold">Strict / Blocking</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-wider">
                    <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onNavigate('governance-detail')}
                    className="text-primary hover:text-white transition-colors font-bold text-xs"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
              {/* Other policies */}
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <Globe size={16} className="text-blue-500" />
                  GDPR Data Residency Boundaries
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] uppercase font-bold">All Domains</span>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] uppercase font-bold">Strict / Blocking</span>
                </td>
                 <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-wider">
                    <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                  </div>
                </td>
                <td className="px-6 py-4"><button className="text-slate-500 hover:text-white transition-colors font-bold text-xs">Edit</button></td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <Server size={16} className="text-orange-500" />
                  Stale Data Archival Policy (90 Days)
                </td>
                 <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] uppercase font-bold flex items-center gap-1"><Database size={10} /> Financial</span>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] uppercase font-bold">Warning / Audit</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle size={12} /> Needs Review
                  </div>
                </td>
                <td className="px-6 py-4"><button className="text-slate-500 hover:text-white transition-colors font-bold text-xs">Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function GovernanceDetailView({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('governance')}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-primary" size={24} /> 
            PII Data Masking - Global Stringent
          </h2>
          <p className="text-sm text-slate-400 ml-9">Policy ID: POL-2023-994A</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
           <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-xs uppercase font-bold flex items-center gap-2">
             <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div> Active Enforcement
           </span>
           <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-colors">
              Edit Policy Rules
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Policy Configuration</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Automatically detects and masks Personally Identifiable Information (PII) including Social Security Numbers, Credit Card numbers, and highly sensitive health data across all connected data domains before query results are returned to non-privileged users.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Detection Rules applied</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-primary" /> Regex: SSN Pattern Matching</li>
                      <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-primary" /> Regex: Credit Card (Luhn)</li>
                      <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-primary" /> NLP: Named Entity Recognition (Person)</li>
                      <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-primary" /> Column Metadata Analysis (Name matches)</li>
                    </ul>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Masking Strategy</h4>
                    <div className="bg-slate-900/50 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
                       <div className="flex justify-between">
                         <span className="text-slate-500">SSN:</span>
                         <span className="text-green-400">XXX-XX-####</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Credit Card:</span>
                         <span className="text-green-400">XXXX-XXXX-XXXX-####</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Email:</span>
                         <span className="text-green-400">a***@domain.com</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Activity size={120} />
             </div>
             <h3 className="text-lg font-bold text-white mb-6 relative z-10">Enforcement Activity Stream</h3>
             
             <div className="space-y-4 relative z-10">
               <div className="flex gap-4 items-start p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                 <div className="mt-1 p-1.5 bg-blue-500/20 rounded text-blue-500">
                   <Shield size={14} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-200">Query intercepted and heavily masked on <span className="text-primary font-mono">bigquery-analytics.customer_profiles</span></p>
                   <p className="text-xs text-slate-500 mt-1">Found 452 SSN matches • Admin User: DataAnalyst_Tier1 • 2 minutes ago</p>
                 </div>
               </div>
               
               <div className="flex gap-4 items-start p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                 <div className="mt-1 p-1.5 bg-green-500/20 rounded text-green-500">
                   <ShieldCheck size={14} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-200">Schema scan completed on <span className="text-primary font-mono">alloydb-crm.public.users</span></p>
                   <p className="text-xs text-slate-500 mt-1">No new PII columns identified • System Automated • 1 hour ago</p>
                 </div>
               </div>

               <div className="flex gap-4 items-start p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                 <div className="mt-1 p-1.5 bg-amber-500/20 rounded text-amber-500">
                   <AlertTriangle size={14} />
                 </div>
                 <div>
                   <p className="text-sm text-slate-200">Potential new unstructured PII detected in <span className="text-primary font-mono">spanner-retail.feedback.comments</span></p>
                   <p className="text-xs text-slate-500 mt-1">NLP engine flagged High Confidence person names • Agent: RetailAgent • 4 hours ago</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass p-6 rounded-3xl border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Affected Domains</h3>
              <div className="space-y-3">
                 <div className="flexitems-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                   <div className="flex items-center gap-3">
                     <Users size={16} className="text-cyan-500" />
                     <div>
                       <p className="text-sm text-white font-medium">AlloyDB CRM</p>
                       <p className="text-[10px] text-slate-500">4 Masking target tables</p>
                     </div>
                   </div>
                   <CheckCircle2 size={16} className="text-green-500" />
                 </div>
                 
                 <div className="flexitems-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                   <div className="flex items-center gap-3">
                     <Store size={16} className="text-blue-500" />
                     <div>
                       <p className="text-sm text-white font-medium">Spanner Retail</p>
                       <p className="text-[10px] text-slate-500">1 Masking target table</p>
                     </div>
                   </div>
                   <CheckCircle2 size={16} className="text-green-500" />
                 </div>
                 
                 <div className="flexitems-center justify-between p-3 bg-slate-800/50 border-dashed border border-slate-700/50 opacity-60">
                   <div className="flex items-center gap-3">
                     <Database size={16} className="text-orange-500" />
                     <div>
                       <p className="text-sm text-white font-medium">Oracle ERP</p>
                       <p className="text-[10px] text-slate-400 italic">No exact matches found</p>
                     </div>
                   </div>
                 </div>
              </div>
           </div>

           <div className="glass p-6 rounded-3xl border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Efficacy Metrics</h3>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Total Queries Intercepted</span>
                      <span className="text-white font-mono">14,233</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="bg-primary h-full w-[75%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Fields Masked</span>
                      <span className="text-white font-mono">842K</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="bg-green-500 h-full w-[45%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">False Positive Rate</span>
                      <span className="text-white font-mono">~0.4%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full w-[15%]"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
