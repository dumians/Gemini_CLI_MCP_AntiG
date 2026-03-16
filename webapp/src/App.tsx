import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QueryAnalysis } from './components/QueryAnalysis';
import { DashboardHome } from './components/DashboardHome';
import { MarketplaceView } from './components/Marketplace';
import { GovernanceView, GovernanceDetailView } from './components/Governance';
import { DataDomainsView } from './components/DataDomains';
import { CrossDomainInventoryView } from './components/CrossDomainInventory';
import { SpannerDetailView } from './components/SpannerDetailView';
import { BigQueryDetailView } from './components/BigQueryDetailView';
import { OracleDetailView } from './components/OracleDetailView';
import { AlloyDetailView } from './components/AlloyDetailView';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { auth } from './utils/auth';
import type { View } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(auth.getUser());

  const breadcrumbs = useMemo(() => {
    switch (currentView) {
      case 'dashboard': return ['Dashboard'];
      case 'analysis': return ['Dashboard', 'Query Analysis'];
      case 'marketplace': return ['Dashboard', 'Data Marketplace'];
      case 'spanner-detail': return ['Dashboard', 'Spanner Retail'];
      case 'bigquery-detail': return ['Dashboard', 'BigQuery Analytics'];
      case 'oracle-detail': return ['Dashboard', 'Oracle ERP'];
      case 'alloy-detail': return ['Dashboard', 'AlloyDB CRM'];
      case 'cross-domain-inventory': return ['Dashboard', 'Cross-Domain Inventory'];
      case 'governance': return ['Dashboard', 'Federated Governance'];
      case 'governance-detail': return ['Dashboard', 'Federated Governance', 'Compliance Detail'];
      case 'data-domains': return ['Dashboard', 'Data Domains'];
      default: return ['Dashboard'];
    }
  }, [currentView]);

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-100">
      <Sidebar 
        activeView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header breadcrumbs={breadcrumbs} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full"
          >
            {currentView === 'dashboard' && <DashboardHome onNavigate={(v) => setCurrentView(v as View)} />}
            {currentView === 'analysis' && <QueryAnalysis />}
            {currentView === 'marketplace' && <MarketplaceView />}
            {currentView === 'governance' && <GovernanceView onNavigate={(v) => setCurrentView(v as View)} />}
            {currentView === 'governance-detail' && <GovernanceDetailView onNavigate={(v) => setCurrentView(v as View)} />}
            {currentView === 'spanner-detail' && <SpannerDetailView />}
            {currentView === 'bigquery-detail' && <BigQueryDetailView />}
            {currentView === 'oracle-detail' && <OracleDetailView />}
            {currentView === 'alloy-detail' && <AlloyDetailView />}
            {currentView === 'cross-domain-inventory' && <CrossDomainInventoryView />}
            {currentView === 'data-domains' && <DataDomainsView />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-auto px-12 py-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500"></div>
              <span>System Latency: 4ms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#3B82F6]"></div>
              <span>Data Integrity: 99.99%</span>
            </div>
          </div>
          <div>Last sync: 2 minutes ago</div>
        </footer>
      </main>
    </div>
  );
}

export default App;
