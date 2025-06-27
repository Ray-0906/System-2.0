import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={`flex items-center justify-center h-screen ${theme.colors.background} text-white`}>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-400">Loading Error</h1>
            <p className="text-purple-300">Something went wrong: {this.state.error.message}</p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-500 hover:to-pink-400 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Centralized theme constants
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-gray-800 to-black',
    border: 'border-purple-500/50',
    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    accent: 'text-purple-400',
    text: 'text-white',
    muted: 'text-purple-300',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
  },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.3; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-20px) scale(0.8); }
  }
  @keyframes text-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-spin {
    animation: spin 1.5s linear infinite;
  }
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .animate-text-pulse {
    animation: text-pulse 1.5s ease-in-out infinite;
  }
  .hover-glow {
    transition: all 0.3s ease;
  }
  .hover-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
    border-color: rgba(139, 92, 246, 0.8);
  }
`;

const SoloLoading = ({ loading = true, message = "Loading Monarch Protocols..." }) => {
  if (!loading) return null;

  return (
    <ErrorBoundary>
      <style>{styles}</style>
      <div className={`fixed inset-0 ${theme.colors.background} backdrop-blur-sm flex items-center justify-center z-50`} aria-live="polite" aria-label="Loading screen">
        {/* Main Spinner */}
        <div className="relative flex flex-col items-center justify-center space-y-4">
          {/* Animated Ring */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-purple-400 border-transparent rounded-full animate-spin">
              <div className="absolute -top-[2px] left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_12px] shadow-purple-400"></div>
            </div>
            
            {/* Center Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-xl animate-pulse"></div>
          </div>

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 90 + 5}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 animate-text-pulse" style={{ fontFamily: theme.fonts.primary }}>
              SYSTEM INITIALIZING
            </h2>
            <p className="text-sm text-purple-300 font-mono tracking-widest" style={{ fontFamily: theme.fonts.primary }}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SoloLoading;