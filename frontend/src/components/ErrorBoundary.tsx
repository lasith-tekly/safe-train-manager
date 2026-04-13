import React from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              <div>
                <p style={{ color: '#6b7280', marginBottom: 8 }}>
                  An unexpected error occurred. Please try refreshing the page.
                </p>
                {this.state.error && (
                  <code style={{
                    fontSize: 11, color: '#9ca3af',
                    background: '#f3f4f6', padding: '4px 8px',
                    borderRadius: 4, display: 'block',
                    maxWidth: 480, wordBreak: 'break-all',
                  }}>
                    {this.state.error.message}
                  </code>
                )}
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="refresh"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>,
              <Button
                key="home"
                onClick={() => { window.location.href = '/'; }}
              >
                Go to Dashboard
              </Button>,
            ]}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
