// Component generated from Stitch HTML

export function EnterpriseDashboard() {
  return (
    <>
      

<div className="px-12 pb-12 max-w-7xl mx-auto w-full space-y-8">
{/* Active Task Card */}
<section className="w-full">
<div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/20 rounded-2xl overflow-hidden shadow-xl">
<div className="flex flex-col md:flex-row">
{/* Task Visual/Icon Area */}
<div className="w-full md:w-64 bg-slate-100 dark:bg-primary/5 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
<div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
<span className="material-symbols-outlined text-primary text-4xl">auto_mode</span>
</div>
<span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Active Task</span>
</div>
{/* Task Details Area */}
<div className="flex-1 p-8">
<div className="flex justify-between items-start mb-6">
<div>
<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">A2A Orchestrator</h2>
<p className="text-slate-500 dark:text-slate-400">Processing cross-domain inventory synchronization</p>
</div>
<div className="text-right">
<span className="text-2xl font-bold text-primary">65%</span>
<p className="text-xs text-slate-500 uppercase tracking-widest">Efficiency Rate</p>
</div>
</div>
<div className="space-y-4">
<div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: '65%'}}></div>
</div>
<div className="flex flex-col gap-2">
<div className="flex items-center gap-3 text-sm text-green-500">
<span className="material-symbols-outlined text-sm">check_circle</span>
<span>Connecting to Spanner Retail... <span className="font-bold">Complete</span></span>
</div>
<div className="flex items-center gap-3 text-sm text-slate-900 dark:text-slate-200">
<span className="material-symbols-outlined text-sm animate-pulse">sync</span>
<span className="font-medium">Analyzing Inventory Data...</span>
</div>
<div className="flex items-center gap-3 text-sm text-slate-400">
<span className="material-symbols-outlined text-sm">circle</span>
<span>Cross-referencing with Oracle ERP... <span className="italic text-xs">Waiting</span></span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* 2x2 Domain Grid */}
<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/* Oracle Card */}
<div className="group bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all">
<div className="flex items-center justify-between mb-6">
<div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
<span className="material-symbols-outlined text-orange-500 group-hover:text-white">monitoring</span>
</div>
<span className="material-symbols-outlined text-slate-300 dark:text-slate-700 cursor-pointer">more_vert</span>
</div>
<h3 className="text-lg font-bold mb-1">Oracle ERP</h3>
<p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Global Resource Planning</p>
<div className="space-y-3">
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">ERP Connections</span>
<span className="text-green-500 font-semibold">Active</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Primary Node</span>
<span className="font-mono text-xs">us-east-1</span>
</div>
<div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
<div className="h-16 w-full flex items-end gap-1">
<div className="flex-1 bg-primary/20 h-1/2 rounded-t-sm"></div>
<div className="flex-1 bg-primary/20 h-2/3 rounded-t-sm"></div>
<div className="flex-1 bg-primary/40 h-3/4 rounded-t-sm"></div>
<div className="flex-1 bg-primary/20 h-1/2 rounded-t-sm"></div>
<div className="flex-1 bg-primary/60 h-5/6 rounded-t-sm"></div>
<div className="flex-1 bg-primary/40 h-3/4 rounded-t-sm"></div>
<div className="flex-1 bg-primary h-full rounded-t-sm"></div>
</div>
</div>
</div>
</div>
{/* Spanner Card */}
<div className="group bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all">
<div className="flex items-center justify-between mb-6">
<div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
<span className="material-symbols-outlined text-blue-500 group-hover:text-white">hub</span>
</div>
<span className="material-symbols-outlined text-slate-300 dark:text-slate-700 cursor-pointer">more_vert</span>
</div>
<h3 className="text-lg font-bold mb-1">Spanner Retail</h3>
<p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Distributed Inventory Cloud</p>
<div className="space-y-3">
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Global Inventory</span>
<span className="text-blue-400 font-semibold">Synced</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Avg. Latency</span>
<span className="font-semibold">12ms</span>
</div>
<div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50 relative overflow-hidden rounded-lg h-16">
<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
<div className="flex items-center justify-center h-full">
<span className="material-symbols-outlined text-blue-400 animate-pulse">language</span>
</div>
</div>
</div>
</div>
{/* BigQuery Card */}
<div className="group bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all">
<div className="flex items-center justify-between mb-6">
<div className="size-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
<span className="material-symbols-outlined text-purple-500 group-hover:text-white">bar_chart_4_bars</span>
</div>
<span className="material-symbols-outlined text-slate-300 dark:text-slate-700 cursor-pointer">more_vert</span>
</div>
<h3 className="text-lg font-bold mb-1">BigQuery Analytics</h3>
<p className="text-sm text-slate-500 dark:text-slate-400 mb-6">High-Performance Insights</p>
<div className="space-y-3">
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Marketing Insights</span>
<span className="text-purple-400 font-semibold">Ready</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Active Jobs</span>
<span className="font-semibold">14</span>
</div>
<div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
<div className="grid grid-cols-4 gap-2">
<div className="h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
<div className="size-2 rounded-full bg-purple-500"></div>
</div>
<div className="h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
<div className="size-2 rounded-full bg-purple-500"></div>
</div>
<div className="h-10 bg-purple-500/30 rounded-lg flex items-center justify-center animate-pulse">
<div className="size-2 rounded-full bg-purple-500"></div>
</div>
<div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
</div>
</div>
</div>
</div>
{/* AlloyDB Card */}
<div className="group bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all">
<div className="flex items-center justify-between mb-6">
<div className="size-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
<span className="material-symbols-outlined text-cyan-500 group-hover:text-white">support_agent</span>
</div>
<span className="material-symbols-outlined text-slate-300 dark:text-slate-700 cursor-pointer">more_vert</span>
</div>
<h3 className="text-lg font-bold mb-1">AlloyDB CRM</h3>
<p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Customer Relationship Cluster</p>
<div className="space-y-3">
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Service Status</span>
<span className="text-green-500 font-semibold">Online</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Pending Tickets</span>
<span className="font-semibold text-cyan-400">3 Priority</span>
</div>
<div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50 flex gap-2">
<div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
<span className="material-symbols-outlined text-xs text-slate-500">person</span>
</div>
<div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
<span className="material-symbols-outlined text-xs text-slate-500">person</span>
</div>
<div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
<span className="material-symbols-outlined text-xs text-primary">add</span>
</div>
</div>
</div>
</div>
</section>
</div>



    </>
  );
}