import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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
    console.error('MemberPortal Uncaught Error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="max-w-md w-full bg-white/95 rounded-3xl border border-[#EDE2D7] p-8 shadow-[0_8px_30px_rgba(81,70,63,0.08)] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] border border-[#E8795B]/30 text-[#E8795B] flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#51463F]">
                {this.props.fallbackTitle || 'Workspace View Temporarily Unavailable'}
              </h3>
              <p className="text-xs text-[#82776E] leading-relaxed">
                {this.props.fallbackMessage ||
                  'An unexpected rendering issue occurred while displaying this workspace module. Your credentials and wallet balance are safe.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EDE2D7] text-[11px] text-[#82776E] font-mono text-left max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E8795B] to-[#D96B4E] text-white text-xs font-bold shadow-sm hover:from-[#D96B4E] hover:to-[#C85C3F] transition-all cursor-pointer"
              >
                Reload Page
              </button>
              <Link
                to="/dashboard"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#EDE2D7] text-[#51463F] text-xs font-bold hover:border-[#8064B1] hover:text-[#8064B1] transition-all cursor-pointer text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

