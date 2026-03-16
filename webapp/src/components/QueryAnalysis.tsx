// Component generated from Stitch HTML

export function QueryAnalysis() {
  return (
    <>
      <div className="w-full">
{/* Query Hero Pill */}
<div className="glass-pill rounded-full px-8 py-6 mb-12 shadow-2xl flex items-start gap-4 border-l-4 border-l-primary">
<span className="material-symbols-outlined text-primary mt-1">terminal</span>
<div className="flex-1">
<p className="text-lg text-slate-100 font-medium leading-relaxed">
                        Find VIP customers in BigQuery, trace their recent purchase path globally through our Spanner supply chain graph, and verify with Oracle financial anomaly detection.
                    </p>
<div className="flex gap-4 mt-3">
<span className="text-xs bg-primary/20 text-primary-light px-3 py-1 rounded-full border border-primary/20">Complex Chain</span>
<span className="text-xs bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/10">3 Data Sources</span>
</div>
</div>
</div>
{/* Agent Chain Execution Flow */}
<div className="relative flex flex-col gap-0">
{/* Segment 1: BigQuery */}
<div className="relative grid grid-cols-[64px_1fr] gap-8 pb-12">
<div className="flex flex-col items-center">
<div className="size-12 rounded-full bg-agent-blue/20 border border-agent-blue/40 flex items-center justify-center text-agent-blue z-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
<span className="material-symbols-outlined">database</span>
</div>
<div className="flow-line flex-1"></div>
</div>
<div className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h3 className="text-agent-blue font-bold text-lg flex items-center gap-2">
                                    BigQuery Analytics Agent
                                    <span className="text-xs font-normal text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">Segment Extraction</span>
</h3>
<p className="text-slate-400 text-sm mt-1">Identified top 1% VIP customers based on lifetime value (&gt; $50k).</p>
</div>
<a className="text-xs text-agent-blue hover:underline flex items-center gap-1" href="#">
<span className="material-symbols-outlined text-xs">link</span> Source MCP Output
                            </a>
</div>
<div className="bg-white/5 border border-white/10 rounded p-4 overflow-hidden">
<div className="grid grid-cols-4 gap-4 text-xs font-mono text-slate-300">
<div className="bg-agent-blue/5 p-2 rounded border border-agent-blue/10">ID: #4920-X</div>
<div className="bg-agent-blue/5 p-2 rounded border border-agent-blue/10">ID: #8122-Y</div>
<div className="bg-agent-blue/5 p-2 rounded border border-agent-blue/10">ID: #3044-A</div>
<div className="bg-agent-blue/5 p-2 rounded border border-agent-blue/10">ID: #1190-Z</div>
</div>
</div>
</div>
</div>
{/* Segment 2: Spanner */}
<div className="relative grid grid-cols-[64px_1fr] gap-8 pb-12">
<div className="flex flex-col items-center">
<div className="size-12 rounded-full bg-agent-green/20 border border-agent-green/40 flex items-center justify-center text-agent-green z-10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
<span className="material-symbols-outlined">public</span>
</div>
<div className="flow-line flex-1"></div>
</div>
<div className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h3 className="text-agent-green font-bold text-lg flex items-center gap-2">
                                    Spanner Retail Agent
                                    <span className="text-xs font-normal text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">Supply Chain Mapping</span>
</h3>
<p className="text-slate-400 text-sm mt-1">Tracing multi-hop supply routes across North America and APAC regions.</p>
</div>
<a className="text-xs text-agent-green hover:underline flex items-center gap-1" href="#">
<span className="material-symbols-outlined text-xs">link</span> Source MCP Output
                            </a>
</div>
<div className="h-32 bg-white/5 border border-white/10 rounded relative overflow-hidden flex items-center justify-center">
<div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at center, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
{/* Stylized Graph Path */}
<svg className="w-full h-full px-10" viewBox="0 0 400 100">
<path d="M0,50 Q100,20 200,50 T400,50" fill="none" stroke="#10b981" strokeDasharray="4 2" strokeWidth="2" />
<circle cx="50" cy="35" fill="#10b981" r="4" />
<circle cx="200" cy="50" fill="#10b981" r="4" />
<circle cx="350" cy="45" fill="#10b981" r="4" />
</svg>
<span className="absolute bottom-2 right-3 text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Global Route Map v2.4</span>
</div>
</div>
</div>
{/* Segment 3: Oracle */}
<div className="relative grid grid-cols-[64px_1fr] gap-8 pb-12">
<div className="flex flex-col items-center">
<div className="size-12 rounded-full bg-agent-gold/20 border border-agent-gold/40 flex items-center justify-center text-agent-gold z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
<span className="material-symbols-outlined">shield</span>
</div>
<div className="flow-line flex-1"></div>
</div>
<div className="space-y-4">
<div className="flex items-center justify-between">
<div>
<h3 className="text-agent-gold font-bold text-lg flex items-center gap-2">
                                    Oracle Financial Agent
                                    <span className="text-xs font-normal text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">Anomaly Verification</span>
</h3>
<p className="text-slate-400 text-sm mt-1">Cross-referencing payment velocity against historical procurement benchmarks.</p>
</div>
<a className="text-xs text-agent-gold hover:underline flex items-center gap-1" href="#">
<span className="material-symbols-outlined text-xs">link</span> Source MCP Output
                            </a>
</div>
<div className="flex gap-4">
<div className="flex-1 bg-agent-gold/10 border border-agent-gold/20 rounded-xl p-4 flex items-center gap-4">
<span className="material-symbols-outlined text-agent-gold text-3xl">check_circle</span>
<div>
<p className="text-xs text-agent-gold/80 uppercase font-bold">Risk Score</p>
<p className="text-xl text-white font-mono">0.02 (Low)</p>
</div>
</div>
<div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
<span className="material-symbols-outlined text-slate-500 text-3xl">payments</span>
<div>
<p className="text-xs text-slate-500 uppercase font-bold">Verified Volume</p>
<p className="text-xl text-white font-mono">$1.24M</p>
</div>
</div>
</div>
</div>
</div>
{/* Synthesis Hub */}
<div className="relative grid grid-cols-[64px_1fr] gap-8">
<div className="flex flex-col items-center">
<div className="size-12 rounded-full bg-primary/40 border border-primary flex items-center justify-center text-white z-10 shadow-[0_0_30px_rgba(17,17,212,0.4)]">
<span className="material-symbols-outlined">auto_awesome</span>
</div>
</div>
<div className="glass-card rounded-xl p-8 relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-10 rounded-full"></div>
<div className="flex items-center gap-3 mb-6">
<h2 className="text-2xl font-bold tracking-tight text-white">Synthesis Hub</h2>
<span className="bg-primary/20 text-primary-light text-[10px] px-2 py-0.5 rounded-full border border-primary/20">Final Summary</span>
</div>
<div className="space-y-6 text-slate-300 leading-relaxed">
<p>
                                Analysis of the <strong className="text-white">VIP segment</strong> reveals a distinct procurement pattern originating from the APAC logistics hub. 84% of your high-value customers in this query share a purchase path through the <strong className="text-white">Singapore terminal</strong>, which has seen a 12% efficiency gain this quarter.
                            </p>
<p>
                                The financial verification via Oracle confirms that these transactions are <strong className="text-agent-green font-medium">99.8% compliant</strong> with regional tax frameworks. No significant anomalies were detected in the purchase path tracing from Spanner, suggesting a healthy and scalable supply chain flow for this VIP cohort.
                            </p>
<div className="pt-6 border-t border-white/10 flex items-center justify-between">
<div className="flex -space-x-2">
<div className="size-8 rounded-full border-2 border-background-dark bg-agent-blue/40 flex items-center justify-center text-[10px]">BQ</div>
<div className="size-8 rounded-full border-2 border-background-dark bg-agent-green/40 flex items-center justify-center text-[10px]">SP</div>
<div className="size-8 rounded-full border-2 border-background-dark bg-agent-gold/40 flex items-center justify-center text-[10px]">OR</div>
</div>
<div className="flex gap-3">
<button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm font-medium transition-all">Export Report</button>
<button className="bg-primary hover:bg-primary/80 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all">Take Action</button>
</div>
</div>
</div>
</div>
</div>
</div>
</div>

    </>
  );
}