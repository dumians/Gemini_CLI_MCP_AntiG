import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Activity, RefreshCw, Bot, Server, Search, Filter, 
  Download, Trash2, CheckCircle2, AlertCircle, AlertTriangle, 
  Info, Copy, Check, Play, Pause, X, ChevronRight, Eye, Radio, 
  Sparkles, Layers, Cpu, Globe, ArrowDownUp
} from "lucide-react";
import { api, getBaseUrl } from "../utils/api";
import { clientLogger, ClientLogEntry } from "../utils/logger";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  type: string;
  agent: string;
  domain: string;
  message: string;
  meta?: any;
  traceId?: string;
  source?: "backend" | "client";
}

export interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  toolCalls: number;
  a2aCount: number;
  activeSubscribers?: number;
  byLevel?: Record<string, number>;
  byAgent?: Record<string, number>;
  byDomain?: Record<string, number>;
}

export const LogsAndStatusView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [traceFilter, setTraceFilter] = useState<string | null>(null);

  // Inspector & modal
  const [inspectingLog, setInspectingLog] = useState<LogEntry | null>(null);
  const [copiedTrace, setCopiedTrace] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // Initial fetch
  const fetchLogsAndStatus = async () => {
    setLoading(true);
    try {
      const [logsRes, statusRes] = await Promise.all([
        api.get("/api/admin/logs?limit=300"),
        api.get("/api/status").catch(() => null)
      ]);

      if (logsRes) {
        if (Array.isArray(logsRes)) {
          setLogs(logsRes);
        } else if (logsRes.logs) {
          setLogs(logsRes.logs);
          if (logsRes.stats) setStats(logsRes.stats);
        }
      }

      if (statusRes) {
        setStatus(statusRes);
      }
    } catch (err: any) {
      console.error("Failed to load logs and status:", err);
      clientLogger.error("Failed to load logs and status", { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Setup Server-Sent Events (SSE) stream
  useEffect(() => {
    if (!isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setSseConnected(false);
      }
      return;
    }

    const baseUrl = getBaseUrl();
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("mesh_auth_token") : null;
    const streamUrl = `${baseUrl}/api/admin/logs/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    try {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CONNECTED") {
            if (data.stats) setStats(data.stats);
            return;
          }

          // Prepend incoming live log
          setLogs((prev) => {
            if (prev.some((l) => l.id === data.id)) return prev;
            const next = [data, ...prev];
            return next.length > 1000 ? next.slice(0, 1000) : next;
          });

          // Update real-time stats locally
          setStats((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              total: prev.total + 1,
              errors: data.level === "ERROR" ? prev.errors + 1 : prev.errors,
              warnings: data.level === "WARN" ? prev.warnings + 1 : prev.warnings,
              toolCalls: data.type === "TOOL_CALL" ? prev.toolCalls + 1 : prev.toolCalls,
              a2aCount: data.type?.startsWith("A2A_") ? prev.a2aCount + 1 : prev.a2aCount
            };
          });

          if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        } catch {
          // Ignore heartbeat or non-json message
        }
      };

      es.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn("SSE connection error, fallback to polling:", err);
      setSseConnected(false);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isStreaming, autoScroll]);

  // Initial load
  useEffect(() => {
    fetchLogsAndStatus();
    // Also listen to local UIX client logs
    const unsub = clientLogger.subscribe((entry) => {
      setLogs((prev) => [entry as LogEntry, ...prev.slice(0, 999)]);
    });
    return () => unsub();
  }, []);

  // Periodic heartbeat polling for agent statuses
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const statusRes = await api.get("/api/status");
        setStatus(statusRes);
      } catch {
        // quiet
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Action: Clear buffer
  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear the backend in-memory logs buffer?")) {
      return;
    }
    try {
      await api.delete("/api/admin/logs");
      clientLogger.clear();
      setLogs([]);
      setStats({
        total: 0,
        errors: 0,
        warnings: 0,
        toolCalls: 0,
        a2aCount: 0
      });
      showNotice("Logs buffer cleared successfully");
    } catch (err: any) {
      showNotice(`Failed to clear logs: ${err.message}`);
    }
  };

  // Action: Export logs
  const handleExport = (format: "json" | "csv") => {
    const baseUrl = getBaseUrl();
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("mesh_auth_token") : "";
    const params = new URLSearchParams({
      format,
      limit: "2500",
      ...(selectedLevel !== "ALL" ? { level: selectedLevel } : {}),
      ...(selectedDomain !== "all" ? { domain: selectedDomain } : {}),
      ...(traceFilter ? { traceId: traceFilter } : {}),
      ...(searchQuery ? { search: searchQuery } : {})
    });
    const url = `${baseUrl}/api/admin/logs/export?${params.toString()}`;

    // Download using hidden anchor
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mesh-logs-${Date.now()}.${format}`);
    // Pass auth token via header using fetch if needed or query
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        showNotice(`Exported logs as ${format.toUpperCase()}`);
      })
      .catch((err) => showNotice(`Export failed: ${err.message}`));
  };

  // Action: Send test client log
  const handleSendTestTelemetry = () => {
    const testTraceId = `test-${Date.now().toString(36)}`;
    clientLogger.info("Diagnostic test telemetry from UIX Observability Console", {
      browser: navigator.userAgent.substring(0, 80),
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    }, testTraceId);
    showNotice("Sent test client telemetry event");
  };

  // Copy trace ID helper
  const copyTrace = (traceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(traceId);
    setCopiedTrace(traceId);
    setTimeout(() => setCopiedTrace(null), 2000);
  };

  // Copy JSON
  const copyJsonPayload = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Distinct domains & types
  const allDomains = Array.from(new Set(logs.map((l) => l.domain).filter(Boolean)));
  const allTypes = Array.from(new Set(logs.map((l) => l.type).filter(Boolean)));

  // Client-side filtering
  const filteredLogs = logs.filter((log) => {
    if (traceFilter && log.traceId !== traceFilter) return false;
    if (selectedLevel !== "ALL" && log.level !== selectedLevel) return false;
    if (selectedDomain !== "all" && log.domain !== selectedDomain) return false;
    if (selectedType !== "ALL" && log.type !== selectedType) return false;
    if (selectedSource !== "all" && log.source !== selectedSource) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message?.toLowerCase().includes(q);
      const matchAgent = log.agent?.toLowerCase().includes(q);
      const matchDomain = log.domain?.toLowerCase().includes(q);
      const matchTrace = log.traceId?.toLowerCase().includes(q);
      const matchMeta = log.meta ? JSON.stringify(log.meta).toLowerCase().includes(q) : false;
      if (!matchMsg && !matchAgent && !matchDomain && !matchTrace && !matchMeta) return false;
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="fixed top-6 right-6 z-50 bg-primary/95 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/20 animate-fade-in text-sm font-medium">
          <Sparkles size={18} />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Terminal size={26} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Mesh Observability & Live Logs
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Structured telemetry, distributed tracing, A2A communication, and real-time SSE stream.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Stream Indicator / Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              isStreaming
                ? sseConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title={isStreaming ? "Click to pause streaming" : "Click to resume live streaming"}
          >
            {isStreaming ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    sseConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    sseConnected ? "bg-emerald-500" : "bg-amber-500"
                  }`}></span>
                </span>
                <span>{sseConnected ? "Live SSE Active" : "Connecting..."}</span>
                <Pause size={13} className="ml-1 opacity-70" />
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          {/* Refresh Manual */}
          <button
            onClick={fetchLogsAndStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm">
              <Download size={14} />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-30">
              <button
                onClick={() => handleExport("json")}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>JSON Export</span>
                <span className="text-[10px] text-slate-400">.json</span>
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>CSV Export</span>
                <span className="text-[10px] text-slate-400">.csv</span>
              </button>
            </div>
          </div>

          {/* Test Telemetry */}
          <button
            onClick={handleSendTestTelemetry}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all flex items-center gap-1.5"
            title="Sends client-side telemetry event to backend"
          >
            <Radio size={14} />
            <span className="hidden sm:inline">Test Client Event</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            title="Clear in-memory buffer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Entries</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {stats?.total ?? logs.length}
            </span>
            <Layers size={18} className="text-slate-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.02] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-red-500 dark:text-red-400">Errors</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {stats?.errors ?? logs.filter((l) => l.level === "ERROR").length}
            </span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Warnings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {stats?.warnings ?? logs.filter((l) => l.level === "WARN").length}
            </span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-blue-500 dark:text-blue-400">MCP Tool Calls</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {stats?.toolCalls ?? logs.filter((l) => l.type === "TOOL_CALL").length}
            </span>
            <Cpu size={18} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-purple-500 dark:text-purple-400">A2A Protocols</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {stats?.a2aCount ?? logs.filter((l) => l.type?.startsWith("A2A_")).length}
            </span>
            <Bot size={18} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live Viewers</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats?.activeSubscribers ?? (sseConnected ? 1 : 0)}
            </span>
            <Radio size={18} className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Grid: Status Cards (Left) & Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Heartbeat & Agents Status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Heartbeat Card */}
          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Heartbeat</h3>
                <p className="text-[11px] text-slate-500">Live orchestrator engine state</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mesh State</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  status?.state === "processing" 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                }`}>
                  {status?.state || "IDLE"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Last Query</span>
                <p className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                  {status?.lastQuery || "None in memory"}
                </p>
              </div>

              {status?.context && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Intent Alignment</span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-300">Confidence</span>
                    <span className="font-bold text-primary">
                      {status.context.intentAlignment?.intentConfidence ? `${Math.round(status.context.intentAlignment.intentConfidence * 100)}%` : "100%"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registered Agents Health */}
          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Mesh Agents</h3>
                  <p className="text-[11px] text-slate-500">Autonomous domain workers</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {status?.agents ? Object.keys(status.agents).length : 0}
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {status?.agents && Object.entries(status.agents).length > 0 ? (
                Object.entries(status.agents).map(([agentId, agState]: any) => (
                  <div
                    key={agentId}
                    onClick={() => {
                      setSelectedDomain("all");
                      setSearchQuery(agentId);
                    }}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/40 transition-colors cursor-pointer group"
                    title="Click to filter logs by this agent"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Server size={14} className="text-slate-400 group-hover:text-primary flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {agentId}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      agState === "online" 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : agState === "offline"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-slate-500/10 text-slate-400"
                    }`}>
                      {agState}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  Scanning active agents...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Complete Logs Console */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            {/* Search Bar & Active Trace Badge */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by keyword, agent, domain, trace ID, tool, or payload..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Active Trace Filter Badge */}
              {traceFilter && (
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-mono animate-fade-in flex-shrink-0">
                  <span>Trace: {traceFilter}</span>
                  <button
                    onClick={() => setTraceFilter(null)}
                    className="hover:text-red-500"
                    title="Clear trace filter"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Severity Level Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase tracking-wider">
                  Severity:
                </span>
                {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((lvl) => {
                  const isActive = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isActive
                          ? lvl === "ERROR"
                            ? "bg-red-500 text-white shadow-sm"
                            : lvl === "WARN"
                            ? "bg-amber-500 text-white shadow-sm"
                            : lvl === "DEBUG"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-primary text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>

              {/* Select Dropdowns: Domain, Type, Source */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Domain Selector */}
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                >
                  <option value="all">All Domains</option>
                  {allDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Type Selector */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Event Types</option>
                  {allTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Source Selector */}
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary"
                >
                  <option value="all">All Sources</option>
                  <option value="backend">Backend Only</option>
                  <option value="client">UIX Client Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Terminal Console View */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[720px]">
            {/* Terminal Header */}
            <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                </div>
                <span className="font-mono text-slate-300 font-medium">
                  agentic-mesh-stdout [{filteredLogs.length} events showing]
                </span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-0"
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
            </div>

            {/* Terminal Body */}
            <div
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 scroll-smooth bg-slate-950/60"
            >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const isError = log.level === "ERROR";
                  const isWarn = log.level === "WARN";
                  const isDebug = log.level === "DEBUG";
                  const isTool = log.type === "TOOL_CALL" || log.type === "TOOL_RESULT";
                  const isA2A = log.type?.startsWith("A2A_");
                  const isClient = log.source === "client";

                  return (
                    <div
                      key={log.id || index}
                      onClick={() => setInspectingLog(log)}
                      className={`group flex flex-col p-2 rounded-lg transition-all cursor-pointer border ${
                        isError
                          ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/15"
                          : isWarn
                          ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
                          : "bg-slate-900/40 border-slate-800/40 hover:bg-slate-800/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {/* Timestamp */}
                        <span className="text-slate-500 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
                        </span>

                        {/* Level badge */}
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase flex-shrink-0 ${
                          isError
                            ? "bg-red-500 text-white"
                            : isWarn
                            ? "bg-amber-500 text-black font-extrabold"
                            : isDebug
                            ? "bg-purple-900/60 text-purple-300 border border-purple-600/40"
                            : "bg-blue-900/50 text-blue-300 border border-blue-600/40"
                        }`}>
                          {log.level}
                        </span>

                        {/* Source Pill */}
                        {isClient && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30">
                            UIX
                          </span>
                        )}

                        {/* Domain / Agent */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                          {log.agent} | {log.domain}
                        </span>

                        {/* Type tag */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isTool
                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                            : isA2A
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {log.type}
                        </span>

                        {/* Trace ID badge with Click-to-filter & Copy */}
                        {log.traceId && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setTraceFilter(log.traceId!);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800/90 hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-300 border border-slate-700/60 transition-colors ml-auto"
                            title="Click to isolate this trace in the view"
                          >
                            <span className="font-mono">{log.traceId.substring(0, 16)}</span>
                            <button
                              onClick={(e) => copyTrace(log.traceId!, e)}
                              className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                              title="Copy trace ID"
                            >
                              {copiedTrace === log.traceId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Log Message */}
                      <div className="mt-1 text-slate-200 text-xs font-mono break-all flex items-start justify-between gap-2">
                        <span>{log.message}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-slate-400 flex-shrink-0" title="Inspect metadata">
                          <Eye size={13} className="hover:text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16 space-y-3">
                  <Terminal size={36} className="opacity-40" />
                  <p className="text-sm">No log events match the active filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedLevel("ALL");
                      setSelectedDomain("all");
                      setSelectedType("ALL");
                      setSelectedSource("all");
                      setTraceFilter(null);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Log Inspector Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  inspectingLog.level === "ERROR"
                    ? "bg-red-500/20 text-red-400"
                    : inspectingLog.level === "WARN"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-primary/20 text-primary"
                }`}>
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Log Event Inspector</span>
                    <span className="text-xs font-mono text-slate-400">#{inspectingLog.id}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {new Date(inspectingLog.timestamp).toISOString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyJsonPayload(inspectingLog)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedJson ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                </button>
                <button
                  onClick={() => setInspectingLog(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              {/* Properties Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Severity</span>
                  <div className="mt-1">
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      inspectingLog.level === "ERROR"
                        ? "bg-red-500 text-white"
                        : inspectingLog.level === "WARN"
                        ? "bg-amber-500 text-black"
                        : "bg-blue-900/60 text-blue-300"
                    }`}>
                      {inspectingLog.level}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Component</span>
                  <p className="mt-1 font-bold text-slate-200">{inspectingLog.agent}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Domain</span>
                  <p className="mt-1 font-bold text-indigo-400">{inspectingLog.domain}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Event Type</span>
                  <p className="mt-1 text-slate-300">{inspectingLog.type}</p>
                </div>
              </div>

              {/* Message Box */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Message
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-wrap break-all">
                  {inspectingLog.message}
                </div>
              </div>

              {/* Trace Context with Button */}
              {inspectingLog.traceId && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Distributed Trace Identifier
                    </span>
                    <button
                      onClick={() => {
                        setTraceFilter(inspectingLog.traceId!);
                        setInspectingLog(null);
                      }}
                      className="text-primary hover:underline text-[11px]"
                    >
                      Filter view to this trace
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-indigo-300">
                    <span className="select-all">{inspectingLog.traceId}</span>
                    <button
                      onClick={(e) => copyTrace(inspectingLog.traceId!, e)}
                      className="p-1 hover:text-white"
                      title="Copy trace ID"
                    >
                      {copiedTrace === inspectingLog.traceId ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Structured Metadata JSON */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Structured Metadata & Context
                </span>
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                  {inspectingLog.meta ? JSON.stringify(inspectingLog.meta, null, 2) : "{\n  \"meta\": null\n}"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
