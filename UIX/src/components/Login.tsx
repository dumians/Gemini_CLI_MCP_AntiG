import React, { useState } from 'react';
import { Cpu, ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../utils/auth';
import { api } from '../utils/api';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsProcessing(true);

        try {
            // For UIX, we simulate a successful login if it's admin/admin or just proceed.
            // Replace with actual API call if UIX has its own auth endpoint
            const data = await api.post('/api/auth/login', { username, password });

            auth.setToken(data.token);
            auth.setUser(data.user);
            onLoginSuccess(data.user);
        } catch (err: any) {
            setError(err.message || 'System link failed. Check mesh status.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050506] flex items-center justify-center p-6 z-50">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none isolate">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] transform-gpu" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] transform-gpu" />
                <div className="absolute inset-0 opacity-[0.03]" />
            </div>

            <div className="w-full max-w-md relative transition-all duration-700">
                <div className="glass rounded-[2.5rem] p-10 border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-6 group hover:rotate-12 transition-transform duration-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                            <Cpu size={40} className="text-primary" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">MeshOS Access</h1>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Protocol: Strategic Protocol Guard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="COMMAND IDENTIFIER"
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold tracking-widest uppercase placeholder:text-white/10 text-white"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="SECURE ACCESS KEY"
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold tracking-widest uppercase placeholder:text-white/10 text-white"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <AlertCircle size={18} className="text-red-400 shrink-0" />
                                <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest leading-tight">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full h-14 bg-gradient-to-r from-primary to-accent rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden group text-white"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>Initiate Link</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Global Governance Active</span>
                    </div>
                </div>
                
                <p className="text-center mt-8 text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">Strategic Control Node • Unauthorized Access Logged</p>
            </div>
        </div>
    );
}
