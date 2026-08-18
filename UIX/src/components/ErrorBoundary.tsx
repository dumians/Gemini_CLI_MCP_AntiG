import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.name || 'Component'}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="glass rounded-3xl border border-indigo-500/20 bg-slate-900/40 p-8 flex flex-col items-center justify-center text-center space-y-4 my-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="text-base font-bold text-white">
              {this.props.name || 'Graph Visualizer'} Standby Mode
            </h4>
            <p className="text-xs text-slate-400">
              Interactive 2D canvas simulation is running in safe mode. Mesh data inventory and correlation keys remain active.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <RefreshCw size={14} /> Reload Topology Canvas
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
