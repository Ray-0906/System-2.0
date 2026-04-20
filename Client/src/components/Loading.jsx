import React from 'react';
import { Activity } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030305] text-gray-200 font-['Rajdhani']">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-10 pointer-events-none"></div>
          <div className="relative z-10 text-center space-y-6 bg-[#050608] border border-red-500/50 p-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
            <div className="text-red-500 font-black tracking-[0.3em] uppercase text-xl flex items-center justify-center gap-3">
              <Activity className="w-6 h-6 animate-pulse" />
              SYSTEM FAILURE
            </div>
            <p className="text-gray-400 tracking-widest text-sm uppercase">{this.state.error.message}</p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20 transition-all uppercase font-bold tracking-[0.2em] text-xs mt-4"
            >
              REBOOT SEQUENCE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SoloLoading = ({ loading = true, message = "AWAITING SYNCHRONIZATION..." }) => {
  if (!loading) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050608]/95 backdrop-blur-xl font-['Rajdhani']" aria-live="polite" aria-label="Loading screen">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
        
        {/* Core Container */}
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
          {/* Tech Ring Spinner */}
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-[3px] border-white/5 rounded-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
            <div className="absolute inset-0 border-[3px] border-t-[#3b82f6] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <div className="absolute inset-2 border-[3px] border-b-[#a855f7] border-t-transparent border-l-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse] shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
            <div className="w-12 h-12 bg-[#121319] rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[#3b82f6] animate-pulse opacity-20 blur-md"></div>
               <Activity className="w-5 h-5 text-[#3b82f6] animate-pulse relative z-10" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 font-['Exo_2'] mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            SYSTEM BOOT
          </h2>
          
          <div className="flex items-center gap-3 w-full mb-3 justify-center">
             <div className="w-2 h-2 bg-[#a855f7] animate-ping rounded-full shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
             <p className="text-[#a855f7] text-[11px] font-bold tracking-[0.3em] uppercase truncate max-w-[80%]">
               {message}
             </p>
          </div>

          {/* Progress Bar Segment */}
          <div className="w-full h-1.5 bg-[#121319] border border-white/10 relative overflow-hidden mb-1 mt-2">
             <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.8)_4px,rgba(0,0,0,0.8)_6px)] z-10 pointer-events-none"></div>
             <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#a855f7] w-full origin-left shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ animation: 'progress-shimmer 2s ease-in-out infinite' }}></div>
          </div>
          <div className="w-full flex justify-between text-[9px] text-gray-500 font-bold tracking-widest">
            <span>SYS.VER 2.0</span>
            <span>NEURAL LINK ESTABLISHED</span>
          </div>

          <style>{`
            @keyframes progress-shimmer {
              0% { transform: scaleX(0); opacity: 0.5; }
              50% { transform: scaleX(0.7); opacity: 1; }
              100% { transform: scaleX(1); opacity: 0.5; }
            }
          `}</style>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SoloLoading;