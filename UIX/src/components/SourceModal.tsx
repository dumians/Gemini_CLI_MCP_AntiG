import React from 'react';
import { motion } from 'motion/react';
import { Terminal, X, Table, RefreshCw, Database, Download, Copy } from 'lucide-react';

export const SourceModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900/90 backdrop-blur-xl w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Terminal className="text-purple-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Source Output: BigQuery Analytics Agent</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-[#161b22] flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Table size={14} />
                <span>raw_output.json</span>
              </div>
              <span>JSON</span>
            </div>
            <div className="flex-1 overflow-auto p-4 text-sm font-mono leading-relaxed bg-[#0d1117] text-[#c9d1d9]">
              <pre>
                <code>{`{
  "status": "success",
  "query_id": "bq-job-9842a1f-4c",
  "domain": "marketing_insights",
  "results": [
    {
      "campaign_id": "CMP_2023_Q4_RTL",
      "conversions": 14529,
      "roi_percentage": 312.4,
      "active": true,
      "segments_analyzed": ["demographic", "geographic", "behavioral"]
    },
    {
      "campaign_id": "CMP_2023_Q4_B2B",
      "conversions": 3841,
      "roi_percentage": 185.7,
      "active": false,
      "segments_analyzed": ["firmographic", "technographic"]
    }
  ],
  "agent_reasoning": {
    "confidence_score": 0.98,
    "context_sources": ["bq_marketing_ds", "crm_alloy_sync"]
  }
}`}</code>
              </pre>
            </div>
          </div>
          <div className="w-64 border-l border-white/10 bg-slate-900/60 p-5 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Metadata</h3>
              <div className="space-y-4">
                {[
                  { label: 'Execution Time', icon: RefreshCw, value: '142ms', color: 'green' },
                  { label: 'Tokens Used', icon: Database, value: '4,092', color: 'blue' },
                  { label: 'Data Freshness', icon: RefreshCw, value: 'Just now', color: 'purple' },
                ].map((meta, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-slate-500 mb-1">{meta.label}</p>
                    <div className="flex items-center gap-2">
                      <meta.icon className={`text-${meta.color}-400`} size={14} />
                      <span className="text-sm font-mono text-slate-200">{meta.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-end gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10">
            <Download size={16} /> Export JSON
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20">
            <Copy size={16} /> Copy to Clipboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
