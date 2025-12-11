import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 p-6 text-center z-50 relative">
          <div className="bg-red-500/10 p-6 rounded-full mb-6 animate-pulse">
             <AlertTriangle size={64} className="text-red-500" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white uppercase mb-2">System Failure</h2>
          <p className="text-slate-400 max-w-md mb-8">
            The game engine encountered a critical error.
            <br />
            <span className="text-red-400 text-xs font-mono mt-2 block bg-black/30 p-2 rounded">
                {this.state.error?.message || 'Unknown Error'}
            </span>
          </p>
          <Button variant="primary" onClick={this.handleReload}>
             <span className="flex items-center gap-2"><RefreshCcw size={18}/> Restart Engine</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}