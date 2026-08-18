import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../utils/api';
import { 
    Database, X, Shield, BookOpen, Save, Lock, Key, Sparkles, Check, 
    RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2, Play, Pause, 
    Search, Focus, ArrowRight, Layers, Table, Activity, Link2, Info, Eye
} from 'lucide-react';
import { 
    DOMAIN_THEME, 
    getDomainStyle, 
    drawSourceNodeCanvas, 
    drawEntityNodeCanvas 
} from '../utils/graphTheme';

interface InventoryGraphProps {
    onSelectEntity?: (entity: any) => void;
}

export function InventoryGraph({ onSelectEntity }: InventoryGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 560 });
    
    // UI Interactive States
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [hoverNode, setHoverNode] = useState<any | null>(null);
    const [nodeDetails, setNodeDetails] = useState<any | null>(null);
    const [sourceDetails, setSourceDetails] = useState<any | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'schema' | 'lineage' | 'source'>('schema');
    
    // Controls & Filters
    const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isPhysicsPaused, setIsPhysicsPaused] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(true);
    
    // Glossary & Edit Form States
    const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
    const [formData, setFormData] = useState<{ [col: string]: { description: string; glossaryTerm: string; isSensitive: boolean } }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Compute Highlighted Neighborhood (1-hop connected nodes & links)
    const { highlightNodes, highlightLinks } = useMemo(() => {
        const hNodes = new Set<string>();
        const hLinks = new Set<any>();
        const focusNode = hoverNode || selectedNode;

        if (focusNode) {
            hNodes.add(focusNode.id);
            graphData.links.forEach((link: any) => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;
                if (sId === focusNode.id || tId === focusNode.id) {
                    hLinks.add(link);
                    hNodes.add(sId);
                    hNodes.add(tId);
                }
            });
        }
        return { highlightNodes: hNodes, highlightLinks: hLinks };
    }, [hoverNode, selectedNode, graphData]);

    // Filter nodes by selected domain
    const filteredGraphData = useMemo(() => {
        const nodes = graphData.nodes || [];
        const links = graphData.links || [];

        if (selectedDomain === 'ALL') {
            const allNodeIds = new Set(nodes.map(n => n.id));
            const safeLinks = links.filter(l => {
                const sId = typeof l.source === 'object' ? l.source?.id : l.source;
                const tId = typeof l.target === 'object' ? l.target?.id : l.target;
                return allNodeIds.has(sId) && allNodeIds.has(tId);
            });
            return { nodes, links: safeLinks };
        }

        const visibleNodes = nodes.filter(n => {
            const domain = n.domain || n.properties?.domain || '';
            const style = getDomainStyle(domain, n.sourceId || n.id);
            return style.name.toLowerCase().includes(selectedDomain.toLowerCase()) || 
                   domain.toLowerCase().includes(selectedDomain.toLowerCase());
        });
        
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
        const visibleLinks = links.filter(l => {
            const sId = typeof l.source === 'object' ? l.source?.id : l.source;
            const tId = typeof l.target === 'object' ? l.target?.id : l.target;
            return visibleNodeIds.has(sId) && visibleNodeIds.has(tId);
        });

        return { nodes: visibleNodes, links: visibleLinks };
    }, [graphData, selectedDomain]);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width === 0) continue;
                const isSidebarOpen = !!selectedNode;
                const scale = isSidebarOpen && !isFullscreen ? 0.63 : 1.0;
                setDimensions({
                    width: Math.max(300, Math.floor(entry.contentRect.width * scale) - (isSidebarOpen ? 24 : 0)),
                    height: isFullscreen ? window.innerHeight - 100 : 540
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [selectedNode, isFullscreen]);

    // Fetch Master Glossary Terms
    useEffect(() => {
        const fetchGlossary = async () => {
            try {
                await api.get('/api/governance/policies');
                const terms = [
                    { name: 'customer-id', displayName: 'Customer Identifier', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/customer-id' },
                    { name: 'order-amount', displayName: 'Order Grand Total', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/order-amount' },
                    { name: 'product-sku', displayName: 'Product SKU', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/product-sku' },
                    { name: 'membership-tier', displayName: 'Loyalty Tier', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/membership-tier' },
                    { name: 'transaction-date', displayName: 'Transaction Timestamp', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/transaction-date' },
                    { name: 'supplier-code', displayName: 'Supplier Code', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/supplier-code' },
                    { name: 'warehouse-bin', displayName: 'Warehouse Spatial Bin', id: 'projects/governance-agent/locations/europe-west1/glossaries/retail-common-glossary/terms/warehouse-bin' }
                ];
                setGlossaryTerms(terms);
            } catch (e) {
                console.error("Glossary fetch fallback", e);
            }
        };
        fetchGlossary();
    }, []);

    // Load Graph Data
    const fetchGraph = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/catalog/graph');
            
            const defaultNodes = [
                { id: 'oracle', type: 'source', label: 'Oracle ERP', domain: 'Oracle ERP', status: 'active', mode: 'local', schemaFile: 'db-schemas/oracle_schema.sql' },
                { id: 'spanner', type: 'source', label: 'Spanner Retail', domain: 'Spanner Retail', status: 'active', mode: 'remote', schemaFile: 'db-schemas/spanner_schema.sql' },
                { id: 'bigquery', type: 'source', label: 'BigQuery Analytics', domain: 'BigQuery Analytics', status: 'active', mode: 'remote', schemaFile: 'db-schemas/bigquery_schema.sql' },
                { id: 'alloydb', type: 'source', label: 'AlloyDB CRM', domain: 'AlloyDB CRM', status: 'active', mode: 'remote', schemaFile: 'db-schemas/alloydb_schema.sql' },
                { id: 'netsuite', type: 'source', label: 'NetSuite ERP', domain: 'NetSuite ERP', status: 'active', mode: 'remote', schemaFile: 'db-schemas/netsuite_schema.sql' },
                { id: 'warehouse', type: 'source', label: 'Warehouse Supply Chain', domain: 'Warehouse', status: 'active', mode: 'local', schemaFile: 'db-schemas/warehouse_schema.sql' },
                { id: 'oracle_hr', type: 'source', label: 'Oracle HR', domain: 'HR', status: 'active', mode: 'local', schemaFile: 'db-schemas/hr_schema.sql' },
                
                // Entities
                { id: 'oracle.suppliers', type: 'table', label: 'suppliers', sourceId: 'oracle', domain: 'Oracle ERP', attributesCount: 6 },
                { id: 'oracle.purchase_orders', type: 'table', label: 'purchase_orders', sourceId: 'oracle', domain: 'Oracle ERP', attributesCount: 8 },
                { id: 'spanner.global_inventory', type: 'table', label: 'global_inventory', sourceId: 'spanner', domain: 'Spanner Retail', attributesCount: 7 },
                { id: 'spanner.stores', type: 'table', label: 'stores', sourceId: 'spanner', domain: 'Spanner Retail', attributesCount: 5 },
                { id: 'bigquery.customer_segments', type: 'table', label: 'customer_segments', sourceId: 'bigquery', domain: 'BigQuery Analytics', attributesCount: 9 },
                { id: 'bigquery.sales_forecasting', type: 'table', label: 'sales_forecasting', sourceId: 'bigquery', domain: 'BigQuery Analytics', attributesCount: 8 },
                { id: 'alloydb.customers', type: 'table', label: 'customers', sourceId: 'alloydb', domain: 'AlloyDB CRM', attributesCount: 7 },
                { id: 'netsuite.sales_orders', type: 'table', label: 'sales_orders', sourceId: 'netsuite', domain: 'NetSuite ERP', attributesCount: 6 },
                { id: 'warehouse.warehouse_master', type: 'table', label: 'warehouse_master', sourceId: 'warehouse', domain: 'Warehouse', attributesCount: 5 }
            ];

            const defaultLinks = [
                { source: 'oracle', target: 'oracle.suppliers', type: 'ownership', label: 'owns' },
                { source: 'oracle', target: 'oracle.purchase_orders', type: 'ownership', label: 'owns' },
                { source: 'spanner', target: 'spanner.global_inventory', type: 'ownership', label: 'owns' },
                { source: 'spanner', target: 'spanner.stores', type: 'ownership', label: 'owns' },
                { source: 'bigquery', target: 'bigquery.customer_segments', type: 'ownership', label: 'owns' },
                { source: 'bigquery', target: 'bigquery.sales_forecasting', type: 'ownership', label: 'owns' },
                { source: 'alloydb', target: 'alloydb.customers', type: 'ownership', label: 'owns' },
                { source: 'netsuite', target: 'netsuite.sales_orders', type: 'ownership', label: 'owns' },
                { source: 'warehouse', target: 'warehouse.warehouse_master', type: 'ownership', label: 'owns' },
                
                // Cross domain / Foreign key links
                { source: 'oracle.suppliers', target: 'spanner.global_inventory', type: 'cross_domain', label: 'correlates (supplier_id)' },
                { source: 'spanner.global_inventory', target: 'bigquery.sales_forecasting', type: 'cross_domain', label: 'correlates (store_id)' },
                { source: 'alloydb.customers', target: 'bigquery.customer_segments', type: 'cross_domain', label: 'correlates (customer_id)' },
                { source: 'spanner.global_inventory', target: 'warehouse.warehouse_master', type: 'cross_domain', label: 'correlates (warehouse_id)' }
            ];

            if (res && res.nodes && res.nodes.length > 0) {
                const nodeIds = new Set(res.nodes.map((n: any) => n.id));
                const safeLinks = (res.links || []).filter((l: any) => {
                    const s = typeof l.source === 'object' ? l.source?.id : l.source;
                    const t = typeof l.target === 'object' ? l.target?.id : l.target;
                    return nodeIds.has(s) && nodeIds.has(t);
                });
                setGraphData({ nodes: res.nodes, links: safeLinks });
            } else {
                setGraphData({ nodes: defaultNodes, links: defaultLinks });
            }
        } catch (e) {
            console.error("Failed to load catalog graph", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    // Force simulation parameters & tuning
    useEffect(() => {
        if (!fgRef.current) return;
        try {
            if (typeof fgRef.current.d3Force === 'function') {
                const charge = fgRef.current.d3Force('charge');
                if (charge && typeof charge.strength === 'function') {
                    charge.strength(-260);
                }
                const link = fgRef.current.d3Force('link');
                if (link && typeof link.distance === 'function') {
                    link.distance((l: any) => {
                        if (l && l.type === 'cross_domain') return 140;
                        if (l && l.type === 'ownership') return 70;
                        return 95;
                    });
                }
            }
        } catch (err) {
            console.warn("Force simulation tuning warning:", err);
        }
    }, [graphData]);

    // Zoom & Focus Handlers
    const handleZoomIn = () => {
        if (!fgRef.current) return;
        fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
    };

    const handleZoomOut = () => {
        if (!fgRef.current) return;
        fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
    };

    const handleFitView = () => {
        if (!fgRef.current) return;
        fgRef.current.zoomToFit(500, 60);
    };

    const togglePhysics = () => {
        if (!fgRef.current) return;
        if (isPhysicsPaused) {
            fgRef.current.resumeAnimation();
            setIsPhysicsPaused(false);
        } else {
            fgRef.current.pauseAnimation();
            setIsPhysicsPaused(true);
        }
    };

    // Node Click Inspector Handler
    const handleNodeClick = async (node: any) => {
        setSelectedNode(node);
        setIsLoadingDetails(true);
        setSaveSuccess(false);
        if (onSelectEntity) onSelectEntity(node);

        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 500);
            fgRef.current.zoom(1.8, 500);
        }

        if (node.type === 'source' || node.group === 'source') {
            setActiveTab('source');
            try {
                const res = await api.get(`/api/catalog/sources/${node.id}`);
                setSourceDetails(res || {
                    id: node.id,
                    name: node.label || node.id,
                    domain: node.domain || 'Unified',
                    mode: node.mode || 'local',
                    schemaFile: node.schemaFile || 'Standard DDL',
                    status: node.status || 'active',
                    entitiesCount: graphData.nodes.filter(n => n.sourceId === node.id).length
                });
            } catch (e) {
                setSourceDetails({
                    id: node.id,
                    name: node.label || node.id,
                    domain: node.domain || 'Unified',
                    mode: node.mode || 'local',
                    schemaFile: node.schemaFile || 'Standard DDL',
                    status: node.status || 'active',
                    entitiesCount: graphData.nodes.filter(n => n.sourceId === node.id).length
                });
            } finally {
                setIsLoadingDetails(false);
            }
        } else {
            setActiveTab('schema');
            try {
                const entityId = node.id.includes('.') ? node.id : `${node.sourceId || 'bigquery'}.${node.id}`;
                const res = await api.get(`/api/catalog/entities/${entityId}`);
                if (res && !res.error) {
                    setNodeDetails(res);
                    const initialForm: any = {};
                    (res.attributes || []).forEach((attr: any) => {
                        initialForm[attr.name] = {
                            description: attr.description || '',
                            glossaryTerm: attr.termId || '',
                            isSensitive: !!attr.isSensitive
                        };
                    });
                    setFormData(initialForm);
                } else {
                    setNodeDetails(null);
                }
            } catch (e) {
                console.error("Failed to load node details", e);
                setNodeDetails(null);
            } finally {
                setIsLoadingDetails(false);
            }
        }
    };

    // Save Metadata Changes
    const handleSaveEnrichment = async () => {
        if (!selectedNode || !nodeDetails) return;
        setIsSaving(true);
        try {
            const updatesList: any[] = [];
            const glossaryList: any[] = [];
            
            Object.keys(formData).forEach((colName) => {
                const values = formData[colName];
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

            const datasetId = 'marketing_edw';
            const sourceId = nodeDetails.sourceId || 'bigquery';
            
            await Promise.all([
                api.post('/api/governance/apply-propagation', { dataset: datasetId, updates: updatesList, sourceId }),
                glossaryList.length > 0 
                    ? api.post('/api/governance/glossary-apply', { dataset: datasetId, table: nodeDetails.name, updates: glossaryList })
                    : Promise.resolve()
            ]);

            setSaveSuccess(true);
            fetchGraph();
        } catch (err) {
            console.error("Save metadata failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Search Box Selection Focus
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const matched = graphData.nodes.find(n => 
            (n.label || n.name || n.id).toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matched) {
            handleNodeClick(matched);
        }
    };

    const domainOptions = ['ALL', 'Finance', 'Sales', 'Analytics', 'CRM', 'NetSuite', 'Warehouse', 'HR', 'Catalog'];

    return (
        <div 
            ref={containerRef} 
            className={`w-full transition-all duration-300 ${
                isFullscreen ? 'fixed inset-0 z-50 bg-slate-950/95 p-6 backdrop-blur-xl flex flex-col' : 'relative'
            }`}
        >
            <div className="w-full grid grid-cols-1 lg:grid-cols-10 gap-6">
                
                {/* Main Graph Canvas View */}
                <div className={`bg-slate-950/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden isolate flex flex-col transition-all duration-300 ${
                    selectedNode ? 'lg:col-span-6' : 'lg:col-span-10'
                } ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[580px]'}`}>
                    
                    {/* Top Floating Glass Header Toolbar */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                        
                        {/* Left: Title Badge & Domain Filter Chips */}
                        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-lg">
                            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                                <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                    <Database size={15} />
                                </div>
                                <span className="text-xs font-bold text-white tracking-wide">Cross-Domain Graph</span>
                            </div>

                            {/* Domain Chips */}
                            <div className="flex items-center gap-1 overflow-x-auto max-w-[400px] scrollbar-none py-0.5">
                                {domainOptions.map(domain => {
                                    const style = domain !== 'ALL' ? getDomainStyle(domain) : null;
                                    const isActive = selectedDomain === domain;
                                    return (
                                        <button
                                            key={domain}
                                            onClick={() => setSelectedDomain(domain)}
                                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                                                isActive 
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary' 
                                                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                                            }`}
                                        >
                                            {style && (
                                                <span 
                                                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" 
                                                    style={{ backgroundColor: style.primary }} 
                                                />
                                            )}
                                            {domain}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Search + Action Control Buttons */}
                        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                            
                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search node..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-900/80 border border-white/10 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 w-28 focus:w-40 transition-all"
                                />
                            </form>

                            <div className="h-4 w-[1px] bg-white/10 mx-1" />

                            <button
                                onClick={handleZoomIn}
                                title="Zoom In"
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <button
                                onClick={handleZoomOut}
                                title="Zoom Out"
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <button
                                onClick={handleFitView}
                                title="Fit to View"
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            >
                                <Focus size={14} />
                            </button>
                            <button
                                onClick={togglePhysics}
                                title={isPhysicsPaused ? "Resume Simulation" : "Pause Simulation"}
                                className={`p-1.5 rounded-xl transition-colors ${
                                    isPhysicsPaused ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                                }`}
                            >
                                {isPhysicsPaused ? <Play size={14} /> : <Pause size={14} />}
                            </button>
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            >
                                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button
                                onClick={fetchGraph}
                                title="Reload Graph"
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom HUD Legend */}
                    {showLegend && (
                        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-4 text-[10px] text-slate-300 font-medium shadow-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-md bg-indigo-500 border border-indigo-400" />
                                <span>Source Engines</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/80 border border-emerald-400" />
                                <span>Entities / Tables</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed border-amber-300" />
                                <span>Cross-Domain Correlations</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-0.5 bg-cyan-400" />
                                <span>Foreign Keys</span>
                            </div>
                        </div>
                    )}

                    {/* Canvas ForceGraph2D */}
                    <div className="flex-1 w-full h-full relative flex items-center justify-center">
                        {loading && (
                            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
                                <RefreshCw size={36} className="animate-spin text-primary mb-3" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Mapping Mesh Topologies & Cross-Domain Links...</span>
                            </div>
                        )}
                        <ForceGraph2D
                            ref={fgRef}
                            graphData={filteredGraphData}
                            width={dimensions.width}
                            height={dimensions.height}
                            nodeLabel="label"
                            nodeRelSize={6}
                            d3VelocityDecay={0.35}
                            d3AlphaDecay={0.02}
                            onNodeClick={handleNodeClick}
                            onNodeHover={(node: any) => setHoverNode(node || null)}
                            cooldownTicks={120}
                            minZoom={0.2}
                            maxZoom={4.5}
                            linkDirectionalArrowLength={(link: any) => link.type === 'relationship' ? 5.5 : 0}
                            linkDirectionalArrowRelPos={0.92}
                            linkColor={(link: any) => {
                                const isHighlighted = highlightLinks.has(link);
                                const isDimmed = (hoverNode || selectedNode) && !isHighlighted;
                                
                                if (isDimmed) return 'rgba(255,255,255,0.03)';
                                
                                if (link.type === 'cross_domain') {
                                    return isHighlighted ? '#fbbf24' : 'rgba(245, 158, 11, 0.7)';
                                }
                                if (link.type === 'relationship') {
                                    return isHighlighted ? '#22d3ee' : 'rgba(6, 182, 212, 0.5)';
                                }
                                return isHighlighted ? '#818cf8' : 'rgba(99, 102, 241, 0.35)';
                            }}
                            linkWidth={(link: any) => {
                                const isHighlighted = highlightLinks.has(link);
                                if (link.type === 'cross_domain') return isHighlighted ? 3.5 : 2.0;
                                if (link.type === 'relationship') return isHighlighted ? 2.5 : 1.2;
                                return isHighlighted ? 2.0 : 1.0;
                            }}
                            linkDirectionalParticles={(link: any) => {
                                const isHighlighted = highlightLinks.has(link);
                                if (link.type === 'cross_domain') return isHighlighted ? 6 : 3;
                                if (link.type === 'ownership') return isHighlighted ? 4 : 1;
                                return isHighlighted ? 3 : 0;
                            }}
                            linkDirectionalParticleSpeed={(link: any) => {
                                return link.type === 'cross_domain' ? 0.008 : 0.004;
                            }}
                            linkDirectionalParticleWidth={(link: any) => {
                                return link.type === 'cross_domain' ? 2.8 : 1.8;
                            }}
                            linkDirectionalParticleColor={(link: any) => {
                                if (link.type === 'cross_domain') return '#fde047';
                                return '#60a5fa';
                            }}
                            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                                const isSelected = selectedNode && selectedNode.id === node.id;
                                const isHovered = hoverNode && hoverNode.id === node.id;
                                const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
                                const isDimmed = !isHighlighted;

                                if (node.type === 'source' || node.group === 'source') {
                                    drawSourceNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
                                } else {
                                    drawEntityNodeCanvas(node, ctx, globalScale, isSelected, isHovered, isDimmed);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Right Interactive Inspector Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div 
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className={`lg:col-span-4 bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 flex flex-col overflow-hidden relative shadow-2xl ${
                                isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[580px]'
                            }`}
                        >
                            {/* Panel Header */}
                            <div className="p-5 border-b border-white/10 bg-black/40 flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            selectedNode.type === 'source' 
                                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                            {selectedNode.type === 'source' ? 'SOURCE ENGINE' : (selectedNode.type || 'TABLE').toUpperCase()}
                                        </span>
                                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                                            {selectedNode.domain || 'Unified'}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-white leading-tight">
                                        {selectedNode.label || selectedNode.name || selectedNode.id}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => { setSelectedNode(null); setNodeDetails(null); setSourceDetails(null); }}
                                    className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tabs Header (For Tables) */}
                            {selectedNode.type !== 'source' && (
                                <div className="flex border-b border-white/10 bg-slate-950/40 px-4 pt-2">
                                    <button
                                        onClick={() => setActiveTab('schema')}
                                        className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                                            activeTab === 'schema' 
                                                ? 'border-primary text-primary' 
                                                : 'border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Table size={13} /> Columns Schema
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('lineage')}
                                        className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                                            activeTab === 'lineage' 
                                                ? 'border-primary text-primary' 
                                                : 'border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Link2 size={13} /> Graph Links & Keys
                                    </button>
                                </div>
                            )}

                            {/* Panel Body Content */}
                            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-4">
                                {isLoadingDetails ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                        <RefreshCw size={28} className="animate-spin text-primary mb-3" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inspecting Asset Telemetry...</span>
                                    </div>
                                ) : selectedNode.type === 'source' ? (
                                    /* Source Engine Inspector View */
                                    <div className="space-y-4">
                                        <div className="p-4 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 uppercase font-bold text-[10px]">Source Identifier</span>
                                                <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{sourceDetails?.id || selectedNode.id}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 uppercase font-bold text-[10px]">Engine Mode</span>
                                                <span className="text-indigo-400 font-bold uppercase">{sourceDetails?.mode || 'local'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 uppercase font-bold text-[10px]">Active Status</span>
                                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 uppercase font-bold text-[10px]">Schema DDL Source</span>
                                                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">
                                                    {sourceDetails?.schemaFile || selectedNode.schemaFile || 'db-schemas/schema.sql'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Database size={13} className="text-primary" /> Owned Entities in Mesh
                                            </h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                {graphData.nodes
                                                    .filter(n => n.sourceId === selectedNode.id || n.id.startsWith(`${selectedNode.id}.`))
                                                    .map(entity => (
                                                        <div 
                                                            key={entity.id}
                                                            onClick={() => handleNodeClick(entity)}
                                                            className="p-3 bg-black/20 hover:bg-primary/10 rounded-xl border border-white/5 hover:border-primary/30 flex justify-between items-center cursor-pointer transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Table size={13} className="text-slate-400 group-hover:text-primary" />
                                                                <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-white">
                                                                    {entity.label || entity.name || entity.id}
                                                                </span>
                                                            </div>
                                                            <ArrowRight size={13} className="text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'schema' ? (
                                    /* Columns Schema & Metadata Form */
                                    nodeDetails ? (
                                        <div className="space-y-4">
                                            {saveSuccess && (
                                                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fade-in">
                                                    <Check size={16} /> Metadata Synchronized to Knowledge Catalog!
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {(nodeDetails.attributes || []).map((attr: any) => (
                                                    <div key={attr.name} className="p-3.5 bg-black/30 border border-white/5 rounded-2xl space-y-2.5">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                 <span className="font-mono font-bold text-xs text-white">{attr.name}</span>
                                                                 <span className="block font-mono text-[9px] text-slate-500 uppercase">{attr.dataType}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {attr.isPrimaryKey && (
                                                                    <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                                                                        PK
                                                                    </span>
                                                                )}
                                                                {attr.isSensitive && (
                                                                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                                                        <Lock size={8} /> PII
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Description field */}
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                                                Technical Description
                                                            </label>
                                                            <textarea
                                                                value={formData[attr.name]?.description || ''}
                                                                onChange={e => setFormData({
                                                                    ...formData,
                                                                    [attr.name]: { ...formData[attr.name], description: e.target.value }
                                                                })}
                                                                rows={2}
                                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-primary/50 outline-none placeholder:text-slate-600 scrollbar-none"
                                                                placeholder="Add schema description..."
                                                            />
                                                        </div>

                                                        {/* Glossary link field */}
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                                <BookOpen size={9} /> Business Glossary Link
                                                            </label>
                                                            <select
                                                                value={formData[attr.name]?.glossaryTerm || ''}
                                                                onChange={e => setFormData({
                                                                    ...formData,
                                                                    [attr.name]: { ...formData[attr.name], glossaryTerm: e.target.value }
                                                                })}
                                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:border-primary/50 outline-none cursor-pointer"
                                                            >
                                                                <option value="">Unlinked (Select Knowledge Catalog Term...)</option>
                                                                {glossaryTerms.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.displayName}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-500 text-xs">
                                            Schema catalog information not available for this node.
                                        </div>
                                    )
                                ) : (
                                    /* Relationships & Lineage Tab */
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Link2 size={13} className="text-primary" /> Connected Cross-Domain Relations
                                        </h4>
                                        <div className="space-y-2">
                                            {graphData.links
                                                .filter(l => {
                                                    const sId = typeof l.source === 'object' ? l.source.id : l.source;
                                                    const tId = typeof l.target === 'object' ? l.target.id : l.target;
                                                    return sId === selectedNode.id || tId === selectedNode.id;
                                                })
                                                .map((link, idx) => {
                                                    const sId = typeof link.source === 'object' ? link.source.id : link.source;
                                                    const tId = typeof link.target === 'object' ? link.target.id : link.target;
                                                    const otherId = sId === selectedNode.id ? tId : sId;
                                                    const otherNode = graphData.nodes.find(n => n.id === otherId);
                                                    
                                                    return (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => otherNode && handleNodeClick(otherNode)}
                                                            className="p-3 bg-black/20 hover:bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 cursor-pointer transition-all"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                                                    {link.type || link.label || 'Link'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-mono">
                                                                    {sId === selectedNode.id ? 'Outgoing' : 'Incoming'}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-1">
                                                                <Table size={12} className="text-slate-400" />
                                                                <span>{otherNode?.label || otherId}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Panel Action Footer (For Tables) */}
                            {selectedNode.type !== 'source' && activeTab === 'schema' && (
                                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-2.5 shrink-0">
                                    <button 
                                        onClick={() => setSelectedNode(null)}
                                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button 
                                        onClick={handleSaveEnrichment}
                                        disabled={isSaving}
                                        className="bg-primary hover:bg-primary/80 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <Save size={13} /> {isSaving ? 'Propagating...' : 'Save & Sync Metadata'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
