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
      setSyncSuccess(`Successfully registered and indexed '${sourceData.name}' into GCP Knowledge Catalog!`);
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
              Knowledge Catalog Discovery Service
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Connect external data sources, discover technical schemas, classify DLP sensitive fields, and register Knowledge Catalog entries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus size={16} className="text-indigo-400" />
            Connect New Mesh Source
          </h2>
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {syncSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-semibold animate-fade-in">
              <CheckCircle2 size={14} className="shrink-0" />
              {syncSuccess}
            </div>
          )}

          <form onSubmit={handleDiscover} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Source Name</label>
              <input
                type="text"
                value={sourceData.name}
                onChange={e => setSourceData({ ...sourceData, name: e.target.value })}
                placeholder="e.g. NetSuite ERP Connector"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Domain</label>
              <input
                type="text"
                value={sourceData.domain}
                onChange={e => setSourceData({ ...sourceData, domain: e.target.value })}
                placeholder="e.g. Finance & Procurement"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Database / Source Type</label>
              <select
                value={sourceData.type}
                onChange={e => setSourceData({ ...sourceData, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="postgresql">PostgreSQL / Cloud SQL</option>
                <option value="mysql">MySQL Database</option>
                <option value="oracle">Oracle Database</option>
                <option value="spanner">Google Cloud Spanner</option>
                <option value="bigquery">Google BigQuery</option>
                <option value="rest_api">REST / OpenAPI Feed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Connection String / Host URI</label>
              <input
                type="text"
                value={sourceData.connectionUri}
                onChange={e => setSourceData({ ...sourceData, connectionUri: e.target.value })}
                placeholder="e.g. postgresql://user:pass@10.0.0.4:5432/crm_db"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Schema DDL / JSON Sample (Optional)</label>
              <textarea
                value={sourceData.schemaSample}
                onChange={e => setSourceData({ ...sourceData, schemaSample: e.target.value })}
                rows={4}
                placeholder="Paste DDL CREATE TABLE statements or sample JSON payload..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              Run Automated Discovery & Profiling
            </button>
          </form>
        </div>

        {/* Right Column: Profiling Preview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 flex flex-col justify-between">
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
                Sync to Knowledge Catalog
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
