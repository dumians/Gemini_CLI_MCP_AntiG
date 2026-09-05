import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { QueryAnalysisView } from './components/QueryAnalysisView';
import { MarketplaceView } from './components/MarketplaceView';
import { GovernanceView } from './components/GovernanceView';
import { GovernanceDetailView } from './components/GovernanceDetailView';
import { SpannerDetailView } from './components/SpannerDetailView';
import { BigQueryDetailView } from './components/BigQueryDetailView';
import { OracleDetailView } from './components/OracleDetailView';
import { AlloyDetailView } from './components/AlloyDetailView';
import { DataDomainsView } from './components/DataDomainsView';
import { CrossDomainInventoryView } from './components/CrossDomainInventoryView';
import { AdminPortalView } from './components/AdminPortalView';
import { LogsAndStatusView } from './components/LogsAndStatusView';
import { WarehouseDetailView } from './components/WarehouseDetailView';
import { NetSuiteDetailView } from './components/NetSuiteDetailView';
import { Login } from './components/Login';
import { auth } from './utils/auth';
import type { View } from './types';
import { clientConfigVerifier, ConfigVerificationReport } from './utils/configVerifier';
import { ConfigVerificationModal } from './components/ConfigVerificationModal';
import { AlertCircle } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [marketplaceInitialTab, setMarketplaceInitialTab] = useState('products');
  const [governanceInitialTab, setGovernanceInitialTab] = useState('dashboard');
  const [pendingQuery, setPendingQuery] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => auth.isAuthenticated());
  const [user, setUser] = useState<any>(() => auth.getUser());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Startup configuration verification state
  const [configReport, setConfigReport] = useState<ConfigVerificationReport | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isVerifyingConfig, setIsVerifyingConfig] = useState(false);

  useEffect(() => {
    clientConfigVerifier.verify().then(setConfigReport).catch(console.error);
    const unsub = clientConfigVerifier.subscribe(setConfigReport);
    return () => unsub();
  }, []);

  const handleReVerifyConfig = async () => {
    setIsVerifyingConfig(true);
    try {
      const rep = await clientConfigVerifier.verify(true);
      setConfigReport(rep);
    } finally {
      setIsVerifyingConfig(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    auth.clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleNavigate = (view: View, query?: string, tab?: string) => {
    setActiveView(view);
    if (query) {
      setPendingQuery(query);
    }
    if (tab && view === 'marketplace') {
      setMarketplaceInitialTab(tab);
    }
    if (tab && view === 'governance') {
      setGovernanceInitialTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-background-dark dark:text-slate-300 font-sans selection:bg-primary/30 flex overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative border-l border-slate-200 dark:border-white/5">
        <div className="absolute inset-0 pointer-events-none overflow-hidden isolate">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 transform-gpu" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] transform-gpu" />
        </div>

        <Header 
          breadcrumbs={['MeshOS', activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')]} 
          theme={theme}
          onThemeChange={toggleTheme}
          configReport={configReport}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
        />

        {configReport?.overallStatus === 'FAILED' && (
          <div className="bg-red-500/15 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-red-600 dark:text-red-400 z-10 relative">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle size={15} />
              <span>Configuration Access Failure: One or more critical startup configuration checks failed ({configReport.summary.failed} errors).</span>
            </div>
            <button onClick={() => setIsConfigModalOpen(true)} className="underline font-bold hover:text-red-300 cursor-pointer">
              Inspect Diagnostics
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto overflow-x-hidden relative scroll-smooth thin-scrollbar">
          <div className="min-h-full pb-12">
            {activeView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
            {activeView === 'query-analysis' && (
              <QueryAnalysisView 
                initialQuery={pendingQuery} 
                onShowSource={() => {}} 
                onClearQuery={() => setPendingQuery(undefined)}
              />
            )}
            {activeView === 'marketplace' && <MarketplaceView initialTab={marketplaceInitialTab} />}
            {activeView === 'governance' && <GovernanceView onNavigate={setActiveView} initialTab={governanceInitialTab} />}
            {activeView === 'governance-detail' && <GovernanceDetailView />}
            {activeView === 'spanner-detail' && <SpannerDetailView />}
            {activeView === 'bigquery-detail' && <BigQueryDetailView />}
            {activeView === 'oracle-detail' && <OracleDetailView />}
            {activeView === 'alloy-detail' && <AlloyDetailView />}
            {activeView === 'data-domains' && <DataDomainsView />}
            {activeView === 'warehouse-detail' && <WarehouseDetailView />}
            {activeView === 'netsuite-detail' && <NetSuiteDetailView />}
            {activeView === 'cross-domain-inventory' && <CrossDomainInventoryView onNavigate={handleNavigate} />}
            {activeView === 'logs-observability' && <LogsAndStatusView />}
            {activeView === 'admin-portal' && <AdminPortalView />}
          </div>
        </div>
      </main>

      <ConfigVerificationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        report={configReport}
        onReVerify={handleReVerifyConfig}
        isVerifying={isVerifyingConfig}
      />
    </div>
  );
}

export default App;
