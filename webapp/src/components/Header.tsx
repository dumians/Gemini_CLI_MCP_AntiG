import React from 'react';
import { ChevronRight, Bell } from 'lucide-react';

interface HeaderProps {
  breadcrumbs: string[];
}

export const Header = ({ breadcrumbs }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between glass border-x-0 bg-background-dark/80 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb}>
            <span className={i === breadcrumbs.length - 1 ? "text-slate-100 font-medium" : "text-slate-500"}>
              {crumb}
            </span>
            {i < breadcrumbs.length - 1 && (
              <ChevronRight size={14} className="text-slate-600" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live System</span>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};
