import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../components/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-graphite flex items-center justify-center p-4">
          <div className="max-w-md w-full cut-card bg-graphite/80 border border-error/30 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h1 className="text-xl font-bold text-chalk mb-2">Something went wrong</h1>
            <p className="text-silver text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/'}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class LoadingSpinner extends React.Component<{ fullScreen?: boolean }> {
  render() {
    if (this.props.fullScreen) {
      return (
        <div className="min-h-screen bg-graphite flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-peacock/30 border-t-peacock rounded-full animate-spin" />
            <p className="text-silver">Loading...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-peacock/30 border-t-peacock rounded-full animate-spin" />
      </div>
    );
  }
}

export class PageLoader extends React.Component<{ progress?: number }> {
  render() {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-64 h-1 bg-graphite/50 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-peacock to-saffron transition-all duration-500"
            style={{ width: `${this.props.progress || 30}%` }}
          />
        </div>
        <p className="text-ash text-sm">Loading content...</p>
      </div>
    );
  }
}