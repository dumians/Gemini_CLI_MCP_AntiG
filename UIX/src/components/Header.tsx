import React from 'react';
import { ChevronRight, Bell, Sun, Moon, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import type { ConfigVerificationReport } from '../utils/configVerifier';

interface HeaderProps {
  breadcrumbs: string[];
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  configReport?: ConfigVerificationReport | null;
  onOpenConfigModal?: () => void;
}

export const Header = ({ breadcrumbs, theme, onThemeChange, configReport, onOpenConfigModal }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between glass border-x-0">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb}>
            <span className={i === breadcrumbs.length - 1 ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500"}>
              {crumb}
            </span>
            {i < breadcrumbs.length - 1 && (
              <ChevronRight size={14} className="text-slate-600" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {/* Startup Config Verification Badge */}
        {configReport && (
          <button
            onClick={onOpenConfigModal}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              configReport.overallStatus === 'HEALTHY'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : configReport.overallStatus === 'DEGRADED'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20'
            }`}
            title="Click to view full Startup Configuration Access Diagnostics"
          >
            {configReport.overallStatus === 'HEALTHY' ? (
              <ShieldCheck size={13} />
            ) : configReport.overallStatus === 'DEGRADED' ? (
              <AlertTriangle size={13} />
            ) : (
              <AlertCircle size={13} />
            )}
            <span>Config {configReport.overallStatus === 'HEALTHY' ? 'Verified' : configReport.overallStatus}</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live System</span>
        </div>
        <button 
          onClick={onThemeChange}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};
