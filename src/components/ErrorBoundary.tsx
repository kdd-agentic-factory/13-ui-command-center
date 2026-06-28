import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg, #0c0e14)', color: 'var(--text)', padding: 24,
        }}>
          <div style={{
            maxWidth: 480, padding: 24, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Something went wrong</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              {this.state.error?.message ?? 'An unexpected error occurred while rendering this page.'}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(0,183,255,0.12)', border: '1px solid var(--cyan)', color: 'var(--cyan)',
              }}
            >
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
