// frontend/src/main.tsx
// Main entry point for the React application

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// Error boundary for production error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20 text-center max-w-md">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              Don't worry! This happens sometimes. Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 cursor-pointer">Error Details (Dev Mode)</summary>
                <pre className="mt-2 text-xs text-gray-300 overflow-auto max-h-32 bg-black/20 p-2 rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize the React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the app with error boundary
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Performance monitoring (optional)
//if (process.env.NODE_ENV === 'development') {
  // Report web vitals in development
  //import('./utils/reportWebVitals').then(({ reportWebVitals }) => {
    //reportWebVitals(console.log);
  //});
//}

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This file is where our React application starts running. Here's what happens:
 * 
 * 1. ERROR BOUNDARY:
 *    - Catches any errors that happen in our React components
 *    - Shows a friendly error message instead of a blank page
 *    - In development, shows error details for debugging
 * 
 * 2. REACT STRICT MODE:
 *    - Helps catch bugs during development
 *    - Doesn't affect production performance
 *    - Provides warnings about unsafe practices
 * 
 * 3. ROOT RENDERING:
 *    - Finds the 'root' element in our HTML
 *    - Renders our entire App component tree
 *    - Uses React 18's new concurrent features
 * 
 * 4. PERFORMANCE MONITORING:
 *    - Tracks how fast our app loads and runs
 *    - Only in development mode to avoid overhead
 * 
 * This setup ensures our app starts reliably and handles errors gracefully,
 * providing a professional user experience even when things go wrong.
 */