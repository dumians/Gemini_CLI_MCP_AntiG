import React from 'react';
import { motion } from 'motion/react';
import { Table, Columns, ArrowRight } from 'lucide-react';

interface ColumnLineage {
  name: string;
  type: string;
  upstream: string;
}

interface Dataset {
  id: string;
  name: string;
  domain: string;
  columns: ColumnLineage[];
}

export const DatasetLineageView = () => {
  const datasets: Dataset[] = [
    {
      id: 'ds1',
      name: 'fact_sales',
      domain: 'Sales',
      columns: [
        { name: 'sale_id', type: 'INT', upstream: 'raw_sales.id' },
        { name: 'customer_id', type: 'INT', upstream: 'raw_customers.id' },
        { name: 'amount', type: 'DECIMAL', upstream: 'raw_sales.price * raw_sales.qty' },
      ]
    },
    {
      id: 'ds2',
      name: 'dim_customers',
      domain: 'Marketing',
      columns: [
        { name: 'customer_id', type: 'INT', upstream: 'crm_contacts.contact_id' },
        { name: 'email', type: 'STRING', upstream: 'crm_contacts.email_addr' },
      ]
    }
  ];

  const [selectedDataset, setSelectedDataset] = React.useState<string | null>(datasets[0].id);

  const activeDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="glass rounded-2xl border-slate-700/50 p-6 flex flex-col h-[500px] w-full bg-slate-900/50">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Table size={20} className="text-primary" /> Dataset Lineage Detail
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Dataset List */}
        <div className="space-y-3 overflow-y-auto pr-2">
          {datasets.map((ds) => (
            <div 
              key={ds.id}
              onClick={() => setSelectedDataset(ds.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedDataset === ds.id 
                  ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Table size={16} />
                <span className="text-sm font-bold">{ds.name}</span>
              </div>
              <p className="text-xs mt-1 text-slate-500">{ds.domain} Domain</p>
            </div>
          ))}
        </div>

        {/* Column Lineage Detail */}
        <div className="md:col-span-2 glass bg-black/30 rounded-xl border-slate-700/50 p-4 overflow-y-auto flex flex-col">
          {activeDataset ? (
            <>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-md font-bold text-white">{activeDataset.name} Schema</h4>
                  <p className="text-xs text-slate-500">Column-level lineage mapping.</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg">{activeDataset.domain}</span>
              </div>

              <div className="flex-1 space-y-3">
                {activeDataset.columns.map((col, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 text-xs">
                    <div className="flex items-center gap-3">
                      <Columns size={14} className="text-slate-400" />
                      <div>
                        <span className="font-bold text-white">{col.name}</span>
                        <span className="text-slate-500 ml-2">({col.type})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <ArrowRight size={14} />
                      <span className="font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-300">{col.upstream}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a dataset to view lineage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
