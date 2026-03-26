import React from 'react';
import { 
  LayoutDashboard, Database, Store, BarChart3, Users, 
  ShieldCheck, Globe, AlertTriangle, X, Package, Settings
} from 'lucide-react';
import type { View } from '../types';

export const Sidebar = ({ activeView, onViewChange, onOpenSettings, onLogout }: { activeView: View, onViewChange: (view: View) => void, onOpenSettings: () => void, onLogout: () => void }) => {
  const [openDomains, setOpenDomains] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, status: 'online' },
    { id: 'marketplace', label: 'Data Marketplace', icon: Store, status: 'online' },
    { id: 'governance', label: 'Federated Governance', icon: ShieldCheck, status: 'online' },
    { 
      id: 'data-domains', 
      label: 'Data Domains', 
      icon: Globe, 
      status: 'online',
      children: [
        { id: 'oracle-detail', label: 'Oracle ERP', icon: Database, status: 'online' },
        { id: 'spanner-detail', label: 'Spanner Retail', icon: Store, status: 'error' },
        { id: 'bigquery-detail', label: 'BigQuery Analytics', icon: BarChart3, status: 'online' },
        { id: 'alloy-detail', label: 'AlloyDB CRM', icon: Users, status: 'warning' },
      ]
    },
    { id: 'cross-domain-inventory', label: 'Cross-Domain Inventory', icon: Package, status: 'online' },
    { id: 'admin-portal', label: 'Admin Portal', icon: Settings, status: 'online' },
  ];

  return (
    <aside className="w-72 flex-shrink-0 border-r border-slate-800 bg-background-dark flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Database size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-100 text-base font-bold leading-none">Data Agent</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">v2.4.0-enterprise</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => item.children ? setOpenDomains(!openDomains) : onViewChange(item.id as View)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                activeView === item.id || (item.id === 'governance' && activeView === 'governance-detail') || (item.children && item.children.some(c => c.id === activeView))
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center">
                {item.children && (
                  <span className="text-xs transition-transform duration-300 mr-2" style={{ transform: openDomains ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                )}
                <div className="flex items-center">
                  {item.status === 'online' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Live</span>
                      <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                  )}
                  {item.status === 'warning' && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-yellow-500" />
                      <div className="size-1.5 rounded-full bg-yellow-500" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-1.5">
                      <X size={12} className="text-red-500" />
                      <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </button>
            {item.children && openDomains && (
              <div className="pl-6 mt-1 space-y-1">
                {item.children.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onViewChange(subItem.id as View)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs ${
                      activeView === subItem.id
                        ? 'bg-primary/5 text-primary font-medium' 
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <subItem.icon size={14} />
                      <span>{subItem.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRWM7USIMO4BvNO9bl2IpBrLCNCAAaKCKX_KeZRjwh8xcAWloetSi3lnX3WYNUQvlgZGknXPnCxGCnfJgprzFdO8Tpm8rlUccNINH2qUwxF9JrtmHMyv-KFCABG9hzrTq29iOd74gxp9ge9zRNgmT3TYBDSt2vbByJ6DZa4Jhjx16AammwoXX6Yv4gTOApEeDo9xPGXgZbTGzyQ1SRgeSDduU63hAiWlEai3jgKy1bXxrrfUr76zliot1_OF4PpgufENojPWgm9e0" 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-100">Enterprise Admin</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Platinum Tier</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onOpenSettings}
              className="flex-1 py-2 bg-slate-700 text-xs font-medium rounded-lg hover:bg-primary transition-all"
            >
              Settings
            </button>
            <button 
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 text-xs font-medium rounded-lg text-red-400 hover:bg-slate-700 transition-all border border-slate-700 hover:border-red-900/50"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
