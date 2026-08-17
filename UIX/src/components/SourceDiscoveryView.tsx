import React, { useState } from 'react';
import { Database, Plus, Search, CheckCircle, AlertTriangle, ShieldCheck, Tag, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export const SourceDiscoveryView = () => {
  const [sourceData, setSourceData] = useState({
    name: '',
    type: 'REST API',
    uri: '',
    domain: '',
  });

  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSourceData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscover = async () => {
    setLoading(true);
    setError(null);
    setDiscoveryResult(null);
    setSyncSuccess(null);

    try {
      const data = await api.post('/api/discover', sourceData);
      setDiscoveryResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToKnowledgeCatalog = async () => {
    if (!discoveryResult) return;
    setIsSyncing(true);
    try {
      // Trigger mesh catalog discovery scan to index newly registered source
      await api.post('/api/discovery/scan', { sourceId: sourceData.name.toLowerCase().replace(/\s+/g, '_') });
      setSyncSuccess(`Successfully registered and indexed '${sourceData.name}' into GCP Knowledge Catalog & Dataplex!`);
    } catch (err: any) {
      setError(`Failed to sync to catalog: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to detect sensitive attributes in preview
  const isAttributeSensitive = (name: string) => {
    const n = name.toLowerCase();
    return ['card', 'email', 'phone', 'ssn', 'salary', 'password', 'token', 'tax_id', 'bank_account'].some(k => n.includes(k));
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Source Discovery & Schema Ingestion</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Dataplex Discovery Service
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Connect external data sources, discover technical schemas, classify DLP sensitive fields, and register Dataplex catalog entries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus size={16} className="text-indigo-400" />
            Add New Source Connector
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Source Name</label>
              <input
                type="text"
                name="name"
                value={sourceData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Oracle EBS HR"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Source Type</label>
              <select
                name="type"
                value={sourceData.type}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="REST API">REST API / OpenAPI</option>
                <option value="Oracle DB">Oracle DB (Database@Google Cloud)</option>
                <option value="Spanner">Cloud Spanner (Retail/Graph)</option>
                <option value="BigQuery">BigQuery Analytics EDW</option>
                <option value="AlloyDB">AlloyDB PostgreSQL (CRM)</option>
                <option value="NetSuite">NetSuite ERP Connector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Connection URI / Endpoint</label>
              <input
                type="text"
                name="uri"
                value={sourceData.uri}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder="e.g. https://api.oracle.com/ebs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Mesh Domain</label>
              <input
                type="text"
                name="domain"
                value={sourceData.domain}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Human Resources"
              />
            </div>

            <button
              onClick={handleDiscover}
              disabled={loading || !sourceData.name || !sourceData.uri}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Introspecting Schema...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Discover Schema & Profiling
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database size={16} className="text-indigo-400" />
              Discovery & Profiling Results
            </h2>

            {discoveryResult && (
              <button
                onClick={handleSyncToKnowledgeCatalog}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Sync to Dataplex Knowledge Catalog
              </button>
            )}
          </div>

          {!discoveryResult && !loading && !error && (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 text-xs">
              <Database size={40} className="opacity-20 mb-3" />
              <p>Enter source details and click Discover to profile endpoints.</p>
            </div>
          )}

          {loading && (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 text-xs">
              <div className="size-7 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <p>Analyzing schema endpoints, profiling attributes, and evaluating PII rules...</p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="text-rose-500 shrink-0" size={16} />
              <div>
                <h3 className="font-semibold text-rose-400">Discovery Failed</h3>
                <p className="text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {syncSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-xs">
              <CheckCircle className="text-emerald-400 shrink-0" size={16} />
              <div>
                <h3 className="font-semibold text-emerald-300">Catalog Synchronized</h3>
                <p className="text-emerald-400/90 mt-0.5">{syncSuccess}</p>
              </div>
            </div>
          )}

          {discoveryResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[11px] font-medium text-slate-500">Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle size={12} />
                    Success
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[11px] font-medium text-slate-500">Entities Found</span>
                  <span className="text-base font-bold text-white mt-0.5">{discoveryResult.entities?.length || 0}</span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[11px] font-medium text-slate-500">Attributes Profiled</span>
                  <span className="text-base font-bold text-white mt-0.5">
                    {discoveryResult.entities?.reduce((acc: number, e: any) => acc + (e.attributes?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[11px] font-medium text-slate-500">Cross-Domain Links</span>
                  <span className="text-base font-bold text-indigo-400 mt-0.5">{discoveryResult.correlations?.length || 0}</span>
                </div>
              </div>

              {/* Detected Entities with PII Highlighting */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300">Detected Schema Entities & Attributes</h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {discoveryResult.entities?.map((entity: any, i: number) => (
                    <div key={i} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{entity.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">
                          {(entity.attributes || []).length} columns
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {entity.attributes?.map((a: any, idx: number) => {
                          const isSensitive = isAttributeSensitive(a.name);
                          return (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                                isSensitive
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                              }`}
                            >
                              {a.name} ({a.type}) {isSensitive && '🔒'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inferred Cross-Domain Dependencies */}
              {discoveryResult.correlations && discoveryResult.correlations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300">Inferred Mesh Cross-Domain Correlations</h3>
                  <div className="space-y-2">
                    {discoveryResult.correlations.map((rel: any, i: number) => (
                      <div key={i} className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Local Key</span>
                          <p className="font-semibold text-white">{rel.localEntity}.{rel.localAttr}</p>
                        </div>
                        <div className="text-slate-600 font-bold">↔</div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Target Mesh Key</span>
                          <p className="font-semibold text-indigo-400">{rel.targetEntity} ({rel.targetSource})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceDiscoveryView;
