import React from 'react';
import { Search, Filter, Plus, ShieldCheck, AlertTriangle, FileText, CheckCircle2, ChevronRight, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { View, Policy } from '../types';
import { api } from '../utils/api';

export const GovernanceView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [policies, setPolicies] = React.useState<Policy[]>([
    { id: 'POL-001', name: 'PII Access Control (EMEA)', status: 'Active', domain: 'Oracle ERP', lastUpdated: '2h ago' },
    { id: 'POL-002', name: 'Cross-Border Data Transfer', status: 'Restricted', domain: 'Global', lastUpdated: '1d ago' },
    { id: 'POL-003', name: 'Financial Ledger Retention', status: 'Active', domain: 'Spanner', lastUpdated: '3d ago' },
    { id: 'POL-004', name: 'Marketing Segment Anonymization', status: 'Draft', domain: 'BigQuery', lastUpdated: '5h ago' },
  ]);

  React.useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await api.get('/api/governance/policies');
        if (data && data.rules) {
          setPolicies(data.rules);
        }
      } catch (err) {
        console.error('Failed to fetch policies:', err);
      }
    };
    fetchPolicies();
  }, []);

  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<Policy | null>(null);

  const handleSavePolicy = (policy: Policy) => {
    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === policy.id ? policy : p));
    } else {
      setPolicies([...policies, { ...policy, id: `POL-00${policies.length + 1}`, lastUpdated: 'Just now' }]);
    }
    setIsPolicyModalOpen(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full relative z-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Federated Governance</h2>
          <p className="text-slate-400">Manage access policies, compliance rules, and data residency globally.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('governance-detail')}
            className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <AlertTriangle size={16} className="text-yellow-500" /> View Compliance Alerts
          </button>
          <button 
            onClick={() => { setEditingPolicy(null); setIsPolicyModalOpen(true); }}
            className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> New Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary text-slate-200 placeholder:text-slate-500"
                placeholder="Search policies by ID, name, or domain..."
              />
            </div>
            <button className="glass px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors">
              <Filter size={18} /> Filter
            </button>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4 font-semibold">Policy Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Domain</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {policies.map((policy) => (
                  <tr 
                    key={policy.id} 
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => { setEditingPolicy(policy); setIsPolicyModalOpen(true); }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
                        <div>
                          <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{policy.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{policy.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        policy.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                        policy.status === 'Restricted' ? 'bg-red-500/10 text-red-500' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{policy.domain}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 flex justify-between items-center">
                      {policy.lastUpdated}
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Global Compliance</h3>
            <div className="flex items-center justify-center h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-slate-800" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" className="stroke-green-500" strokeWidth="12" fill="none" strokeDasharray="351.8" strokeDashoffset="17.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">95<span className="text-lg text-slate-500">%</span></span>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Active Policies</span>
                <span className="font-bold text-white">1,204</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Violations (30d)</span>
                <span className="font-bold text-yellow-500">12</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Audits Pending</span>
                <span className="font-bold text-primary">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PolicyModal 
        isOpen={isPolicyModalOpen} 
        onClose={() => setIsPolicyModalOpen(false)} 
        policy={editingPolicy}
        onSave={handleSavePolicy}
      />
    </div>
  );
};

const PolicyModal = ({ isOpen, onClose, policy, onSave }: { isOpen: boolean, onClose: () => void, policy: Policy | null, onSave: (p: Policy) => void }) => {
  const [formData, setFormData] = React.useState<any>({ 
    status: 'Draft', 
    name: '', 
    domain: '',
    classification: 'LOW',
    dataplexAspect: 'default',
    maskingRule: 'none'
  });

  React.useEffect(() => {
    if (policy) {
      setFormData({ ...policy, classification: 'HIGH', dataplexAspect: 'pii_aspect', maskingRule: 'redact' });
    } else {
      setFormData({ status: 'Draft', name: '', domain: '', classification: 'LOW', dataplexAspect: 'default', maskingRule: 'none' });
    }
  }, [policy, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">{policy ? 'Edit Federated Policy' : 'Create Dataplex Governance Rule'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Policy Name</label>
            <input 
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-primary focus:border-primary outline-none text-sm" 
              placeholder="e.g. EU General Data Masking"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Governed Domain</label>
            <select 
              value={formData.domain || ''}
              onChange={e => setFormData({...formData, domain: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-primary focus:border-primary outline-none appearance-none text-sm"
            >
              <option value="">Select Target Mesh...</option>
              <option value="Global">Global Federation</option>
              <option value="Oracle ERP">Oracle ERP Node</option>
              <option value="Spanner">Spanner Retail Node</option>
              <option value="BigQuery">BigQuery Lakehouse</option>
              <option value="AlloyDB">AlloyDB Vault</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sensitivity Class</label>
            <select 
              value={formData.classification}
              onChange={e => setFormData({...formData, classification: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-primary focus:border-primary outline-none appearance-none text-sm"
            >
              <option value="LOW">Low (Public Analytics)</option>
              <option value="MEDIUM">Medium (Internal Teams)</option>
              <option value="HIGH">High (Confidential / PII)</option>
              <option value="CRITICAL">Critical (Regulatory / Compliance)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Dataplex Tag / Aspect</label>
            <select 
              value={formData.dataplexAspect}
              onChange={e => setFormData({...formData, dataplexAspect: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-primary focus:border-primary outline-none appearance-none text-sm"
            >
              <option value="default">Standard Aspect</option>
              <option value="pii_aspect">dataplex.pii_aspect_v1</option>
              <option value="quality_aspect">dataplex.data_quality_v1</option>
              <option value="lineage_rule">dataplex.lineage_enforce</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data Masking Rule</label>
            <select 
              value={formData.maskingRule}
              onChange={e => setFormData({...formData, maskingRule: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-primary focus:border-primary outline-none appearance-none text-sm"
            >
              <option value="none">No Masking (Direct Visibility)</option>
              <option value="redact">Redact (••••••••)</option>
              <option value="hash">Hash (SHA-256)</option>
              <option value="nullify">Nullify (Replace with NULL)</option>
            </select>
          </div>
          <div className="md:col-span-2 mt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Activation State</label>
            <div className="flex gap-6 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              {['Active', 'Draft', 'Restricted'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value={status}
                    checked={formData.status === status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="text-primary focus:ring-primary bg-slate-800 border-slate-600" 
                  />
                  <span className="text-xs font-bold text-slate-300 uppercase">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={() => onSave(formData as Policy)}
            className="px-6 py-2.5 bg-primary hover:bg-primary/80 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            Deploy Aspect Policy
          </button>
        </div>
      </motion.div>
    </div>
  );
};
