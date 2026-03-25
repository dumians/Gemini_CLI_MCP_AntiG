import React from 'react';
import { api } from '../utils/api';
import { Search, Filter, Lock, Unlock, Zap, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { GraphView } from './GraphView';

export const MarketplaceView = () => {
  const [activeTab, setActiveTab] = React.useState('products');

  const [products, setProducts] = React.useState<any[]>([]);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [productFormData, setProductFormData] = React.useState({ name: '', description: '', owner: '', tables: [] as string[], domain: '' });
  const [productLoading, setProductLoading] = React.useState(false);
  const [showPublishForm, setShowPublishForm] = React.useState(false);

  const fetchProducts = async () => {
    try {
      const data = await api.get('/api/products');
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

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
    fetchProducts();
  }, []);

  const handleEditProduct = (prod: any) => {
    setEditingProductId(prod.id);
    setProductFormData({ name: prod.name, description: prod.description || '', owner: prod.owner, tables: prod.tables || [], domain: prod.domain || '' });
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;
    setProductLoading(true);
    try {
      await api.put(`/api/products/${editingProductId}`, productFormData);
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
    } finally {
      setProductLoading(false);
    }
  };

  const handlePublishProduct = async () => {
    setProductLoading(true);
    try {
      await api.post('/api/products', productFormData);
      setShowPublishForm(false);
      setProductFormData({ name: '', description: '', owner: '', tables: [], domain: '' });
      fetchProducts();
    } catch (err) {
      console.error('Failed to publish product:', err);
    } finally {
      setProductLoading(false);
    }
  };

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
        <button 
          onClick={() => setActiveTab('consumer')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'consumer' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Subscriptions
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
        <button 
          onClick={() => setShowPublishForm(!showPublishForm)}
          className="glass px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors text-primary font-bold"
        >
          <Sparkles size={18} /> {showPublishForm ? 'Cancel Publish' : 'Publish Data Product'}
        </button>
        <button className="glass px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      {showPublishForm && (
        <div className="glass rounded-2xl border-slate-800 p-6 space-y-4 bg-slate-900/60 transition-all">
          <h3 className="text-lg font-bold text-white mb-4">Publish New Data Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Product Name</label>
              <input 
                type="text" 
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. Commerce Analytics Hub"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Owner Team</label>
              <input 
                type="text" 
                value={productFormData.owner}
                onChange={(e) => setProductFormData({ ...productFormData, owner: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. Analytics Ops"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-400">Description</label>
              <textarea 
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-20"
                placeholder="Describe the value of this data product..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Data Domain</label>
              <select 
                value={productFormData.domain}
                onChange={(e) => setProductFormData({ ...productFormData, domain: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select Domain</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Analytics">Analytics</option>
                <option value="HR">HR</option>
                <option value="CRM">CRM</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button 
              onClick={handlePublishProduct}
              disabled={productLoading}
              className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2"
            >
              {productLoading && <RefreshCw size={14} className="animate-spin" />}
              Publish To Marketplace
            </button>
            <button 
              onClick={() => setShowPublishForm(false)}
              className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((prod, i) => (
            <div key={i} className="glass rounded-2xl border-slate-800 p-6 flex flex-col hover:border-primary/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">{prod.name}</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{prod.owner}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditProduct(prod); }}
                  className="text-xs text-primary font-bold hover:text-primary/80"
                >
                  Edit
                </button>
              </div>
              
              {editingProductId === prod.id ? (
                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Editing Product {prod.id}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Product Name</label>
                      <input 
                        type="text" 
                        value={productFormData.name}
                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Description</label>
                      <textarea 
                        value={productFormData.description}
                        onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white h-16"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Owner</label>
                      <input 
                        type="text" 
                        value={productFormData.owner}
                        onChange={(e) => setProductFormData({ ...productFormData, owner: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Domain</label>
                      <input 
                        type="text" 
                        value={productFormData.domain}
                        onChange={(e) => setProductFormData({ ...productFormData, domain: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleUpdateProduct}
                      disabled={productLoading}
                      className="flex-1 bg-primary px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5"
                    >
                      {productLoading && <RefreshCw size={12} className="animate-spin" />}
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingProductId(null)}
                      className="flex-1 bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{prod.name} Data Product</h3>
                  <p className="text-xs text-slate-500 mb-6 flex-1">{prod.description || 'Unified profile of customers across CRM and ERP.'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs">
                    <span className="text-slate-400">Domain: <span className="text-white font-mono">{prod.domain || 'General'}</span></span>
                    <span className="text-slate-400">Owner: <span className="text-white font-mono">{prod.owner || 'Finance'}</span></span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs mt-2">
                    <span className="text-slate-400">Access: <span className="text-white font-mono">{prod.access || 'open'}</span></span>
                    <button className="px-4 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-all">
                      Access Data
                    </button>
                  </div>
                </>
              )}
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
        <div className="space-y-6">
          <div className="w-full">
            <h4 className="text-sm font-bold text-white mb-2">Contracts & Product Lineage Graph</h4>
            <div className="h-[400px]">
              <GraphView />
            </div>
          </div>

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
        </div>
      )}

      {activeTab === 'consumer' && (
        <div className="space-y-6">
          <section className="glass rounded-2xl border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Active Subscriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 2).map((prod: any, i: number) => (
                <div key={i} className="glass rounded-xl border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all bg-slate-900/40">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Zap size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-500">Subscribed</span>
                    </div>
                    <h4 className="text-md font-bold text-white mb-1">{prod.name}</h4>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{prod.description}</p>
                    
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>API Usage This Month</span>
                        <span className="font-mono text-white">{Math.floor(Math.random() * 5000) + 1000} calls</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Transferred</span>
                        <span className="font-mono text-white">{(Math.random() * 5).toFixed(2)} GB</span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-6 w-full text-xs font-medium text-slate-300 hover:text-white justify-center flex items-center gap-2 glass py-2 rounded-lg hover:bg-white/5 transition-colors">
                    Access Data Endpoint
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

// Simple stand-in icon for DB generic
const Database = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);
