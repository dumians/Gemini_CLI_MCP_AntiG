import React, { useState } from "react";
import { 
  ShieldCheck, AlertTriangle, AlertCircle, RefreshCw, X, 
  CheckCircle2, ChevronDown, ChevronRight, Server, FileText, 
  Lock, Cloud, Cpu, Globe, ExternalLink, Sparkles
} from "lucide-react";
import { ConfigVerificationReport, ConfigCheckItem } from "../utils/configVerifier";

interface ConfigVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ConfigVerificationReport | null;
  onReVerify: () => Promise<void>;
  isVerifying: boolean;
}

export const ConfigVerificationModal: React.FC<ConfigVerificationModalProps> = ({
  isOpen,
  onClose,
  report,
  onReVerify,
  isVerifying
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = report
    ? ["ALL", ...Array.from(new Set(report.checks.map((c) => c.category)))]
    : ["ALL"];

  const filteredChecks = report
    ? report.checks.filter(
        (c) => selectedCategory === "ALL" || c.category === selectedCategory
      )
    : [];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Filesystem & Storage":
        return <FileText size={14} className="text-blue-400" />;
      case "Environment & Security":
        return <Lock size={14} className="text-purple-400" />;
      case "Cloud & AI Services":
        return <Cloud size={14} className="text-emerald-400" />;
      case "MCP Gateway & Data Transports":
        return <Cpu size={14} className="text-amber-400" />;
      default:
        return <Globe size={14} className="text-indigo-400" />;
    }
  };

  const isHealthy = report?.overallStatus === "HEALTHY";
  const isDegraded = report?.overallStatus === "DEGRADED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-xl border ${
                isHealthy
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : isDegraded
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {isHealthy ? (
                <ShieldCheck size={24} />
              ) : isDegraded ? (
                <AlertTriangle size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold">Startup Configuration Access</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider border ${
                    isHealthy
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : isDegraded
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                  }`}
                >
                  {report?.overallStatus || "UNKNOWN"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated pre-flight verification of storage, configs, environment variables, and cloud services.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReVerify}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
              title="Re-run configuration verification check"
            >
              <RefreshCw size={13} className={isVerifying ? "animate-spin text-primary" : ""} />
              <span>{isVerifying ? "Verifying..." : "Re-Verify"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Ribbon */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Total Checks</span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
                {report.summary.totalChecks}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02]">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Passed</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {report.summary.passed}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block">Warnings</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {report.summary.warnings}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <span className="text-[11px] text-red-600 dark:text-red-400 block">Failed</span>
              <span className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
                {report.summary.failed}
              </span>
            </div>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Checks List */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 max-h-[550px]">
          {filteredChecks.length > 0 ? (
            filteredChecks.map((check) => {
              const isExpanded = expandedCheckId === check.id;
              const isPass = check.status === "PASSED";
              const isWarn = check.status === "WARNING";

              return (
                <div
                  key={check.id}
                  className={`rounded-xl border transition-all ${
                    isPass
                      ? "bg-slate-50/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/70"
                      : isWarn
                      ? "bg-amber-500/[0.04] border-amber-500/30 dark:bg-amber-500/10"
                      : "bg-red-500/[0.04] border-red-500/30 dark:bg-red-500/10"
                  }`}
                >
                  <div
                    onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isPass ? (
                        <CheckCircle2 size={17} className="text-emerald-500 flex-shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle size={17} className="text-amber-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={17} className="text-red-500 flex-shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {check.name}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700/50 rounded">
                            {getCategoryIcon(check.category)}
                            <span>{check.category}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {check.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {check.durationMs !== undefined && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {check.durationMs}ms
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          isPass
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : isWarn
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                      >
                        {check.status}
                      </span>
                      {check.details && (
                        <div className="text-slate-400">
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Technical Details */}
                  {isExpanded && check.details && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-mono">
                      <div className="bg-slate-950 p-3 rounded-lg text-emerald-400 overflow-x-auto">
                        <pre>{JSON.stringify(check.details, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No configuration checks found for this category.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Verified at: </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : "Never"}
            </span>
            {report?.client?.baseUrl && (
              <span className="ml-3 text-slate-400">
                Endpoint: <span className="font-mono">{report.client.baseUrl}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
