import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('VIDYORA ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      let friendlyHint =
        'Kuch technical problem aa gayi hai. Page reload karke dobara try karein.';
      if (this.state.errorMessage.includes('Missing or insufficient permissions')) {
        friendlyHint =
          'Is action ke liye authorized sign-in zaroori hai. Kripya apna account verify karke dobara try karein.';
      } else if (this.state.errorMessage.includes('Quota exceeded')) {
        friendlyHint =
          'Free-tier database quota abhi reach ho gaya hai. Kal quota reset hone par dobara try karein.';
      }

      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-[#0B1221]">
              Oops! Ek Chhota Error Aaya
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {friendlyHint}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reload VIDYORA</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
