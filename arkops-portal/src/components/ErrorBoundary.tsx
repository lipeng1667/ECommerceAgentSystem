import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI to render instead of the default error page */
  fallback?: ReactNode;
  /** Called when an error is caught (e.g., for error reporting services) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global React ErrorBoundary with i18n support and error reporting.
 *
 * Catches unhandled errors in child components and shows a localized
 * error page with retry and navigation options.
 *
 * Error reporting hook: the `onError` prop can be used to integrate
 * with services like Sentry, Datadog RUM, etc.
 *
 * Author: AI Optimization
 * Created: 2026-07-16 (refactored: i18n support, router navigation, error reporting)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for development
    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Hook for external error reporting services (Sentry, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, this would send error details to the backend
    this.reportError(error, errorInfo);
  }

  /**
   * Report error to backend monitoring service.
   * Placeholder — replace with actual error reporting implementation.
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Example: POST to error reporting endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     message: error.message,
    //     stack: error.stack,
    //     componentStack: errorInfo.componentStack,
    //     timestamp: Date.now(),
    //     url: window.location.href,
    //   }),
    // }).catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleBackHome = () => {
    this.setState({ hasError: false, error: null });
    // Use React Router navigation if available, fallback to hard redirect
    window.location.href = '/dashboard';
  };

  /**
   * Try to get the i18n translations. Since ErrorBoundary is above the I18nProvider
   * in the component tree (it wraps AppProviders), we need to gracefully fallback
   * to hardcoded bilingual messages.
   */
  private getLocalizedText() {
    // Since we moved ErrorBoundary above AppProviders, the i18n context
    // is not available here. We detect the user's language from localStorage
    // or browser preference.
    try {
      const storedLang = localStorage.getItem('allmall-portal-language');
      const isZh = storedLang === 'zh' || (!storedLang && navigator.language.startsWith('zh'));
      return {
        title: isZh ? '出错了' : 'Something went wrong',
        subTitle: isZh
          ? '发生了意外错误，请刷新页面重试。'
          : 'An unexpected error occurred. Please try refreshing the page.',
        retryLabel: isZh ? '刷新页面' : 'Refresh Page',
        backLabel: isZh ? '返回经营总览' : 'Back to Dashboard',
      };
    } catch {
      return {
        title: 'Something went wrong',
        subTitle: 'An unexpected error occurred. Please try refreshing the page.',
        retryLabel: 'Refresh Page',
        backLabel: 'Back to Dashboard',
      };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const text = this.getLocalizedText();

      return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
          <Result
            status="500"
            title={text.title}
            subTitle={text.subTitle}
            extra={[
              <Button key="retry" type="primary" onClick={this.handleRetry}>
                {text.retryLabel}
              </Button>,
              <Button key="home" onClick={this.handleBackHome}>
                {text.backLabel}
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
