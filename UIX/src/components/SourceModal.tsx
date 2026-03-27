import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database } from 'lucide-react';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  loading?: boolean;
}

export const SourceModal = ({ isOpen, onClose, onSubmit, initialData, loading }: SourceModalProps) => {
  const [formData, setFormData] = React.useState({ id: '', name: '', domain: '', schema_file: '', connection_type: 'Standard URI', connection_string: '' });

  React.useEffect(() => {
    if (initialData) {
      setFormData({ 
        id: initialData.id || '', 
        name: initialData.name || '', 
        domain: initialData.domain || '', 
        schema_file: initialData.schema_file || '',
        connection_type: initialData.connection_type || 'Standard URI',
        connection_string: initialData.connection_string || ''
      });
    } else {
      setFormData({ id: '', name: '', domain: '', schema_file: '', connection_type: 'Standard URI', connection_string: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-2xl border-slate-700/50 w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Data Source' : 'Register Data Source'}</h3>
                  <p className="text-xs text-slate-400">Configure connection and domain metadata.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Source ID</label>
                <input 
                  type="text" 
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. spanner_retail"
                  disabled={!!initialData}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Display Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Retail Spanner DB"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Domain</label>
                <input 
                  type="text" 
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g. Retail"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Connection Type</label>
                <select 
                  value={formData.connection_type}
                  onChange={(e) => setFormData({ ...formData, connection_type: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="Standard URI">Standard URI</option>
                  <option value="JDBC URL">JDBC URL</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Connection String / URL</label>
                <input 
                  type="text" 
                  value={formData.connection_string}
                  onChange={(e) => setFormData({ ...formData, connection_string: e.target.value })}
                  placeholder="postgresql://... or jdbc:oracle:..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">Schema File Path</label>
                <input 
                  type="text" 
                  value={formData.schema_file}
                  onChange={(e) => setFormData({ ...formData, schema_file: e.target.value })}
                  placeholder="e.g. /config/schemas/retail.json"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? 'Saving...' : (initialData ? 'Update Source' : 'Register Source')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
