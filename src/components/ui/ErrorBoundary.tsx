import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo.componentStack);
  }

  handleGoBack = () => {
    window.history.back();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage || 'Something went wrong. Please try again.';

      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-danger/5">
          <div className="w-full max-w-md">
            <div className="bg-surface rounded-2xl shadow-neumorph p-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mx-auto">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Oops!</h2>
                <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
