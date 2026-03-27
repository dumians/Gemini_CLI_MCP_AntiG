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
import { Login } from './components/Login';
import { auth } from './utils/auth';
import type { View } from './types';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [pendingQuery, setPendingQuery] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => auth.isAuthenticated());
  const [user, setUser] = useState<any>(() => auth.getUser());

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

  const handleNavigate = (view: View, query?: string) => {
    setActiveView(view);
    if (query) {
      setPendingQuery(query);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30 flex overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative border-l border-white/5">
        <div className="absolute inset-0 pointer-events-none overflow-hidden isolate">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 transform-gpu" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] transform-gpu" />
        </div>

        <Header breadcrumbs={['MeshOS', activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')]} />

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
            {activeView === 'marketplace' && <MarketplaceView />}
            {activeView === 'governance' && <GovernanceView onNavigate={setActiveView} />}
            {activeView === 'governance-detail' && <GovernanceDetailView />}
            {activeView === 'spanner-detail' && <SpannerDetailView />}
            {activeView === 'bigquery-detail' && <BigQueryDetailView />}
            {activeView === 'oracle-detail' && <OracleDetailView />}
            {activeView === 'alloy-detail' && <AlloyDetailView />}
            {activeView === 'domains' && <DataDomainsView />}
            {activeView === 'cross-domain-inventory' && <CrossDomainInventoryView />}
            {activeView === 'admin-portal' && <AdminPortalView />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
