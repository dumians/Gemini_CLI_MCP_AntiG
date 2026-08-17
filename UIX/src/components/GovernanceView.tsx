import React from 'react';
import { 
  Search, Filter, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  ChevronRight, X, RefreshCw, Sparkles, Check, Percent, History, 
  ShieldAlert, ArrowRight, HelpCircle, Info, Layers, Database, 
  Tag, Lock, Eye, Edit3, Save, Download, Share2, Compass, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../utils/api';

type TabType = 'dashboard' | 'knowledge_catalog' | 'discovery' | 'descriptions' | 'glossary' | 'policy' | 'trust' | 'open_knowledge';

interface AspectTypeField {
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  default?: any;
  min?: number;
  max?: number;
}

interface AspectTypeDefinition {
  id: string;
  displayName: string;
  description: string;
  category: string;
  color: string;
  fields: Record<string, AspectTypeField>;
}

interface CatalogEntryResult {
  id: string;
  name: string;
  sourceId: string;
  domain: string;
  type: string;
  attributesCount: number;
  aspects: Record<string, any>;
  score?: number;
}

interface AuditIssue {
  id: string;
  entityId: string;
  entityName: string;
  category: string;
  severity: string;
  ruleName: string;
  description: string;
  remediationAction: string;
  suggestedPayload: any;
}

interface DiscoveryResult {
  scanTimestamp: string;
  sourcesScanned: number;
  entitiesProfiled: number;
  attributesProfiled: number;
  piiFindings: Array<{
    entityId: string;
    entityName: string;
    sourceId: string;
    columnName: string;
    dataType: string;
    classification: string;
    sensitivityLevel: string;
    suggestedPolicyTag: string;
    suggestedMasking: string;
    confidence: number;
  }>;
  schemaDriftEvents: Array<{
    entityId: string;
    changeType: string;
    columnName: string;
    dataType: string;
    timestamp: string;
    severity: string;
  }>;
  inferredCorrelations: Array<{
    key: string;
    sources: string[];
    participatingEntities: string[];
    confidence: number;
    recommendation: string;
  }>;
  qualitySummary: {
    totalColumns: number;
    missingDescriptions: number;
    sensitiveColumnsCount: number;
    documentationCoveragePct: number;
  };
}

export const GovernanceView = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');
  const [datasetId, setDatasetId] = React.useState('marketing_edw');
  const [isScanning, setIsScanning] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Knowledge Catalog Explorer States
  const [catalogSearchQuery, setCatalogSearchQuery] = React.useState('');
  const [catalogAspectFilter, setCatalogAspectFilter] = React.useState('');
  const [catalogDomainFilter, setCatalogDomainFilter] = React.useState('ALL');
  const [catalogEntries, setCatalogEntries] = React.useState<CatalogEntryResult[]>([]);
  const [aspectTypes, setAspectTypes] = React.useState<Record<string, AspectTypeDefinition>>({});
  const [isSearchingCatalog, setIsSearchingCatalog] = React.useState(false);
  const [selectedEntityForAspects, setSelectedEntityForAspects] = React.useState<CatalogEntryResult | null>(null);
  const [aspectEditorData, setAspectEditorData] = React.useState<Record<string, any>>({});
  const [activeAspectTab, setActiveAspectTab] = React.useState<string>('governance');
  const [isSavingAspects, setIsSavingAspects] = React.useState(false);

  // Discovery States
  const [discoveryResult, setDiscoveryResult] = React.useState<DiscoveryResult | null>(null);
  const [isDiscovering, setIsDiscovering] = React.useState(false);
  const [driftHistory, setDriftHistory] = React.useState<any[]>([]);

  // Compliance & Audit States
  const [auditScore, setAuditScore] = React.useState<number>(94);
  const [auditIssues, setAuditIssues] = React.useState<AuditIssue[]>([]);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [isRemediating, setIsRemediating] = React.useState(false);

  // Open Knowledge Graph States
  const [openKnowledgeData, setOpenKnowledgeData] = React.useState<any>(null);
  const [isLoadingOk, setIsLoadingOk] = React.useState(false);

  // Descriptions, Glossary, Policy, Trust States
  const [selectedTable, setSelectedTable] = React.useState('campaign_metrics');
  const [isLoadingTab, setIsLoadingTab] = React.useState(false);
  const [descCandidates, setDescCandidates] = React.useState<any[]>([]);
  const [glossaryRecos, setGlossaryRecos] = React.useState<any[]>([]);
  const [policyRecos, setPolicyRecos] = React.useState<any[]>([]);
  const [additionalReaders, setAdditionalReaders] = React.useState('');
  const [trustMetrics, setTrustMetrics] = React.useState<any[]>([]);

  // Load Aspect Types and Initial Catalog
  const fetchAspectTypes = async () => {
    try {
      const res = await api.get('/api/catalog/aspect-types');
      if (res && res.status === 'success') {
        setAspectTypes(res.aspectTypes || {});
      }
    } catch (e) {
      console.error("Failed to load aspect types:", e);
    }
  };

  const handleSearchCatalog = async (query = catalogSearchQuery, filter = catalogAspectFilter, domain = catalogDomainFilter) => {
    setIsSearchingCatalog(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filter) params.append('aspectFilter', filter);
      if (domain && domain !== 'ALL') params.append('domain', domain);

      const res = await api.get(`/api/catalog/search?${params.toString()}`);
      if (res && res.status === 'success') {
        setCatalogEntries(res.entries || []);
      }
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  const runMeshAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await api.get('/api/governance/audit-rules');
      if (res && res.status === 'success') {
        setAuditScore(res.complianceScorePct || 100);
        setAuditIssues(res.issues || []);
      }
    } catch (e) {
      console.error("Audit failed:", e);
    } finally {
      setIsAuditing(false);
    }
  };

  const runDiscoveryScan = async (sourceId: string | null = null) => {
    setIsDiscovering(true);
    setActionMessage(null);
    try {
      const res = await api.post('/api/discovery/scan', { sourceId });
      if (res && res.status === 'success') {
        setDiscoveryResult(res);
        setActionMessage({ text: `Discovery Scan Completed! Profiled ${res.entitiesProfiled} entities and found ${res.piiFindings?.length || 0} sensitive fields.` });
      }
      // Refresh drift history
      const driftRes = await api.get('/api/discovery/drift-history');
      if (driftRes && driftRes.status === 'success') {
        setDriftHistory(driftRes.recentEvents || []);
      }
    } catch (err: any) {
      setActionMessage({ text: `Discovery Scan failed: ${err.message}`, isError: true });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRemediateIssues = async (issueIds: string[]) => {
    setIsRemediating(true);
    try {
      const res = await api.post('/api/governance/remediate', { issueIds });
      if (res && res.success) {
        setActionMessage({ text: `Successfully remediated ${res.remediatedCount} governance violations!` });
        runMeshAudit();
        handleSearchCatalog();
      }
    } catch (err: any) {
      setActionMessage({ text: `Remediation failed: ${err.message}`, isError: true });
    } finally {
      setIsRemediating(false);
    }
  };

  const openAspectEditor = (entry: CatalogEntryResult) => {
    setSelectedEntityForAspects(entry);
    setAspectEditorData(JSON.parse(JSON.stringify(entry.aspects || {})));
    setActiveAspectTab('governance');
  };

  const handleSaveAspects = async () => {
    if (!selectedEntityForAspects) return;
    setIsSavingAspects(true);
    try {
      const currentType = activeAspectTab;
      const dataToSave = aspectEditorData[currentType] || {};
      const res = await api.post(`/api/catalog/entries/${encodeURIComponent(selectedEntityForAspects.id)}/aspects`, {
        aspectTypeId: currentType,
        aspectData: dataToSave
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Updated '${currentType}' aspect for ${selectedEntityForAspects.name}!` });
        handleSearchCatalog();
        setSelectedEntityForAspects(null);
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to save aspect: ${err.message}`, isError: true });
    } finally {
      setIsSavingAspects(false);
    }
  };

  const fetchOpenKnowledgeGraph = async () => {
    setIsLoadingOk(true);
    try {
      const res = await api.get('/api/catalog/open-knowledge-graph');
      setOpenKnowledgeData(res);
    } catch (e) {
      console.error("Failed to load Open Knowledge graph:", e);
    } finally {
      setIsLoadingOk(false);
    }
  };

  // Load Tab Data (Descriptions, Glossary, Policy, Trust)
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
    fetchAspectTypes();
    handleSearchCatalog();
    runMeshAudit();
  }, []);

  React.useEffect(() => {
    if (['descriptions', 'glossary', 'policy', 'trust'].includes(activeTab)) {
      loadTabData(activeTab, selectedTable);
    } else if (activeTab === 'open_knowledge') {
      fetchOpenKnowledgeGraph();
    }
  }, [activeTab, selectedTable]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Compass size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">GCP Knowledge Catalog & Governance</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Dataplex Catalog v4
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Autonomous metadata discovery, custom Dataplex aspect schemas, semantic business glossary, and federated compliance rules.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => runDiscoveryScan()}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isDiscovering ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Run Discovery Scan
          </button>
          <button
            onClick={runMeshAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            {isAuditing ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} className="text-emerald-400" />}
            Audit Mesh Governance
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              actionMessage.isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'dashboard', label: 'Governance Hub', icon: ShieldCheck },
          { id: 'knowledge_catalog', label: 'Knowledge Catalog & Aspects', icon: Compass },
          { id: 'discovery', label: 'Metadata Discovery & Drift', icon: Database },
          { id: 'descriptions', label: 'Description Propagation', icon: FileText },
          { id: 'glossary', label: 'Business Glossary', icon: Tag },
          { id: 'policy', label: 'Policy Tags & Security', icon: Lock },
          { id: 'trust', label: 'Data Trust & Quality', icon: CheckCircle2 },
          { id: 'open_knowledge', label: 'DCAT v3 / Open Knowledge', icon: Share2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/80'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GOVERNANCE HUB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Telemetry KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Compliance Score</span>
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{auditScore}%</span>
                <span className="text-[10px] text-emerald-400 font-bold">Passing 18/20 rules</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${auditScore}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Catalog Data Assets</span>
                <Database size={16} className="text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{catalogEntries.length || 9}</span>
                <span className="text-[10px] text-indigo-400 font-bold">Across 6 Engines</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Oracle, Spanner, BigQuery, AlloyDB, NetSuite, Warehouse</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Dataplex Aspects</span>
                <Layers size={16} className="text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">4</span>
                <span className="text-[10px] text-purple-400 font-bold">Standard Types</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Governance, Quality, Security, Contract</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Open Compliance Issues</span>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">{auditIssues.length}</span>
                <span className="text-[10px] text-amber-400/80 font-bold">Remediation ready</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Actionable policy & aspect suggestions</p>
            </div>
          </div>

          {/* Compliance Audit Issues & Remediation Table */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-400" />
                  Autonomous Compliance & Policy Audits
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Automated validation of data ownership, DLP classification, data quality thresholds, and SLA conformance.
                </p>
              </div>

              {auditIssues.length > 0 && (
                <button
                  onClick={() => handleRemediateIssues(['ALL'])}
                  disabled={isRemediating}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isRemediating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Auto-Remediate All ({auditIssues.length})
                </button>
              )}
            </div>

            {auditIssues.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                <CheckCircle2 size={36} className="text-emerald-400 mb-2 opacity-80" />
                <span className="text-slate-300 font-medium">All Mesh Assets are Fully Compliant!</span>
                <span className="text-slate-500 mt-0.5">No policy tag gaps or missing stewards detected.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3 px-3">Asset Name</th>
                      <th className="pb-3 px-3">Category</th>
                      <th className="pb-3 px-3">Severity</th>
                      <th className="pb-3 px-3">Rule & Description</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {auditIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{issue.entityName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {issue.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            issue.severity.includes('CRITICAL')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <p className="font-medium text-white">{issue.ruleName}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{issue.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRemediateIssues([issue.id])}
                            disabled={isRemediating}
                            className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-all"
                          >
                            Fix Issue
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE CATALOG & ASPECTS EXPLORER */}
      {activeTab === 'knowledge_catalog' && (
        <div className="space-y-6">
          {/* Search & Aspect Filters Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={e => {
                    setCatalogSearchQuery(e.target.value);
                    handleSearchCatalog(e.target.value, catalogAspectFilter, catalogDomainFilter);
                  }}
                  placeholder="Search catalog by table name, column, or description..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={catalogAspectFilter}
                  onChange={e => {
                    setCatalogAspectFilter(e.target.value);
                    handleSearchCatalog(catalogSearchQuery, e.target.value, catalogDomainFilter);
                  }}
                  placeholder="Aspect query (e.g. aspect:governance.classification=Restricted)"
                  className="w-full md:w-80 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSearchCatalog()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <span className="text-slate-500 text-[11px] font-semibold">Quick Aspect Filters:</span>
              {[
                { label: 'All Assets', filter: '' },
                { label: '🔒 Restricted PII', filter: 'aspect:governance.classification=Restricted' },
                { label: '🛡️ Critical PII Tag', filter: 'tag:pii=true' },
                { label: '⭐ Platinum SLA', filter: 'aspect:data_product_contract.slaUptime=99.99%' },
                { label: '✨ High Quality >99%', filter: 'aspect:data_quality.score>99' }
              ].map(chip => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setCatalogAspectFilter(chip.filter);
                    handleSearchCatalog(catalogSearchQuery, chip.filter, catalogDomainFilter);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    catalogAspectFilter === chip.filter
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Entries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogEntries.map(entry => {
              const gov = entry.aspects?.governance;
              const dq = entry.aspects?.data_quality;
              const sec = entry.aspects?.security_privacy;
              const contract = entry.aspects?.data_product_contract;

              return (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
                        {entry.sourceId.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{entry.domain}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{entry.name}</h4>
                    <p className="text-slate-400 text-xs">
                      {entry.attributesCount} attributes • Type: {entry.type}
                    </p>

                    {/* Aspect Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {gov?.classification && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
                          🏷️ {gov.classification}
                        </span>
                      )}
                      {dq?.score && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                          ✓ DQ: {dq.score}%
                        </span>
                      )}
                      {sec?.containsPII && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px]">
                          🔒 Sensitive PII
                        </span>
                      )}
                      {contract?.slaUptime && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                          ⚡ SLA: {contract.slaUptime}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => openAspectEditor(entry)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/60"
                  >
                    <Edit3 size={13} />
                    Inspect & Edit Dataplex Aspects
                  </button>
                </div>
              );
            })}
          </div>

          {/* Aspect Editor Modal */}
          {selectedEntityForAspects && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Dataplex Aspect Editor</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Entity: <span className="text-indigo-400 font-mono font-semibold">{selectedEntityForAspects.name}</span> ({selectedEntityForAspects.id})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEntityForAspects(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Aspect Category Tabs */}
                <div className="flex gap-2 border-b border-slate-800/80 pb-2">
                  {(Object.values(aspectTypes) as AspectTypeDefinition[]).map(type => (
                    <button
                      key={type.id}
                      onClick={() => setActiveAspectTab(type.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeAspectTab === type.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white bg-slate-800/50'
                      }`}
                    >
                      {type.displayName}
                    </button>
                  ))}
                </div>

                {/* Aspect Form Fields */}
                {aspectTypes[activeAspectTab] && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      {aspectTypes[activeAspectTab].description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(Object.entries(aspectTypes[activeAspectTab].fields || {}) as [string, AspectTypeField][]).map(([fieldName, fieldDef]) => {
                        const currentVal = aspectEditorData[activeAspectTab]?.[fieldName] ?? fieldDef.default ?? '';

                        return (
                          <div key={fieldName} className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-300">
                              {fieldDef.label}
                            </label>

                            {fieldDef.type === 'enum' && (
                              <select
                                value={currentVal}
                                onChange={e => {
                                  setAspectEditorData(prev => ({
                                    ...prev,
                                    [activeAspectTab]: {
                                      ...(prev[activeAspectTab] || {}),
                                      [fieldName]: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              >
                                {fieldDef.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {fieldDef.type === 'boolean' && (
                              <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!currentVal}
                                    onChange={e => {
                                      setAspectEditorData(prev => ({
                                        ...prev,
                                        [activeAspectTab]: {
                                          ...(prev[activeAspectTab] || {}),
                                          [fieldName]: e.target.checked
                                        }
                                      }));
                                    }}
                                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                                  />
                                  <span>Enabled</span>
                                </label>
                              </div>
                            )}

                            {fieldDef.type === 'string' && (
                              <input
                                type="text"
                                value={currentVal}
                                onChange={e => {
                                  setAspectEditorData(prev => ({
                                    ...prev,
                                    [activeAspectTab]: {
                                      ...(prev[activeAspectTab] || {}),
                                      [fieldName]: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            )}

                            {fieldDef.type === 'number' && (
                              <input
                                type="number"
                                step="0.1"
                                value={currentVal}
                                onChange={e => {
                                  setAspectEditorData(prev => ({
                                    ...prev,
                                    [activeAspectTab]: {
                                      ...(prev[activeAspectTab] || {}),
                                      [fieldName]: parseFloat(e.target.value) || 0
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => setSelectedEntityForAspects(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAspects}
                    disabled={isSavingAspects}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    {isSavingAspects ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Dataplex Aspect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: METADATA DISCOVERY & DRIFT */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-indigo-400" />
                  Multi-Source Autonomous Profiling & PII Discovery
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Inspects tables, columns, data types, DLP sensitivity patterns, and cross-domain correlations across all connected engines.
                </p>
              </div>

              <button
                onClick={() => runDiscoveryScan()}
                disabled={isDiscovering}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 self-start"
              >
                {isDiscovering ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                Trigger Full Scan
              </button>
            </div>

            {discoveryResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Entities Profiled</span>
                  <span className="text-lg font-bold text-white">{discoveryResult.entitiesProfiled}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Attributes Profiled</span>
                  <span className="text-lg font-bold text-white">{discoveryResult.attributesProfiled}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Sensitive PII Fields</span>
                  <span className="text-lg font-bold text-rose-400">{discoveryResult.piiFindings.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Documentation Coverage</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {discoveryResult.qualitySummary.documentationCoveragePct}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PII Findings Table */}
          {discoveryResult && discoveryResult.piiFindings.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock size={16} className="text-rose-400" />
                Sensitive Data & PII Discoveries
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3 px-3">Table / Entity</th>
                      <th className="pb-3 px-3">Column</th>
                      <th className="pb-3 px-3">DLP Classification</th>
                      <th className="pb-3 px-3">Suggested Policy Tag</th>
                      <th className="pb-3 px-3">Masking Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {discoveryResult.piiFindings.map((pii, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{pii.entityName}</td>
                        <td className="py-3 px-3 font-mono text-indigo-300">{pii.columnName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-semibold">
                            {pii.classification} ({pii.sensitivityLevel})
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                          {pii.suggestedPolicyTag}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-400">{pii.suggestedMasking}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Schema Drift & Evolution Log */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <History size={16} className="text-indigo-400" />
              Schema Drift & Evolution History
            </h4>

            {driftHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No breaking schema drift detected across recent scans.</p>
            ) : (
              <div className="space-y-2">
                {driftHistory.map((drift, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold">
                        {drift.changeType}
                      </span>
                      <span className="text-xs font-semibold text-white">{drift.entityId}</span>
                      <span className="text-xs text-indigo-300 font-mono">.{drift.columnName} ({drift.dataType})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(drift.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DESCRIPTIONS PROPAGATION */}
      {activeTab === 'descriptions' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Lineage-Based Column Description Propagation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Propagate verified column definitions upstream from source systems through the mesh graph.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">Select Target Table:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="campaign_metrics">campaign_metrics (BigQuery)</option>
              <option value="customer_segments">customer_segments (BigQuery)</option>
              <option value="web_events">web_events (BigQuery)</option>
            </select>
          </div>

          {isLoadingTab ? (
            <div className="py-12 flex justify-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : descCandidates.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No missing descriptions found for this table.</div>
          ) : (
            <div className="space-y-3">
              {descCandidates.map((cand, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-bold">{cand["Target Column"]}</span>
                    <p className="text-xs text-slate-300 mt-1">{cand["Proposed Description"]}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">Source: {cand.Source} ({cand["Source Column"]}) • Confidence: {Math.round(cand.Confidence * 100)}%</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                    Lineage Hop 1
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BUSINESS GLOSSARY */}
      {activeTab === 'glossary' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Dataplex Business Glossary & EntryLinks</h3>
              <p className="text-xs text-slate-400 mt-0.5">Map technical physical columns to semantic business terms in GCP Dataplex Glossary.</p>
            </div>
          </div>

          {isLoadingTab ? (
            <div className="py-12 flex justify-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : glossaryRecos.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No glossary recommendations found for this asset.</div>
          ) : (
            <div className="space-y-3">
              {glossaryRecos.map((reco, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-bold">{reco.Column}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                        📖 {reco["Suggested Term"]}
                      </span>
                      <span className="text-[10px] text-slate-400">Term ID: {reco["Term ID"]}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{reco.Rationale}</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold">{Math.round(reco.Confidence * 100)}% Match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: POLICY TAGS */}
      {activeTab === 'policy' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Policy Tags & Column-Level Security</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enforce Fine-Grained Access Control (FGAC) across BigQuery and Spanner policy taxonomies.</p>
          </div>

          {isLoadingTab ? (
            <div className="py-12 flex justify-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : policyRecos.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No unassigned sensitive policies found.</div>
          ) : (
            <div className="space-y-3">
              {policyRecos.map((pol, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-rose-400 font-bold">{pol["Target Column"]}</span>
                    <p className="text-xs text-slate-300 mt-1 font-mono text-[11px]">{pol["Policy Tags"]}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{pol.Recommendation}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                    DLP Protected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: TRUST CENTER */}
      {activeTab === 'trust' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Data Quality & Trust Metrics</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time Dataplex AutoDQ evaluation, freshness tracking, and trust index.</p>
          </div>

          {isLoadingTab ? (
            <div className="py-12 flex justify-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : trustMetrics.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No trust scores available for this table.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trustMetrics.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white font-bold">{item.Column}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {item.Badge}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">{item["Trust Score"]}%</div>
                  <p className="text-[10px] text-slate-400">{item["Bonus (Remediation)"]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: OPEN KNOWLEDGE GRAPH / DCAT */}
      {activeTab === 'open_knowledge' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">W3C DCAT v3 / Google Open Knowledge Graph</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Semantic JSON-LD linked data representation of mesh data assets, Dataplex aspects, and cross-domain links.
              </p>
            </div>

            <a
              href="/api/catalog/dcat-export"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Download size={13} />
              Export DCAT v3
            </a>
          </div>

          {isLoadingOk ? (
            <div className="py-12 flex justify-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-indigo-300 font-mono max-h-[500px] overflow-y-auto">
                {JSON.stringify(openKnowledgeData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GovernanceView;
