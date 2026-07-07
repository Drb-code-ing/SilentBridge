import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || "未知错误" };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary] caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-mint-50 p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[#283044]/10 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
            !
          </div>
          <h2 className="text-xl font-bold text-[#283044] mb-2">页面出了点问题</h2>
          <p className="text-sm text-[#283044]/60 mb-6">
            可能是网络波动或浏览器兼容性问题，请重试一次。
          </p>
          <pre className="text-xs text-left bg-[#283044]/5 p-3 rounded-md mb-6 overflow-auto max-h-32 text-[#283044]/70">
            {this.state.errorMessage}
          </pre>
          <button
            type="button"
            onClick={this.handleRetry}
            className="w-full px-6 py-3 rounded-xl bg-[#283044] text-white font-semibold hover:bg-[#1a2230] transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }
}
