import React from 'react';
import { 
  Search, Filter, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  ChevronRight, X, RefreshCw, Sparkles, Check, Percent, History, 
  ShieldAlert, ArrowRight, HelpCircle, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../utils/api';

type TabType = 'dashboard' | 'descriptions' | 'glossary' | 'policy' | 'trust';

interface GapItem {
  Table: string;
  Column: string;
  Type: string;
}

interface CandidateItem {
  Select?: boolean;
  "Target Column": string;
  Source: string;
  "Source Column": string;
  Confidence: number;
  "Proposed Description": string;
  Type: string;
}

interface GlossaryRecommendation {
  Select?: boolean;
  Column: string;
  "Suggested Term": string;
  Confidence: number;
  Rationale: string;
  "Term ID": string;
}

interface PolicyRecommendation {
  Select?: boolean;
  "Target Column": string;
  "Source Table": string;
  "Source Column": string;
  "Policy Tags": string;
  Recommendation: string;
  Logic: string;
  "Access Summary": string;
}

interface TrustItem {
  Column: string;
  "Trust Score": number;
  Badge: string;
  Trend: string;
  "Bonus (Remediation)": string;
  "Upstream Sources": string;
}

export const GovernanceView = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');
  const [datasetId, setDatasetId] = React.useState('marketing_edw');
  const [isScanning, setIsScanning] = React.useState(false);
  
  // Scan Results / Metrics
  const [descGaps, setDescGaps] = React.useState<GapItem[]>([]);
  const [glossaryGaps, setGlossaryGaps] = React.useState<GapItem[]>([]);
  const [orphans, setOrphans] = React.useState<GapItem[]>([]);
  const [scannedOnce, setScannedOnce] = React.useState(false);

  // Tab-Specific States
  const [selectedTable, setSelectedTable] = React.useState('campaign_metrics');
  const [isLoadingTab, setIsLoadingTab] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Candidates & Recommendations
  const [descCandidates, setDescCandidates] = React.useState<CandidateItem[]>([]);
  const [glossaryRecos, setGlossaryRecos] = React.useState<GlossaryRecommendation[]>([]);
  const [policyRecos, setPolicyRecos] = React.useState<PolicyRecommendation[]>([]);
  const [additionalReaders, setAdditionalReaders] = React.useState('');
  const [trustMetrics, setTrustMetrics] = React.useState<TrustItem[]>([]);

  // Compliance Alerts States
  const [isAlertsOpen, setIsAlertsOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<any[]>([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/api/governance/compliance-alerts');
      if (res && res.status === 'success') {
        setAlerts(res.alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  React.useEffect(() => {
    fetchAlerts();
  }, []);

  // Trigger Global Gap Scan
  const handleScan = async () => {
    setIsScanning(true);
    setActionMessage(null);
    try {
      const res = await api.get(`/api/governance/scan?dataset=${datasetId}`);
      if (res && res.status === 'success') {
        const gaps = res.gaps || [];
        setDescGaps(gaps.filter((g: any) => g.Table === 'campaign_metrics' || g.Table === 'customer_segments' || g.Table === 'web_events'));
        
        // Simulate Glossary gaps for demo cohesion based on technical gaps
        const gloss = gaps.filter((_: any, i: number) => i % 2 === 0);
        setGlossaryGaps(gloss);
        
        const orph = gaps.filter((_: any, i: number) => i % 3 === 0);
        setOrphans(orph);
        setScannedOnce(true);
      }
    } catch (err: any) {
      console.error("Scan failed:", err);
      setActionMessage({ text: `Scan failed: ${err.message || 'Unknown error'}`, isError: true });
    } finally {
      setIsScanning(false);
    }
  };

  // Fetch Tab Data (Lineage Descriptions, Glossary matching, Policies, DQ scores)
  const loadTabData = async (tab: TabType, table: string) => {
    setIsLoadingTab(true);
    setActionMessage(null);
    try {
      if (tab === 'descriptions') {
        const res = await api.get(`/api/governance/preview-propagation?dataset=${datasetId}&table=${table}`);
        if (res && res.status === 'success') {
          setDescCandidates((res.candidates || []).map((c: any) => ({ ...c, Select: true })));
        }
      } else if (tab === 'glossary') {
        const res = await api.get(`/api/governance/glossary-recommend?dataset=${datasetId}&table=${table}`);
        if (res && res.status === 'success') {
          setGlossaryRecos((res.recommendations || []).map((r: any) => ({ ...r, Select: true })));
        }
      } else if (tab === 'policy') {
        const res = await api.get(`/api/governance/policy-recommend?dataset=${datasetId}&table=${table}`);
        if (res && res.status === 'success') {
          setPolicyRecos((res.recommendations || []).map((p: any) => ({ ...p, Select: true })));
        }
      } else if (tab === 'trust') {
        const res = await api.get(`/api/governance/dq-propagate?dataset=${datasetId}&table=${table}`);
        if (res && res.status === 'success') {
          setTrustMetrics(res.columnsTrust || []);
        }
      }
    } catch (err: any) {
      console.error(`Load failed for tab ${tab}:`, err);
      setActionMessage({ text: `Failed to load recommendations: ${err.message}`, isError: true });
    } finally {
      setIsLoadingTab(false);
    }
  };

  React.useEffect(() => {
    if (activeTab !== 'dashboard') {
      loadTabData(activeTab, selectedTable);
    }
  }, [activeTab, selectedTable]);

  // Apply Description Updates
  const handleApplyDescriptions = async () => {
    const selected = descCandidates.filter(c => c.Select);
    if (selected.length === 0) {
      setActionMessage({ text: "Please select at least one description to apply.", isError: true });
      return;
    }
    
    setIsLoadingTab(true);
    setActionMessage(null);
    try {
      const updates = selected.map(c => ({
        table: selectedTable,
        column: c["Target Column"],
        description: c["Proposed Description"]
      }));
      const res = await api.post('/api/governance/apply-propagation', { dataset: datasetId, updates });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Successfully propagated ${updates.length} descriptions to BigQuery!` });
        // Refresh candidates
        loadTabData('descriptions', selectedTable);
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to apply descriptions: ${err.message}`, isError: true });
    } finally {
      setIsLoadingTab(false);
    }
  };

  // Apply Glossary Mappings to Dataplex
  const handleApplyGlossary = async () => {
    const selected = glossaryRecos.filter(g => g.Select);
    if (selected.length === 0) {
      setActionMessage({ text: "Please select at least one mapping to deploy.", isError: true });
      return;
    }

    setIsLoadingTab(true);
    setActionMessage(null);
    try {
      const updates = selected.map(g => ({
        column: g.Column,
        term_id: g["Term ID"],
        term_display: g["Suggested Term"]
      }));
      const res = await api.post('/api/governance/glossary-apply', { dataset: datasetId, table: selectedTable, updates });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Successfully deployed ${updates.length} glossary EntryLinks to Dataplex Catalog!` });
        loadTabData('glossary', selectedTable);
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to deploy glossary terms: ${err.message}`, isError: true });
    } finally {
      setIsLoadingTab(false);
    }
  };

  // Apply Policy Tags in BigQuery
  const handleApplyPolicies = async () => {
    const selected = policyRecos.filter(p => p.Select);
    if (selected.length === 0) {
      setActionMessage({ text: "Please select at least one policy recommendation to apply.", isError: true });
      return;
    }

    setIsLoadingTab(true);
    setActionMessage(null);
    try {
      const updates = selected.map(p => ({
        table: selectedTable,
        column: p["Target Column"],
        policy_tag: p["Policy Tags"],
        readers: additionalReaders
      }));
      const res = await api.post('/api/governance/policy-apply', { dataset: datasetId, updates });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Successfully assigned ${updates.length} Policy Tags in BigQuery!` });
        loadTabData('policy', selectedTable);
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to apply policy tags: ${err.message}`, isError: true });
    } finally {
      setIsLoadingTab(false);
    }
  };

  // Helpers to toggle individual selects
  const toggleSelectAll = (list: any[], setList: any, selectState: boolean) => {
    setList(list.map(item => ({ ...item, Select: selectState })));
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <ShieldCheck className="text-primary" size={32} /> Data Mesh Governance & Metadata Propagation
          </h2>
          <p className="text-slate-400">Intelligently scan data assets, propagate column descriptions recursively, tag PII dynamically, and monitor data quality scores.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => { fetchAlerts(); setIsAlertsOpen(true); }}
            className="glass px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 transition-all flex items-center gap-2 text-slate-300 hover:text-white relative"
          >
            <AlertTriangle size={16} className="text-yellow-500" /> View Compliance Alerts
            {alerts.filter(a => a.status === 'PENDING_REVIEW').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {alerts.filter(a => a.status === 'PENDING_REVIEW').length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Dataset:</span>
            <input 
              type="text"
              value={datasetId}
              onChange={e => setDatasetId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-sm font-mono text-slate-200 focus:outline-none focus:border-primary w-36"
            />
          </div>
        </div>
      </div>

      {/* Message Center */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex justify-between items-center ${
              actionMessage.isError 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-green-500/10 border-green-500/30 text-green-400'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {actionMessage.isError ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
              {actionMessage.text}
            </div>
            <button onClick={() => setActionMessage(null)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {(['dashboard', 'descriptions', 'glossary', 'policy', 'trust'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 uppercase tracking-wider ${
              activeTab === tab 
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 rounded-t-xl'
            }`}
          >
            {tab === 'dashboard' && '📋 Estate Dashboard'}
            {tab === 'descriptions' && '🧬 Description Propagation'}
            {tab === 'glossary' && '📖 Business Glossary'}
            {tab === 'policy' && '🛡️ Policy Tag Sync'}
            {tab === 'trust' && '💎 Data Trust Center'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        
        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Scan controller */}
            <div className="glass rounded-2xl border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Scan for Governance Gaps</h3>
                <p className="text-sm text-slate-400">Inspects schemas for missing column descriptions and unmapped Business Terms.</p>
              </div>
              <button 
                onClick={handleScan}
                disabled={isScanning}
                className="bg-primary hover:bg-primary/80 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Scanning Data Estate...' : 'Analyze Governance Health'}
              </button>
            </div>

            {/* Metrics */}
            {scannedOnce && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border-slate-800 flex flex-col items-center text-center">
                  <span className="text-4xl font-bold text-red-500 mb-2">{descGaps.length}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description Gaps</span>
                  <p className="text-xs text-slate-500 mt-2">Columns missing technical documentation schemas.</p>
                </div>
                <div className="glass p-6 rounded-2xl border-slate-800 flex flex-col items-center text-center">
                  <span className="text-4xl font-bold text-amber-500 mb-2">{glossaryGaps.length}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Glossary Gaps</span>
                  <p className="text-xs text-slate-500 mt-2">Columns with missing links to business terminology.</p>
                </div>
                <div className="glass p-6 rounded-2xl border-slate-800 flex flex-col items-center text-center">
                  <span className="text-4xl font-bold text-coral mb-2">{orphans.length}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orphaned Assets</span>
                  <p className="text-xs text-slate-500 mt-2">Critical columns lacking both metadata layers.</p>
                </div>
              </div>
            )}

            {/* Gap Tables */}
            {scannedOnce && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Technical Gaps */}
                <div className="glass rounded-2xl border-slate-800 overflow-hidden p-6 space-y-4">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Technical Schema Gaps ({descGaps.length})
                  </h4>
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                          <th className="pb-3">Table</th>
                          <th className="pb-3">Column</th>
                          <th className="pb-3">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                        {descGaps.map((gap, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-2.5 font-mono text-xs text-slate-400">{gap.Table}</td>
                            <td className="py-2.5 font-medium text-slate-200">{gap.Column}</td>
                            <td className="py-2.5"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-primary">{gap.Type}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Business Term Gaps */}
                <div className="glass rounded-2xl border-slate-800 overflow-hidden p-6 space-y-4">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" /> Glossary Term Gaps ({glossaryGaps.length})
                  </h4>
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                          <th className="pb-3">Table</th>
                          <th className="pb-3">Column</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                        {glossaryGaps.map((gap, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="py-2.5 font-mono text-xs text-slate-400">{gap.Table}</td>
                            <td className="py-2.5 font-medium text-slate-200">{gap.Column}</td>
                            <td className="py-2.5"><span className="bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Unmapped</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!scannedOnce && (
              <div className="flex flex-col items-center justify-center py-20 text-center glass border-slate-800 rounded-2xl">
                <AlertTriangle size={40} className="text-slate-500 mb-4" />
                <h4 className="font-bold text-white text-lg">No scan run yet</h4>
                <p className="text-sm text-slate-400 mt-1">Click the scan button above to introspect schema health on BQ.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. Tab Controllers & Select Table */}
        {activeTab !== 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Table Selector Header */}
            <div className="glass border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-lg uppercase tracking-wider">
                  {activeTab === 'descriptions' && '🧬 Description Lineage Preview'}
                  {activeTab === 'glossary' && '📖 Business Term Auto-Mapping'}
                  {activeTab === 'policy' && '🛡️ Policy Tag Propagations'}
                  {activeTab === 'trust' && '💎 Derived trust center audits'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure table-specific recommendations.</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase">Target Table:</span>
                <select 
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-bold px-3 py-1 outline-none focus:border-primary cursor-pointer"
                >
                  <option value="campaign_metrics">campaign_metrics (Derived)</option>
                  <option value="transactions">transactions (Source)</option>
                  <option value="customers">customers (Source)</option>
                  <option value="customer_segments">customer_segments (Source)</option>
                </select>
              </div>
            </div>

            {/* Detailed Sub Tab content */}
            {isLoadingTab ? (
              <div className="flex flex-col items-center justify-center py-20 glass border-slate-800 rounded-2xl text-center">
                <RefreshCw size={32} className="animate-spin text-primary mb-4" />
                <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">Analyzing lineage maps & AI schemas...</span>
              </div>
            ) : (
              <div>
                {/* Description tab */}
                {activeTab === 'descriptions' && (
                  <div className="space-y-6">
                    {descCandidates.length > 0 ? (
                      <div className="glass rounded-2xl border-slate-800 p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleSelectAll(descCandidates, setDescCandidates, true)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Select All
                            </button>
                            <button 
                              onClick={() => toggleSelectAll(descCandidates, setDescCandidates, false)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Deselect All
                            </button>
                          </div>
                          <button 
                            onClick={handleApplyDescriptions}
                            className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all"
                          >
                            <Check size={14} /> Propagate Selected Descriptions
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                <th className="pb-3 w-12 text-center">Select</th>
                                <th className="pb-3">Target Column</th>
                                <th className="pb-3">Upstream Source</th>
                                <th className="pb-3">Source Column</th>
                                <th className="pb-3 w-24 text-center">Confidence</th>
                                <th className="pb-3">Proposed Description (Click to Edit)</th>
                                <th className="pb-3 w-32 text-center">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                              {descCandidates.map((candidate, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="py-3.5 text-center">
                                    <input 
                                      type="checkbox"
                                      checked={!!candidate.Select}
                                      onChange={() => {
                                        setDescCandidates(descCandidates.map((c, i) => i === idx ? { ...c, Select: !c.Select } : c));
                                      }}
                                      className="w-4 h-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary"
                                    />
                                  </td>
                                  <td className="py-3.5 font-medium text-slate-200">{candidate["Target Column"]}</td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400 max-w-[150px] truncate" title={candidate.Source}>{candidate.Source.split('.').pop()}</td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400">{candidate["Source Column"]}</td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                      candidate.Confidence > 0.9 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                      {Math.round(candidate.Confidence * 100)}%
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-2">
                                    <input 
                                      type="text"
                                      value={candidate["Proposed Description"]}
                                      onChange={e => {
                                        setDescCandidates(descCandidates.map((c, i) => i === idx ? { ...c, "Proposed Description": e.target.value } : c));
                                      }}
                                      className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary w-full max-w-[350px]"
                                    />
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-primary">{candidate.Type}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 glass border-slate-800 rounded-2xl text-center">
                        <CheckCircle2 size={40} className="text-green-500 mb-4" />
                        <h4 className="font-bold text-white text-lg">No lineage updates needed</h4>
                        <p className="text-sm text-slate-400 mt-1">All target columns for table '{selectedTable}' have schema descriptions already.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Glossary tab */}
                {activeTab === 'glossary' && (
                  <div className="space-y-6">
                    {glossaryRecos.length > 0 ? (
                      <div className="glass rounded-2xl border-slate-800 p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleSelectAll(glossaryRecos, setGlossaryRecos, true)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Select All
                            </button>
                            <button 
                              onClick={() => toggleSelectAll(glossaryRecos, setGlossaryRecos, false)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Deselect All
                            </button>
                          </div>
                          <button 
                            onClick={handleApplyGlossary}
                            className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all"
                          >
                            <Sparkles size={14} /> Deploy EntryLinks to Dataplex
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                <th className="pb-3 w-12 text-center">Select</th>
                                <th className="pb-3">Technical Column</th>
                                <th className="pb-3">Suggested Glossary Term</th>
                                <th className="pb-3 w-24 text-center">Match Score</th>
                                <th className="pb-3">Semantic Rationale</th>
                                <th className="pb-3">Term Resource ID</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                              {glossaryRecos.map((reco, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="py-3.5 text-center">
                                    <input 
                                      type="checkbox"
                                      checked={!!reco.Select}
                                      onChange={() => {
                                        setGlossaryRecos(glossaryRecos.map((r, i) => i === idx ? { ...r, Select: !r.Select } : r));
                                      }}
                                      className="w-4 h-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary"
                                    />
                                  </td>
                                  <td className="py-3.5 font-medium text-slate-200">{reco.Column}</td>
                                  <td className="py-3.5 font-bold text-slate-200 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-500" /> {reco["Suggested Term"]}
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                      reco.Confidence > 0.9 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                      {Math.round(reco.Confidence * 100)}%
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-xs text-slate-400 max-w-[250px] truncate" title={reco.Rationale}>{reco.Rationale}</td>
                                  <td className="py-3.5 font-mono text-[10px] text-slate-500 max-w-[200px] truncate" title={reco["Term ID"]}>{reco["Term ID"]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 glass border-slate-800 rounded-2xl text-center">
                        <CheckCircle2 size={40} className="text-green-500 mb-4" />
                        <h4 className="font-bold text-white text-lg">All Columns Integrated</h4>
                        <p className="text-sm text-slate-400 mt-1">All active columns are already linked to the Business Glossary catalog.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Policy Tag tab */}
                {activeTab === 'policy' && (
                  <div className="space-y-6">
                    {policyRecos.length > 0 ? (
                      <div className="glass rounded-2xl border-slate-800 p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleSelectAll(policyRecos, setPolicyRecos, true)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Select All
                            </button>
                            <button 
                              onClick={() => toggleSelectAll(policyRecos, setPolicyRecos, false)}
                              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Deselect All
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={additionalReaders}
                              onChange={e => setAdditionalReaders(e.target.value)}
                              placeholder="Comma-separated reader group emails..."
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-56 focus:border-primary"
                            />
                            <button 
                              onClick={handleApplyPolicies}
                              className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all shrink-0"
                            >
                              <Check size={14} /> Deploy Policy Tags
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead>
                              <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                <th className="pb-3 w-12 text-center">Select</th>
                                <th className="pb-3">Target Column</th>
                                <th className="pb-3">Source Table</th>
                                <th className="pb-3">Source Column</th>
                                <th className="pb-3">Policy Tag</th>
                                <th className="pb-3">Recommendation</th>
                                <th className="pb-3">SQL Logic Assessment</th>
                                <th className="pb-3">Active Access Summary</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                              {policyRecos.map((reco, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="py-3.5 text-center">
                                    <input 
                                      type="checkbox"
                                      checked={!!reco.Select}
                                      onChange={() => {
                                        setPolicyRecos(policyRecos.map((p, i) => i === idx ? { ...p, Select: !p.Select } : p));
                                      }}
                                      className="w-4 h-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary"
                                    />
                                  </td>
                                  <td className="py-3.5 font-medium text-slate-200">{reco["Target Column"]}</td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400">{reco["Source Table"].split('.').pop()}</td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400">{reco["Source Column"]}</td>
                                  <td className="py-3.5 font-mono text-[10px] text-amber-500 max-w-[150px] truncate" title={reco["Policy Tags"]}>{reco["Policy Tags"]}</td>
                                  <td className="py-3.5">
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      reco.Recommendation === 'Propagate' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                      {reco.Recommendation}
                                    </span>
                                  </td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400 max-w-[150px] truncate" title={reco.Logic}>{reco.Logic}</td>
                                  <td className="py-3.5 text-xs font-semibold text-slate-400">{reco["Access Summary"]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 glass border-slate-800 rounded-2xl text-center">
                        <CheckCircle2 size={40} className="text-green-500 mb-4" />
                        <h4 className="font-bold text-white text-lg">No sensitive data detected</h4>
                        <p className="text-sm text-slate-400 mt-1">No un-tagged column has PII references upstream for table '{selectedTable}'.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Trust Center tab */}
                {activeTab === 'trust' && (
                  <div className="space-y-6">
                    {trustMetrics.length > 0 ? (
                      <div className="glass rounded-2xl border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                          <h4 className="font-bold text-white text-base flex items-center gap-2">
                            <History size={18} className="text-primary" /> Derived DQ Trust Scores Audit
                          </h4>
                          <span className="bg-slate-800 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-400">Lineage Scoring: Min Upstream Leaves</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                <th className="pb-3">Column</th>
                                <th className="pb-3 w-32 text-center">Trust Score</th>
                                <th className="pb-3 w-32 text-center">Rating Grade</th>
                                <th className="pb-3 w-32 text-center">Trend Direction</th>
                                <th className="pb-3 w-44 text-center">Remediation Bonus</th>
                                <th className="pb-3">Contributing Upstream Sources</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                              {trustMetrics.map((metric, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="py-3.5 font-medium text-slate-200">{metric.Column}</td>
                                  <td className="py-3.5 text-center font-bold text-white text-base font-mono">
                                    {metric["Trust Score"].toFixed(2)}
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                      metric.Badge.includes('High') ? 'bg-green-500/10 text-green-500' :
                                      metric.Badge.includes('Medium') ? 'bg-yellow-500/10 text-yellow-500' :
                                      'bg-red-500/10 text-red-500'
                                    }`}>
                                      {metric.Badge}
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center justify-center gap-1 ${
                                      metric.Trend === 'Improving' ? 'text-green-500' :
                                      metric.Trend === 'Degrading' ? 'text-red-500' : 'text-slate-400'
                                    }`}>
                                      {metric.Trend === 'Improving' && '↑'}
                                      {metric.Trend === 'Degrading' && '↓'}
                                      {metric.Trend === 'Stable' && '•'}
                                      {metric.Trend}
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                      metric["Bonus (Remediation)"] !== 'None' ? 'bg-primary/10 text-primary' : 'text-slate-500'
                                    }`}>
                                      {metric["Bonus (Remediation)"]}
                                    </span>
                                  </td>
                                  <td className="py-3.5 font-mono text-xs text-slate-400 max-w-[250px] truncate" title={metric["Upstream Sources"]}>
                                    {metric["Upstream Sources"]}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 glass border-slate-800 rounded-2xl text-center">
                        <AlertTriangle size={40} className="text-slate-500 mb-4" />
                        <h4 className="font-bold text-white text-lg">No metrics available</h4>
                        <p className="text-sm text-slate-400 mt-1">No quality scans found for table '{selectedTable}' to aggregate.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Compliance Alerts Drawer */}
      <ComplianceAlertsDrawer 
        isOpen={isAlertsOpen}
      onClose={() => setIsAlertsOpen(false)}
      alerts={alerts}
      onApprove={async (alertId) => {
        try {
          const res = await api.post(`/api/governance/compliance-alerts/${alertId}/approve`, {});
          if (res && res.status === 'success') {
            setActionMessage({ text: res.message });
            fetchAlerts(); // Refresh alerts list
          }
        } catch (err: any) {
          setActionMessage({ text: `Approve failed: ${err.message}`, isError: true });
        }
      }}
    />
    </div>
  );
};

const ComplianceAlertsDrawer = ({ isOpen, onClose, alerts, onApprove }: { isOpen: boolean, onClose: () => void, alerts: any[], onApprove: (id: string) => void }) => {
  if (!isOpen) return null;

  const activeAlerts = alerts.filter(a => a.status === 'PENDING_REVIEW');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      {/* Backdrop closer */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" /> Compliance Alerts Audit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pending human-in-the-loop policy tag reviews.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Pending Audit
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{alert.id}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">PII Data Flow Blocked</h4>
                  <p className="text-xs text-slate-400 mt-1">{alert.reason}</p>
                </div>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Asset:</span>
                    <span className="font-mono text-slate-300">{alert.table}.{alert.column}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PII Policy Tag:</span>
                    <span className="font-mono text-amber-500 max-w-[180px] truncate" title={alert.policyTag}>{alert.policyTag.split('/').pop()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => onApprove(alert.id)}
                    className="bg-primary text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-primary/85 transition-all"
                  >
                    <Check size={12} /> Audit & Approve Policy Tag
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center h-full">
              <CheckCircle2 size={40} className="text-green-500 mb-3" />
              <h4 className="font-bold text-slate-200">Compliance is 100% Green</h4>
              <p className="text-xs text-slate-400 mt-1">No pending policy tags require manual human reviews.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
