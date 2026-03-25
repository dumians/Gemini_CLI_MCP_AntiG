import React from 'react';
import { Search, Filter, Lock, Unlock, Zap, Shield, Sparkles } from 'lucide-react';

export const MarketplaceView = () => {
  const [activeTab, setActiveTab] = React.useState('products');

  const dataProducts = [
    { id: 1, name: 'Global Retail Sales - Realtime', owner: 'Commerce Team', status: 'approved', access: 'open', risk: 'low', type: 'Stream' },
    { id: 2, name: 'Customer Demographic Master', owner: 'Marketing Data', status: 'approved', access: 'restricted', risk: 'high', type: 'BigQuery' },
    { id: 3, name: 'Supply Chain Logistics (EMEA)', owner: 'Operations', status: 'pending', access: 'restricted', risk: 'medium', type: 'Spanner' },
    { id: 4, name: 'Q3 Financial Ledgers', owner: 'Finance Dept', status: 'approved', access: 'locked', risk: 'critical', type: 'Oracle' },
    { id: 5, name: 'Website Interaction Events', owner: 'Digital Team', status: 'approved', access: 'open', risk: 'low', type: 'Stream' },
    { id: 6, name: 'B2B CRM Pipeline', owner: 'Sales Ops', status: 'review', access: 'restricted', risk: 'medium', type: 'AlloyDB' },
  ];

  const subscribers = [
    { id: 'SUB-01', user: 'Mark Greene', role: 'Analytics Lead', product: 'Global Retail Sales', domain: 'Marketing', efficiency: 'High' },
    { id: 'SUB-02', user: 'Elena Vance', role: 'Finance Analyst', product: 'Q3 Financial Ledgers', domain: 'Finance', efficiency: 'Low' },
    { id: 'SUB-03', user: 'John Coburn', role: 'Ops Manager', product: 'Supply Chain Logistics', domain: 'Operations', efficiency: 'Medium' }
  ];

  const [contracts, setContracts] = React.useState<any[]>([]);
  const [editingContractId, setEditingContractId] = React.useState<string | null>(null);
  const [contractFormData, setContractFormData] = React.useState({ status: '', sla: '', privacy: '' });
  const [contractLoading, setContractLoading] = React.useState(false);

  const fetchContracts = async () => {
    try {
      const data = await api.get('/api/contracts');
      setContracts(data.contracts || []);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    }
  };

  React.useEffect(() => {
    fetchContracts();
  }, []);

  const handleEditContract = (ctr: any) => {
    setEditingContractId(ctr.id);
    setContractFormData({ status: ctr.status, sla: ctr.sla, privacy: ctr.privacy || '' });
  };

  const handleUpdateContract = async () => {
    if (!editingContractId) return;
    setContractLoading(true);
    try {
      await api.put(`/api/contracts/${editingContractId}`, contractFormData);
      setEditingContractId(null);
      fetchContracts();
    } catch (err) {
      console.error('Failed to update contract:', err);
    } finally {
      setContractLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Internal Data Marketplace</h2>
          <p className="text-slate-400">Discover, request access, and consume governed enterprise data products.</p>
        </div>
        <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
          <Sparkles size={16} /> Publish Product
        </button>
      </div>

      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Data Products
        </button>
        <button 
          onClick={() => setActiveTab('subscribers')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'subscribers' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Marketplace Subscribers
        </button>
        <button 
          onClick={() => setActiveTab('contracts')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Data Contracts
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary text-slate-200 placeholder:text-slate-500"
            placeholder="Search thousands of data products by name, tag, or owner..."
          />
        </div>
        <button className="glass px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dataProducts.map((prod, i) => (
            <div key={i} className="glass rounded-2xl border-slate-800 p-6 flex flex-col hover:border-primary/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${
                  prod.type === 'Stream' ? 'bg-cyan-500/10 text-cyan-400' :
                  prod.type === 'BigQuery' ? 'bg-purple-500/10 text-purple-400' :
                  prod.type === 'Spanner' ? 'bg-blue-500/10 text-blue-400' :
                  prod.type === 'Oracle' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {prod.type === 'Stream' ? <Zap size={20} /> : <Database size={20} />}
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  prod.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                  prod.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {prod.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{prod.name}</h3>
              <p className="text-xs text-slate-500 mb-6 flex-1">Maintained by {prod.owner}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    {prod.access === 'open' ? <Unlock size={14} className="text-green-500" /> : 
                     prod.access === 'locked' ? <Lock size={14} className="text-red-500" /> :
                     <Shield size={14} className="text-yellow-500" />}
                    <span className="capitalize">{prod.access}</span>
                  </span>
                </div>
                <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  prod.access === 'open' ? 'bg-primary/20 hover:bg-primary/30 text-primary' :
                  prod.access === 'locked' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                  'bg-slate-800 hover:bg-slate-700 text-white'
                }`}>
                  {prod.access === 'open' ? 'Access Data' : 
                   prod.access === 'locked' ? 'Restricted' : 'Request Access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="glass rounded-2xl border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscribers.map((sub, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{sub.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{sub.user}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{sub.role}</td>
                  <td className="px-6 py-4 text-xs text-primary">{sub.product}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-[10px] uppercase px-2 py-1 rounded-full ${
                      sub.efficiency === 'High' ? 'bg-green-500/10 text-green-500' :
                      sub.efficiency === 'Low' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {sub.efficiency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((ctr, i) => (
            <div key={i} className="glass rounded-2xl border-slate-800 p-6 flex flex-col hover:border-primary/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditContract(ctr)}
                    className="text-xs text-primary hover:text-primary/80 font-bold"
                  >
                    Edit
                  </button>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ctr.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {ctr.status}
                  </span>
                </div>
              </div>

              {editingContractId === ctr.id ? (
                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-bold text-white mb-2">Editing Contract {ctr.id}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Status</label>
                      <input 
                        type="text" 
                        value={contractFormData.status}
                        onChange={(e) => setContractFormData({ ...contractFormData, status: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400">SLA</label>
                      <input 
                        type="text" 
                        value={contractFormData.sla}
                        onChange={(e) => setContractFormData({ ...contractFormData, sla: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Privacy Scope</label>
                      <input 
                        type="text" 
                        value={contractFormData.privacy}
                        onChange={(e) => setContractFormData({ ...contractFormData, privacy: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleUpdateContract}
                      disabled={contractLoading}
                      className="flex-1 bg-primary px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5"
                    >
                      {contractLoading && <RefreshCw size={12} className="animate-spin" />}
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingContractId(null)}
                      className="flex-1 bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{ctr.product} Data Contract</h3>
                  <p className="text-xs text-slate-500 mb-6 flex-1">Subscribed by: {ctr.subscriber}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs">
                    <span className="text-slate-400">SLA: <span className="text-white font-mono">{ctr.sla}</span></span>
                    <span className="text-slate-400">Privacy: <span className="text-white font-mono">{ctr.privacy}</span></span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple stand-in icon for DB generic
const Database = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);
