import React, { useState } from 'react';
import { Database, Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSourceData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscover = async () => {
    setLoading(true);
    setError(null);
    setDiscoveryResult(null);

    try {
      const data = await api.post('/api/discover', sourceData);
      setDiscoveryResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Source Discovery</h1>
          <p className="text-slate-400 text-sm mt-1">Add new data sources and discover their schema and dependencies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 glass p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            Add New Source
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Name</label>
              <input
                type="text"
                name="name"
                value={sourceData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Oracle EBS HR"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Type</label>
              <select
                name="type"
                value={sourceData.type}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="REST API">REST API</option>
                <option value="Oracle DB">Oracle DB</option>
                <option value="Spanner">Spanner</option>
                <option value="BigQuery">BigQuery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Connection URI / Endpoint</label>
              <input
                type="text"
                name="uri"
                value={sourceData.uri}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. https://api.oracle.com/ebs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Domain</label>
              <input
                type="text"
                name="domain"
                value={sourceData.domain}
                onChange={handleInputChange}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Human Resources"
              />
            </div>

            <button
              onClick={handleDiscover}
              disabled={loading || !sourceData.name || !sourceData.uri}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Discovering...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Discover Schema
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 glass p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database size={18} className="text-purple-500" />
            Discovery Results
          </h2>

          {!discoveryResult && !loading && !error && (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
              <Database size={48} className="opacity-20 mb-4" />
              <p>Enter source details and click Discover to see results.</p>
            </div>
          )}

          {loading && (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
              <div className="size-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p>Analyzing endpoint and detecting schema...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <div>
                <h3 className="text-sm font-medium text-red-500">Discovery Failed</h3>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {discoveryResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="block text-xs font-medium text-slate-500">Status</span>
                  <span className="text-sm font-semibold text-green-500 flex items-center gap-1 mt-1">
                    <CheckCircle size={14} />
                    Success
                  </span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="block text-xs font-medium text-slate-500">Entities Found</span>
                  <span className="text-lg font-bold text-white mt-1">{discoveryResult.entities?.length || 0}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="block text-xs font-medium text-slate-500">Attributes</span>
                  <span className="text-lg font-bold text-white mt-1">
                    {discoveryResult.entities?.reduce((acc: number, e: any) => acc + (e.attributes?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="block text-xs font-medium text-slate-500">Dependencies</span>
                  <span className="text-lg font-bold text-white mt-1">{discoveryResult.correlations?.length || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-400">Detected Entities</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {discoveryResult.entities?.map((entity: any, i: number) => (
                    <div key={i} className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                      <span className="text-sm font-medium text-white">{entity.name}</span>
                      <div className="text-xs text-slate-500 mt-1">
                        Columns: {entity.attributes?.map((a: any) => `${a.name} (${a.type})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {discoveryResult.correlations && discoveryResult.correlations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-400">Detected Dependencies (Cross-Domain)</h3>
                  <div className="space-y-2">
                    {discoveryResult.correlations.map((rel: any, i: number) => (
                      <div key={i} className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500">Local Entity & Attribute</span>
                          <p className="text-sm font-medium text-white">{rel.localEntity}.{rel.localAttr}</p>
                        </div>
                        <div className="text-slate-600">→</div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">Target Entity & Source</span>
                          <p className="text-sm font-medium text-blue-400">{rel.targetEntity} ({rel.targetSource})</p>
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
