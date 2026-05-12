import { useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../utils/api';
import { Database, X, Shield, BookOpen, Save, Lock, Key, Sparkles, Check, RefreshCw } from 'lucide-react';

const domainColors: { [key: string]: string } = {
    Finance: '#f97316', // orange-500
    Sales: '#3b82f6', // blue-500
    Unified: '#a855f7' // purple-500
};

export function InventoryGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
    
    // Selected Node Inspector States
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [nodeDetails, setNodeDetails] = useState<any | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
    
    // Editable Form States
    const [formData, setFormData] = useState<{ [col: string]: { description: string; glossaryTerm: string; isSensitive: boolean } }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Resize listener
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width === 0) continue;
                // Graph takes 100% width if no node selected, otherwise w-3/5 (approx 60%)
                const scale = selectedNode ? 0.62 : 1.0;
                setDimensions({
                    width: Math.floor(entry.contentRect.width * scale) - 24,
                    height: 480
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [selectedNode]);

    // Fetch Master Glossary Terms
    useEffect(() => {
        const fetchGlossary = async () => {
            try {
                const res = await api.get('/api/governance/policies'); // triggers glossary load
                if (res) {
                    // Load terms from local file
                    const terms = [
                        { name: 'customer-id', displayName: 'Customer Identifier', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/customer-id' },
                        { name: 'order-amount', displayName: 'Order Grand Total', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/order-amount' },
                        { name: 'product-sku', displayName: 'Product SKU', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/product-sku' },
                        { name: 'membership-tier', displayName: 'Loyalty Tier', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/membership-tier' },
                        { name: 'transaction-date', displayName: 'Transaction Timestamp', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/transaction-date' }
                    ];
                    setGlossaryTerms(terms);
                }
            } catch (e) {}
        };
        fetchGlossary();
    }, []);

    // Load Graph Data
    const fetchGraph = async () => {
        try {
            const res = await api.get('/api/catalog/graph');
            
            const defaultNodes = [
                { id: 'oracle', type: 'source', label: 'Oracle ERP', properties: { domain: 'Finance' } },
                { id: 'spanner', type: 'source', label: 'Spanner Retail', properties: { domain: 'Sales' } },
                { id: 'bigquery', type: 'source', label: 'BigQuery Analytics', properties: { domain: 'Unified' } },
                
                { id: 'suppliers', type: 'table', label: 'Suppliers', properties: { domain: 'Finance' } },
                { id: 'purchase_orders', type: 'table', label: 'Purchase Orders', properties: { domain: 'Finance' } },
                
                { id: 'global_inventory', type: 'table', label: 'Global Inventory', properties: { domain: 'Sales' } },
                { id: 'stores', type: 'table', label: 'Stores', properties: { domain: 'Sales' } },
                
                { id: 'customer_segments', type: 'table', label: 'Customer Segments', properties: { domain: 'Unified' } },
                { id: 'sales_forecasting', type: 'table', label: 'Sales Forecasting', properties: { domain: 'Unified' } }
            ];

            const defaultLinks = [
                { source: 'oracle', target: 'suppliers' },
                { source: 'oracle', target: 'purchase_orders' },
                { source: 'spanner', target: 'global_inventory' },
                { source: 'spanner', target: 'stores' },
                { source: 'bigquery', target: 'customer_segments' },
                { source: 'bigquery', target: 'sales_forecasting' },
                
                { source: 'suppliers', target: 'global_inventory', label: 'supplies' },
                { source: 'global_inventory', target: 'sales_forecasting', label: 'forecasts' }
            ];

            if (!res || !res.nodes || res.nodes.length === 0) {
                setGraphData({ nodes: defaultNodes, links: defaultLinks });
            } else {
                const mappedNodes = res.nodes.map((n: any) => ({
                    id: n.id,
                    type: n.group === 'source' ? 'source' : 'table',
                    label: n.label,
                    properties: { domain: n.id.includes('ora') ? 'Finance' : n.id.includes('span') ? 'Sales' : 'Unified' }
                }));
                setGraphData({ nodes: mappedNodes, links: res.links });
            }
        } catch (e) {
            console.error("Failed to load graph", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    // Load Selected Node Attributes Schema details
    const handleNodeClick = async (node: any) => {
        if (node.type === 'source') {
            setSelectedNode(null);
            setNodeDetails(null);
            return;
        }
        
        setSelectedNode(node);
        setIsLoadingDetails(true);
        setSaveSuccess(false);
        
        try {
            // Dynamic FQN lookup: sourceId.tableId
            const entityId = node.id.includes('.') ? node.id : `bigquery.${node.id}`; // fallback
            const res = await api.get(`/api/catalog/entities/${entityId}`);
            if (res && !res.error) {
                setNodeDetails(res);
                
                // Initialize form values
                const initialForm: any = {};
                (res.attributes || []).forEach((attr: any) => {
                    initialForm[attr.name] = {
                        description: attr.description || '',
                        glossaryTerm: attr.termId || '',
                        isSensitive: !!attr.isSensitive
                    };
                });
                setFormData(initialForm);
            }
        } catch (e) {
            console.error("Failed to fetch node details", e);
            setNodeDetails(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // Save metadata changes
    const handleSaveEnrichment = async () => {
        if (!selectedNode || !nodeDetails) return;
        
        setIsSaving(true);
        try {
            const updatesList: any[] = [];
            const glossaryList: any[] = [];
            
            Object.entries(formData).forEach(([colName, values]) => {
                updatesList.push({
                    table: nodeDetails.name,
                    column: colName,
                    description: values.description
                });
                
                if (values.glossaryTerm) {
                    const matchedTerm = glossaryTerms.find(t => t.id === values.glossaryTerm);
                    glossaryList.push({
                        column: colName,
                        term_id: values.glossaryTerm,
                        term_display: matchedTerm ? matchedTerm.displayName : colName
                    });
                }
            });

            // Asynchronously apply both description and glossary changes
            const datasetId = 'marketing_edw';
            const sourceId = nodeDetails.sourceId || 'bigquery';
            
            await Promise.all([
                api.post('/api/governance/apply-propagation', { dataset: datasetId, updates: updatesList, sourceId }),
                glossaryList.length > 0 
                    ? api.post('/api/governance/glossary-apply', { dataset: datasetId, table: nodeDetails.name, updates: glossaryList })
                    : Promise.resolve()
            ]);

            setSaveSuccess(true);
            fetchGraph(); // Reload graph schemas
        } catch (err) {
            console.error("Save metadata enrichment failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="h-[520px] flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px] font-bold bg-slate-900/40 rounded-3xl border border-white/10">Mapping Inventory Assets...</div>;
    }

    return (
        <div ref={containerRef} className="w-full grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* Graph Canvas Container */}
            <div className={`bg-slate-900/40 rounded-3xl border border-white/10 h-[580px] relative overflow-hidden isolate flex flex-col justify-center transition-all duration-300 ${
                selectedNode ? 'lg:col-span-6' : 'lg:col-span-10'
            }`}>
                <div className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                    <Database size={12} className="text-primary" />
                    Mesh Asset Trace Map
                </div>

                <div className="flex-1 relative flex items-center justify-center">
                    <ForceGraph2D
                        graphData={graphData}
                        width={dimensions.width}
                        height={500}
                        nodeLabel="label"
                        nodeRelSize={6}
                        onNodeClick={handleNodeClick}
                        linkColor={(link: any) => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const sourceNode = graphData.nodes.find((n: any) => n.id === sourceId);
                            const domain = sourceNode?.properties?.domain || sourceNode?.domain || 'Unified';
                            const colors: { [key: string]: string } = {
                                Finance: '#f97316',
                                Sales: '#3b82f6',
                                Unified: '#a855f7'
                            };
                            return colors[domain] || 'rgba(255,255,255,0.15)';
                        }}
                        linkWidth={(link: any) => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const isPhysical = sourceId === 'oracle' || sourceId === 'spanner' || sourceId === 'bigquery';
                            return isPhysical ? 2.5 : 1;
                        }}
                        linkDirectionalParticles={(link: any) => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const isPhysical = sourceId === 'oracle' || sourceId === 'spanner' || sourceId === 'bigquery';
                            return isPhysical ? 4 : 0;
                        }}
                        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                            const label = node.label;
                            let displayName = label;
                            if (label && label.includes('.')) {
                                displayName = label.split('.').pop() || label;
                            }
                            const domain = node.properties?.domain || node.domain || 'Unified';
                            const type = node.type || 'entity';
                            const color = domainColors[domain] || '#6366f1';
                            
                            // Pill size dynamically scalable based on node type
                            const isSource = node.type === 'source';
                            const pillWidth = (isSource ? 112 : 90) / globalScale;
                            const pillHeight = (isSource ? 42 : 32) / globalScale;
                            const radius = 6 / globalScale;
                            
                            const isSelected = selectedNode && selectedNode.id === node.id;

                            ctx.save();

                            // Selected Pulsing Ring Glow Effect
                            if (isSelected) {
                                const time = Date.now() * 0.003;
                                ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                                ctx.lineWidth = 6 / globalScale;
                                ctx.beginPath();
                                ctx.roundRect(node.x - pillWidth / 2 - 2, node.y - pillHeight / 2 - 2, pillWidth + 4, pillHeight + 4, radius + 2);
                                ctx.stroke();
                            }

                            // Pill Capsule Base
                            ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)';
                            ctx.beginPath();
                            ctx.roundRect(node.x - pillWidth / 2, node.y - pillHeight / 2, pillWidth, pillHeight, radius);
                            ctx.fill();

                            // Border Outline (Color by Domain)
                            ctx.strokeStyle = isSelected ? '#3b82f6' : color;
                            ctx.lineWidth = isSource ? (2.5 / globalScale) : (1.2 / globalScale);
                            ctx.stroke();

                            // Left Side Domain Marker Strip (Thicker for major sources)
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.roundRect(node.x - pillWidth / 2, node.y - pillHeight / 2, (isSource ? 8 : 5) / globalScale, pillHeight, [radius, 0, 0, radius]);
                            ctx.fill();

                            // --- Automated Font Autoscaling Algorithm ---
                            const maxAllowedWidth = pillWidth - (isSource ? 22 : 14);
                            const baseSize = (isSource ? 11 : 8.5) / globalScale;
                            const minSize = (isSource ? 7.5 : 6) / globalScale;

                            // 1. Set base size to measure text width
                            ctx.font = `bold ${baseSize}px Inter, system-ui, sans-serif`;
                            const textWidth = ctx.measureText(displayName).width;

                            // 2. Adjust font size if text exceeds margins
                            let fontSize = baseSize;
                            if (textWidth > maxAllowedWidth) {
                                const scaleFactor = maxAllowedWidth / textWidth;
                                fontSize = Math.max(baseSize * scaleFactor, minSize);
                            }

                            // 3. Apply dynamically scaled font
                            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#ffffff';

                            // 4. Ellipsis fallback (Only if text still exceeds margins at minimum font size)
                            let displayText = displayName;
                            const finalWidth = ctx.measureText(displayName).width;
                            if (finalWidth > maxAllowedWidth) {
                                const maxCharLength = Math.floor((maxAllowedWidth / finalWidth) * displayName.length) - 3;
                                if (maxCharLength > 3) {
                                    displayText = displayName.substring(0, maxCharLength) + '...';
                                }
                            }
                            ctx.fillText(displayText, node.x + (2.5 / globalScale), node.y - (pillHeight / 8));

                            // Type Indicator Subtitle
                            const typeFontSize = Math.max(5, (isSource ? 7.5 : 6.5) / globalScale);
                            ctx.font = `bold ${typeFontSize}px Inter, system-ui, sans-serif`;
                            ctx.fillStyle = isSelected ? '#3b82f6' : '#94a3b8';
                            ctx.fillText(type.toUpperCase(), node.x + (2.5 / globalScale), node.y + (pillHeight / 4));

                            ctx.restore();
                        }}
                    />
                </div>
            </div>

            {/* Node Form Inspector Sidebar */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="lg:col-span-4 glass rounded-3xl border border-white/10 h-[580px] flex flex-col overflow-hidden relative"
                    >
                        {isLoadingDetails ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                            <RefreshCw className="animate-spin text-primary mb-4" size={32} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading asset schema...</span>
                          </div>
                        ) : nodeDetails ? (
                          <div className="flex-1 flex flex-col h-full">
                            
                            {/* Form Header */}
                            <div className="p-5 border-b border-white/10 flex justify-between items-start bg-black/40">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                                    nodeDetails.sourceId === 'oracle' ? 'bg-orange-500/20 text-orange-400' :
                                    nodeDetails.sourceId === 'spanner' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-purple-500/20 text-purple-400'
                                  }`}>
                                    {nodeDetails.sourceId}
                                  </span>
                                  <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 uppercase">
                                    {nodeDetails.type}
                                  </span>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{nodeDetails.name}</h3>
                              </div>
                              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                              </button>
                            </div>

                            {/* Save overlay */}
                            <AnimatePresence>
                              {saveSuccess && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                                >
                                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                    <Check size={32} />
                                  </div>
                                  <h4 className="text-lg font-bold text-white">Metadata Synchronized!</h4>
                                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">Column descriptions and Dataplex glossary EntryLinks successfully updated.</p>
                                  <button 
                                    onClick={() => setSaveSuccess(false)}
                                    className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Columns Form Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                  <Database size={14} className="text-primary" /> Columns Schema Enrichment
                                </h4>
                                
                                <div className="space-y-6">
                                  {(nodeDetails.attributes || []).map((attr: any) => (
                                    <div key={attr.name} className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3.5">
                                      
                                      {/* Column Header */}
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="font-bold text-slate-200 text-sm font-mono">{attr.name}</span>
                                          <span className="block text-[10px] font-mono text-slate-500 uppercase mt-0.5">{attr.dataType}</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                          {attr.isPrimaryKey && (
                                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono" title="Primary Key">PK</span>
                                          )}
                                          {attr.isSensitive && (
                                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 font-mono" title="Sensitive PII"><Lock size={8} /> PII</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Description Form Field */}
                                      <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schema Description</label>
                                        <textarea
                                          value={formData[attr.name]?.description || ''}
                                          onChange={e => setFormData({
                                            ...formData,
                                            [attr.name]: { ...formData[attr.name], description: e.target.value }
                                          })}
                                          rows={2}
                                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-primary/40 outline-none placeholder:text-slate-600 scrollbar-none"
                                          placeholder="Add technical description or click propagate in Governance..."
                                        />
                                      </div>

                                      {/* Glossary term selection */}
                                      <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                          <BookOpen size={10} /> Business Glossary Link
                                        </label>
                                        <select
                                          value={formData[attr.name]?.glossaryTerm || ''}
                                          onChange={e => setFormData({
                                            ...formData,
                                            [attr.name]: { ...formData[attr.name], glossaryTerm: e.target.value }
                                          })}
                                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-primary/40 outline-none appearance-none cursor-pointer"
                                        >
                                          <option value="">Unlinked (Click to select term...)</option>
                                          {glossaryTerms.map(term => (
                                            <option key={term.id} value={term.id}>
                                              {term.displayName}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Form Action Footer */}
                            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3 shrink-0">
                              <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleSaveEnrichment}
                                disabled={isSaving}
                                className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-primary/20 hover:bg-primary/80 flex items-center gap-1.5 transition-all disabled:opacity-50"
                              >
                                <Save size={14} /> {isSaving ? 'Syncing...' : 'Save & Propagate Changes'}
                              </button>
                            </div>

                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                            <X className="text-slate-500 mb-4" size={32} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed to load schema catalog.</span>
                          </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
