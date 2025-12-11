
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 p-6 text-white">
          <div className="max-w-lg w-full bg-slate-800 border-2 border-red-500 rounded-2xl p-8 shadow-2xl">
             <div className="flex items-center gap-4 mb-4 text-red-500">
                <AlertTriangle size={40} />
                <h1 className="text-2xl font-bold uppercase tracking-wider">System Crash</h1>
             </div>
             <p className="text-slate-300 mb-4">
                The game engine encountered a critical error.
             </p>
             <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-red-300 overflow-auto max-h-40 mb-6 border border-slate-700">
                {this.state.error && this.state.error.toString()}
                <br/>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
             </div>
             <button 
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
             >
                <RotateCcw size={20} /> Reboot System (Reload)
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
