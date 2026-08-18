import React from 'react';
import { 
  Search, Filter, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  ChevronRight, X, RefreshCw, Sparkles, Check, Percent, History, 
  ShieldAlert, ArrowRight, HelpCircle, Info, Layers, Database, 
  Tag, Lock, Eye, Edit3, Save, Download, Share2, Compass, AlertCircle,
  BookOpen, Upload, Play, CheckSquare, Zap, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../utils/api';

type TabType = 'dashboard' | 'knowledge_catalog' | 'discovery' | 'descriptions' | 'glossary' | 'policy' | 'trust' | 'documents_rag' | 'open_knowledge';

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
    sourceEntityId: string;
    sourceColumn: string;
    targetEntityId: string;
    targetColumn: string;
    confidence: number;
    matchType: string;
  }>;
}

interface GovernanceDoc {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  extractedMetadata?: {
    documentTitle?: string;
    summary?: string;
    tables?: Array<{
      tableName: string;
      domain?: string;
      description?: string;
      columns?: Array<{
        name: string;
        dataType: string;
        description: string;
        suggestedGlossaryTerm?: string;
        policyTag?: string;
        remediationLogic?: string;
      }>;
    }>;
    glossaryTerms?: Array<{
      term: string;
      definition: string;
      category: string;
    }>;
    policyRules?: Array<{
      name: string;
      classification: string;
      maskingRule: string;
    }>;
  };
}

interface DataplexScan {
  id: string;
  name: string;
  type: string;
  target: string;
  domain: string;
  status: string;
  rulesEvaluated: number;
  rulesPassed: number;
  lastRunTime: string;
  score: number;
}

interface EstateSummary {
  totalSources: number;
  totalEntities: number;
  totalColumns: number;
  documentedColumns: number;
  missingDescriptions: number;
  gapPercentage: number;
  documentationCoverage: number;
  overallTrustIndex: number;
  governanceDocumentsIndexed: number;
  policyTagsCoverage: string;
  activeRemediations: number;
}

export const GovernanceView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');
  const [aspectTypes, setAspectTypes] = React.useState<AspectTypeDefinition[]>([]);
  const [catalogEntries, setCatalogEntries] = React.useState<CatalogEntryResult[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDomain, setSelectedDomain] = React.useState('ALL');
  const [selectedAspectFilter, setSelectedAspectFilter] = React.useState('ALL');
  
  // Audits & Discovery
  const [auditIssues, setAuditIssues] = React.useState<AuditIssue[]>([]);
  const [complianceScore, setComplianceScore] = React.useState(100);
  const [discoveryResult, setDiscoveryResult] = React.useState<DiscoveryResult | null>(null);
  const [driftHistory, setDriftHistory] = React.useState<any[]>([]);

  // Estate Summary (Dataplex Labs)
  const [estateSummary, setEstateSummary] = React.useState<EstateSummary | null>(null);
  const [isLoadingEstate, setIsLoadingEstate] = React.useState(false);

  // Document RAG & Data Steward (Dataplex Labs)
  const [documents, setDocuments] = React.useState<GovernanceDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = React.useState<GovernanceDoc | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [newDocTitle, setNewDocTitle] = React.useState('');
  const [newDocContent, setNewDocContent] = React.useState('');
  const [newDocFileName, setNewDocFileName] = React.useState('');
  const [ragQuery, setRagQuery] = React.useState('');
  const [ragSearchResults, setRagSearchResults] = React.useState<any[]>([]);

  // Dataplex Scans (Dataplex Labs)
  const [dataplexScans, setDataplexScans] = React.useState<DataplexScan[]>([]);
  const [isTriggeringScan, setIsTriggeringScan] = React.useState(false);

  // Propagations
  const [datasetId] = React.useState('marketing_edw');
  const [selectedTable, setSelectedTable] = React.useState('campaign_metrics');
  const [descCandidates, setDescCandidates] = React.useState<any[]>([]);
  const [glossaryRecos, setGlossaryRecos] = React.useState<any[]>([]);
  const [policyRecos, setPolicyRecos] = React.useState<any[]>([]);
  const [trustMetrics, setTrustMetrics] = React.useState<any[]>([]);

  // Modals & Aspects Editor
  const [selectedEntityForAspects, setSelectedEntityForAspects] = React.useState<CatalogEntryResult | null>(null);
  const [aspectEditorData, setAspectEditorData] = React.useState<Record<string, any>>({});
  const [activeAspectTab, setActiveAspectTab] = React.useState<string>('governance');
  const [isSavingAspects, setIsSavingAspects] = React.useState(false);
  const [openKnowledgeData, setOpenKnowledgeData] = React.useState<any>(null);
  const [isLoadingOk, setIsLoadingOk] = React.useState(false);

  // Loaders & Messages
  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(false);
  const [isLoadingTab, setIsLoadingTab] = React.useState(false);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [isDiscovering, setIsDiscovering] = React.useState(false);
  const [isRemediating, setIsRemediating] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // AI Discovery Agent state (Dataplex Labs)
  const [aiDiscoveryQuery, setAiDiscoveryQuery] = React.useState('');
  const [isAiDiscovering, setIsAiDiscovering] = React.useState(false);
  const [aiDiscoveryResult, setAiDiscoveryResult] = React.useState<{
    userQuery?: string;
    decomposition?: { predicates: string[]; variations: string[] };
    rankedResults?: any[];
    contextSummary?: string;
    totalFound?: number;
  } | null>(null);

  const handleRunAiDiscovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiDiscoveryQuery.trim()) return;
    setIsAiDiscovering(true);
    setActionMessage(null);
    try {
      const res = await api.post('/api/catalog/discovery/ai-search', { query: aiDiscoveryQuery });
      if (res && res.status === 'success') {
        setAiDiscoveryResult(res);
        setActionMessage({ text: `Discovered ${res.totalFound || res.rankedResults?.length || 0} catalog assets using semantic decomposition!` });
      }
    } catch (err: any) {
      console.error("AI discovery failed:", err);
      setActionMessage({ text: `Discovery query failed: ${err.message}`, isError: true });
    } finally {
      setIsAiDiscovering(false);
    }
  };

  // Fetch Aspect Type schemas
  const fetchAspectTypes = async () => {
    try {
      const res = await api.get('/api/catalog/aspect-types');
      if (res && res.aspectTypes) {
        setAspectTypes(res.aspectTypes);
      }
    } catch (err) {
      console.error("Failed to fetch aspect types:", err);
    }
  };

  // Fetch Estate Summary
  const fetchEstateSummary = async () => {
    setIsLoadingEstate(true);
    try {
      const res = await api.get('/api/governance/estate-summary');
      if (res && res.summary) {
        setEstateSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load estate summary:", err);
    } finally {
      setIsLoadingEstate(false);
    }
  };

  // Fetch Governance Documents (RAG)
  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/governance/documents');
      if (res && res.documents) {
        setDocuments(res.documents);
        if (!selectedDoc && res.documents.length > 0) {
          setSelectedDoc(res.documents[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch governance documents:", err);
    }
  };

  // Fetch Dataplex Scans
  const fetchDataplexScans = async () => {
    try {
      const res = await api.get('/api/governance/scans');
      if (res && res.scans) {
        setDataplexScans(res.scans);
      }
    } catch (err) {
      console.error("Failed to fetch Dataplex scans:", err);
    }
  };

  // Search Knowledge Catalog entries
  const handleSearchCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedDomain !== 'ALL') params.append('domain', selectedDomain);
      if (selectedAspectFilter !== 'ALL') params.append('aspectTypeId', selectedAspectFilter);

      const res = await api.get(`/api/catalog/entries?${params.toString()}`);
      if (res && res.entries) {
        setCatalogEntries(res.entries);
      }
    } catch (err: any) {
      setActionMessage({ text: `Catalog search failed: ${err.message}`, isError: true });
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Run Mesh Governance Audit
  const runMeshAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await api.get('/api/governance/audit-rules');
      if (res) {
        setAuditIssues(res.issues || []);
        setComplianceScore(res.complianceScore || 100);
      }
    } catch (err: any) {
      setActionMessage({ text: `Governance audit failed: ${err.message}`, isError: true });
    } finally {
      setIsAuditing(false);
    }
  };

  // Run Metadata Discovery Scan
  const runDiscoveryScan = async (sourceId?: string) => {
    setIsDiscovering(true);
    try {
      const res = await api.post('/api/catalog/discovery/scan', { sourceId });
      if (res && res.status === 'success') {
        setDiscoveryResult(res.discovery);
        setActionMessage({ text: `Discovery Scan complete! Profiled ${res.discovery.entitiesProfiled} entities across mesh sources.` });
        runMeshAudit();
        fetchDriftHistory();
      }
    } catch (err: any) {
      setActionMessage({ text: `Discovery scan failed: ${err.message}`, isError: true });
    } finally {
      setIsDiscovering(false);
    }
  };

  const fetchDriftHistory = async () => {
    try {
      const res = await api.get('/api/catalog/discovery/drift');
      if (res && res.driftHistory) {
        setDriftHistory(res.driftHistory);
      }
    } catch (e) {
      console.error("Failed to load schema drift history:", e);
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
        fetchEstateSummary();
      }
    } catch (err: any) {
      setActionMessage({ text: `Remediation failed: ${err.message}`, isError: true });
    } finally {
      setIsRemediating(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !newDocContent) return;
    setIsUploadingDoc(true);
    try {
      const res = await api.post('/api/governance/documents/upload', {
        title: newDocTitle,
        content: newDocContent,
        fileName: newDocFileName || `${newDocTitle.toLowerCase().replace(/\s+/g, '_')}.md`,
        fileType: 'markdown'
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Successfully indexed '${newDocTitle}' into Document RAG Engine!` });
        setShowUploadModal(false);
        setNewDocTitle('');
        setNewDocContent('');
        setNewDocFileName('');
        fetchDocuments();
        fetchEstateSummary();
      }
    } catch (err: any) {
      setActionMessage({ text: `Document upload failed: ${err.message}`, isError: true });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleTriggerScan = async (scanType: 'DATA_QUALITY' | 'DATA_PROFILE', targetEntity: string) => {
    setIsTriggeringScan(true);
    try {
      const res = await api.post('/api/governance/scans/run', {
        scanType,
        targetEntity
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Successfully executed Dataplex ${scanType} Scan on ${targetEntity}! Score: ${Math.round((res.scan.score || 0.95) * 100)}%` });
        fetchDataplexScans();
        fetchEstateSummary();
      }
    } catch (err: any) {
      setActionMessage({ text: `Scan failed: ${err.message}`, isError: true });
    } finally {
      setIsTriggeringScan(false);
    }
  };

  const handleApplyDescriptions = async () => {
    try {
      const updates = descCandidates.map(c => ({
        table: selectedTable,
        column: c["Target Column"],
        description: c["Proposed Description"]
      }));
      const res = await api.post('/api/governance/apply-propagation', {
        dataset: datasetId,
        updates
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Propagated descriptions for ${updates.length} columns in ${selectedTable}!` });
        fetchEstateSummary();
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to apply descriptions: ${err.message}`, isError: true });
    }
  };

  const handleApplyGlossary = async () => {
    try {
      const updates = glossaryRecos.map(r => ({
        column: r.Column,
        term_id: r["Term ID"],
        term_display: r["Suggested Term"]
      }));
      const res = await api.post('/api/governance/glossary-apply', {
        dataset: datasetId,
        table: selectedTable,
        updates
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Linked ${updates.length} columns to Business Glossary EntryLinks in Dataplex!` });
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to link glossary terms: ${err.message}`, isError: true });
    }
  };

  const handleApplyPolicies = async () => {
    try {
      const updates = policyRecos.map(p => ({
        table: selectedTable,
        column: p["Target Column"],
        policy_tag: p["Policy Tags"]
      }));
      const res = await api.post('/api/governance/policy-apply', {
        dataset: datasetId,
        updates
      });
      if (res && res.status === 'success') {
        setActionMessage({ text: `Synchronized policy tags and access controls for ${updates.length} columns!` });
        fetchEstateSummary();
      }
    } catch (err: any) {
      setActionMessage({ text: `Failed to apply policy tags: ${err.message}`, isError: true });
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

  React.useEffect(() => {
    fetchAspectTypes();
    fetchEstateSummary();
    fetchDocuments();
    fetchDataplexScans();
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
                <h1 className="text-2xl font-bold text-white tracking-tight">GCP Dataplex Labs Governance Agent</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Dataplex Catalog v4 • Labs Integration
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Autonomous metadata discovery, recursive column-level lineage (CLL) propagation, AI Business Glossary mapping, and Document RAG.
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
            Audit Governance
          </button>
        </div>
      </div>

      {/* Estate Overview Metrics Bar (Dataplex Labs) */}
      {estateSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Mesh Sources</span>
            <span className="text-lg font-bold text-white mt-1 block">{estateSummary.totalSources} Connected</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Entities</span>
            <span className="text-lg font-bold text-indigo-400 mt-1 block">{estateSummary.totalEntities} Tables</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Attributes</span>
            <span className="text-lg font-bold text-purple-400 mt-1 block">{estateSummary.totalColumns} Columns</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Doc Coverage</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">{estateSummary.documentationCoverage}%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">DQ Trust Index</span>
            <span className="text-lg font-bold text-blue-400 mt-1 block">{Math.round((estateSummary.overallTrustIndex || 0.94) * 100)}%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Indexed Docs</span>
            <span className="text-lg font-bold text-amber-400 mt-1 block">{estateSummary.governanceDocumentsIndexed} Policies</span>
          </div>
        </div>
      )}

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
          { id: 'documents_rag', label: 'Document RAG & AI Steward', icon: BookOpen },
          { id: 'descriptions', label: 'Description Propagation', icon: FileText },
          { id: 'glossary', label: 'Business Glossary', icon: Tag },
          { id: 'policy', label: 'Policy Tags & Security', icon: Lock },
          { id: 'trust', label: 'Data Trust & DQ Scans', icon: CheckCircle2 },
          { id: 'knowledge_catalog', label: 'Knowledge Catalog & Aspects', icon: Compass },
          { id: 'discovery', label: 'Discovery & Schema Drift', icon: Database },
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
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD / GOVERNANCE HUB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Audit Violations & Quick Actions */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Federated Governance Compliance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Automated rule evaluation across Spanner, BigQuery, AlloyDB, and Oracle.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-400">{complianceScore}%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Compliance</span>
              </div>
            </div>

            {auditIssues.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/50">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">All Governance Policies Satisfied</p>
                <p className="text-xs text-slate-400 mt-1">Zero unmasked PII, schema drifts, or orphaned assets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Detected Violations ({auditIssues.length})</span>
                  <button
                    onClick={() => handleRemediateIssues(['ALL'])}
                    disabled={isRemediating}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition-all"
                  >
                    {isRemediating ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                    Auto-Remediate All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {auditIssues.map(issue => (
                    <div key={issue.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold uppercase">
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{issue.entityName}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{issue.ruleName}</h4>
                      <p className="text-xs text-slate-400">{issue.description}</p>
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                        <span className="text-[10px] text-indigo-400 font-mono">{issue.remediationAction}</span>
                        <button
                          onClick={() => handleRemediateIssues([issue.id])}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          Apply Fix
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT RAG & DATA STEWARD (Dataplex Labs) */}
      {activeTab === 'documents_rag' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" />
                Unstructured Governance Documents & RAG Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingest enterprise data dictionaries, policy PDFs, and Markdown specs. Gemini automatically extracts table definitions, column descriptions, and glossary terms to guide metadata propagation.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-lg shadow-amber-600/20 transition-all shrink-0"
            >
              <Upload size={14} />
              Ingest Document
            </button>
          </div>

          {/* Document Ingestion Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Ingest Governance Document (Markdown / Text / JSON)</h4>
                  <button onClick={() => setShowUploadModal(false)} className="text-slate-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleUploadDocument} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Document Title</label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={e => setNewDocTitle(e.target.value)}
                      placeholder="e.g. Omnichannel Retail Data Dictionary"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">File Name</label>
                    <input
                      type="text"
                      value={newDocFileName}
                      onChange={e => setNewDocFileName(e.target.value)}
                      placeholder="e.g. retail_data_dictionary.md"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Document Content / Specifications</label>
                    <textarea
                      rows={6}
                      value={newDocContent}
                      onChange={e => setNewDocContent(e.target.value)}
                      placeholder="Paste markdown table definitions, column descriptions, and compliance rules..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingDoc}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {isUploadingDoc ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      Extract & Index Metadata
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Documents Grid & Extracted Inspector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Document List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexed Policy Documents ({documents.length})</h4>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-amber-400 shrink-0" />
                    <span className="text-xs font-bold truncate text-white">{doc.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">{doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  {doc.extractedMetadata?.tables && (
                    <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">
                      {doc.extractedMetadata.tables.length} Table Schemas Extracted
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Right: Extracted Schema Viewer */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              {selectedDoc ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedDoc.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedDoc.extractedMetadata?.summary || "Governance dictionary"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                      RAG Verified
                    </span>
                  </div>

                  {selectedDoc.extractedMetadata?.tables && selectedDoc.extractedMetadata.tables.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDoc.extractedMetadata.tables.map((table, tIdx) => (
                        <div key={tIdx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300 font-mono">Table: {table.tableName}</span>
                            <span className="text-[10px] text-slate-400">{table.domain}</span>
                          </div>
                          <p className="text-xs text-slate-400">{table.description}</p>
                          
                          <div className="divide-y divide-slate-800/60 text-xs">
                            {(table.columns || []).map((col, cIdx) => (
                              <div key={cIdx} className="py-2 flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-white font-semibold">{col.name}</span>
                                  <span className="text-[10px] text-slate-500 ml-2">({col.dataType})</span>
                                  <p className="text-xs text-slate-300 mt-0.5">{col.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {col.suggestedGlossaryTerm && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                                      📖 {col.suggestedGlossaryTerm}
                                    </span>
                                  )}
                                  {col.policyTag && (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px]">
                                      🔒 {col.policyTag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No structured table metadata extracted.</p>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">Select a document to inspect extracted schemas.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DESCRIPTION PROPAGATION (Lineage + RAG) */}
      {activeTab === 'descriptions' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Lineage-Based Column Description Propagation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Propagate verified column definitions upstream from source systems through multi-hop lineage and Document RAG.</p>
            </div>
            <button
              onClick={handleApplyDescriptions}
              disabled={descCandidates.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <CheckSquare size={14} />
              Apply Propagated Descriptions
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">Select Target Table:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="campaign_metrics">campaign_metrics (BigQuery)</option>
              <option value="transactions">transactions (Spanner)</option>
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
                <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-bold">{cand["Target Column"]}</span>
                      <span className="text-[10px] text-slate-500">• Type: {cand.Type}</span>
                      {cand["RAG Source"] && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                          📚 {cand["RAG Source"]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 mt-1">{cand["Proposed Description"]}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">Source: {cand.Source} ({cand["Source Column"]})</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold shrink-0 ml-4">{Math.round(cand.Confidence * 100)}% Match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BUSINESS GLOSSARY */}
      {activeTab === 'glossary' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Dataplex Business Glossary & EntryLinks</h3>
              <p className="text-xs text-slate-400 mt-0.5">Map technical physical columns to semantic business terms in GCP Dataplex Glossary natively.</p>
            </div>
            <button
              onClick={handleApplyGlossary}
              disabled={glossaryRecos.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              <CheckSquare size={14} />
              Apply Approved EntryLinks
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">Select Target Table:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="campaign_metrics">campaign_metrics (BigQuery)</option>
              <option value="transactions">transactions (Spanner)</option>
              <option value="customer_segments">customer_segments (BigQuery)</option>
            </select>
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
                      <span className="text-[10px] text-slate-400 truncate max-w-md">Term ID: {reco["Term ID"]}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{reco.Rationale}</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold shrink-0 ml-4">{Math.round(reco.Confidence * 100)}% Match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: POLICY TAGS */}
      {activeTab === 'policy' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Policy Tags & Column-Level Access Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enforce Fine-Grained Access Control (FGAC) across BigQuery and Spanner policy taxonomies with Straight-Pull verification.</p>
            </div>
            <button
              onClick={handleApplyPolicies}
              disabled={policyRecos.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              <CheckSquare size={14} />
              Sync Policy Tags & IAM
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">Select Target Table:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="campaign_metrics">campaign_metrics (BigQuery)</option>
              <option value="transactions">transactions (Spanner)</option>
            </select>
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
                <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-rose-400 font-bold">{pol["Target Column"]}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-semibold">
                        Logic: {pol.Logic}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-mono text-[11px] truncate max-w-xl">{pol["Policy Tags"]}</p>
                    <p className="text-xs text-emerald-400 mt-0.5 font-semibold">{pol["Access Summary"]}</p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Source: {pol["Source Table"]} • {pol.Recommendation}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold shrink-0 ml-4">
                    FineGrainedReader
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TRUST CENTER & DATAPLEX SCANS */}
      {activeTab === 'trust' && (
        <div className="space-y-6">
          {/* Top: AutoDQ & Lineage Trust Scores */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Data Quality & Trust Metrics (with Remediation Bonuses)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Lineage-derived trust score with automated SQL remediation recognition (COALESCE, DISTINCT, SAFE_CAST).</p>
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
                <option value="transactions">transactions (Spanner)</option>
              </select>
            </div>

            {isLoadingTab ? (
              <div className="py-12 flex justify-center text-slate-500">
                <RefreshCw size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : trustMetrics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No trust scores available for this table.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trustMetrics.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white font-bold">{item.Column}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.Trend}</span>
                    </div>
                    <div className="text-2xl font-black text-white">{Math.round(item["Trust Score"] * 100)}%</div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold block w-fit">
                      {item.Badge}
                    </span>
                    <p className="text-[10px] text-indigo-300 font-mono mt-1">{item["Remediation Logic"]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Dataplex Scans Management */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" />
                  Dataplex AutoDQ & Data Profile Scans
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Managed Google Cloud Dataplex execution jobs.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerScan('DATA_QUALITY', 'marketing_edw.campaign_metrics')}
                  disabled={isTriggeringScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isTriggeringScan ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                  Run DQ Scan
                </button>
                <button
                  onClick={() => handleTriggerScan('DATA_PROFILE', 'marketing_edw.campaign_metrics')}
                  disabled={isTriggeringScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold disabled:opacity-50"
                >
                  <Play size={12} className="text-purple-400" />
                  Run Profile Scan
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {dataplexScans.map(scan => (
                <div key={scan.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{scan.name}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono">
                        {scan.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Target: {scan.target} ({scan.domain}) • Evaluated {scan.rulesEvaluated} rules</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-400">{Math.round(scan.score * 100)}% Pass</span>
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {scan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: KNOWLEDGE CATALOG & ASPECTS */}
      {activeTab === 'knowledge_catalog' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchCatalog()}
                  placeholder="Search catalog entities across mesh domains..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Domains</option>
                  <option value="Oracle ERP">Oracle ERP</option>
                  <option value="Spanner Retail">Spanner Retail</option>
                  <option value="BigQuery Analytics">BigQuery Analytics</option>
                  <option value="AlloyDB CRM">AlloyDB CRM</option>
                </select>

                <select
                  value={selectedAspectFilter}
                  onChange={e => setSelectedAspectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Aspects</option>
                  {aspectTypes.map(a => (
                    <option key={a.id} value={a.id}>{a.displayName}</option>
                  ))}
                </select>

                <button
                  onClick={handleSearchCatalog}
                  disabled={isLoadingCatalog}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isLoadingCatalog ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {/* Catalog Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {catalogEntries.map(entry => (
                <div key={entry.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-semibold">
                      {entry.domain}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{entry.type}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{entry.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Source: {entry.sourceId} • {entry.attributesCount} attributes</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.keys(entry.aspects || {}).map(aspKey => (
                      <span key={aspKey} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                        {aspKey}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => openAspectEditor(entry)}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 size={12} />
                    Edit Dataplex Aspects
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: DISCOVERY & SCHEMA DRIFT */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Dataplex Labs Discovery Agent Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 border border-indigo-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    AI Semantic Discovery & Multi-Search Agent
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                      Dataplex Labs
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Performs semantic question decomposition, generates 3 search variations with qualified predicates, calls LookupContext, and reranks Google Cloud Knowledge Catalog assets.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRunAiDiscovery} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={aiDiscoveryQuery}
                  onChange={e => setAiDiscoveryQuery(e.target.value)}
                  placeholder="e.g. Find customer revenue, churn risk, and billing data in BigQuery and Spanner..."
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isAiDiscovering || !aiDiscoveryQuery.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {isAiDiscovering ? <RefreshCw size={14} className="animate-spin" /> : <Compass size={14} />}
                Decompose & Search
              </button>
            </form>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Try:</span>
              {[
                'Find omnichannel retail revenue and customer orders in Spanner',
                'Identify sensitive PII email and customer profiles in CRM',
                'Show marketing campaign metrics and revenue attribution in BigQuery'
              ].map((querySample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiDiscoveryQuery(querySample);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/50 transition-colors"
                >
                  "{querySample}"
                </button>
              ))}
            </div>

            {/* Discovery Results & Semantic Decomposition Output */}
            {aiDiscoveryResult && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                {/* Decomposition summary */}
                {aiDiscoveryResult.decomposition && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Layers size={14} />
                        Semantic Query Variations ({aiDiscoveryResult.decomposition.variations?.length || 0})
                      </span>
                      {aiDiscoveryResult.decomposition.predicates?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">Extracted Predicates:</span>
                          {aiDiscoveryResult.decomposition.predicates.map((p, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 font-mono text-[10px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {aiDiscoveryResult.decomposition.variations?.map((variation, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
                          <span className="text-[10px] text-indigo-400 font-bold block mb-1">Variation {idx + 1}:</span>
                          {variation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context Lookup Banner */}
                {aiDiscoveryResult.contextSummary && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
                    <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white mb-0.5">Knowledge Catalog Context Lookup:</span>
                      <p className="text-[11px] text-indigo-300/90 leading-relaxed">{aiDiscoveryResult.contextSummary}</p>
                    </div>
                  </div>
                )}

                {/* Ranked Discovered Assets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Discovered & Reranked Catalog Assets ({aiDiscoveryResult.rankedResults?.length || 0})
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiDiscoveryResult.rankedResults?.map((entry, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database size={14} className="text-indigo-400" />
                            <span className="text-xs font-bold text-white">{entry.displayName || entry.name}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                            {Math.round((entry.score || 0.9) * 100)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{entry.description || 'Mesh data asset'}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-800/60">
                          <span className="font-mono text-indigo-300">{entry.system || 'GCP'} • {entry.domain || 'Omnichannel'}</span>
                          <span>{entry.attributeCount || (entry.attributes || []).length || 8} Attributes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {discoveryResult && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-400" />
                Sensitive Data (PII) Findings
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="pb-3 px-3">Entity</th>
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

      {/* TAB 9: OPEN KNOWLEDGE GRAPH / DCAT */}
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
