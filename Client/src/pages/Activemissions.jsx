import { useEffect, useState, memo } from 'react';
import { Shield, Flame, Star, Skull } from 'lucide-react';
import { useTrackerStore } from '../store/trackerStore';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Centralized theme constants for Solo Leveling aesthetic
const theme = {
  fonts: {
    primary: "'Rajdhani', 'Orbitron', monospace",
    secondary: "'Exo 2', 'Poppins', sans-serif",
  },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-gray-800 to-black',
    border: 'border-purple-900/40',
    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    title: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500',
    accent: 'text-purple-400',
    rank: 'text-yellow-400',
    streak: 'text-yellow-400',
    dayCount: 'text-purple-300',
    reward: 'text-emerald-400',
    penalty: 'text-red-400',
    text: 'text-white',
    muted: 'text-purple-300',
    empty: 'text-purple-300',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
  },
};

// Enhanced CSS with improved animations
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Exo+2:wght@200;300;400;500;600;700;800&display=swap');
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
    }
    50% { 
      box-shadow: 0 0 30px rgba(139, 92, 246, 0.7);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .hover-glow {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .hover-glow:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
    border-color: rgba(139, 92, 246, 0.8);
  }
  
  .rank-glow {
    text-shadow: 0 0 10px currentColor;
    filter: drop-shadow(0 0 8px currentColor);
  }
  
  .progress-shimmer {
    position: relative;
    overflow: hidden;
  }
  
  .progress-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
    animation: shimmer 2s ease-in-out infinite;
  }
  
  .text-glow {
    text-shadow: 0 0 10px currentColor;
  }
  
  .orb-glow {
    animation: glow-pulse 3s ease-in-out infinite;
  }
`;

/**
 * Loading state component
 */
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative mb-6">
      <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
    </div>
    <p
      className={`text-center ${theme.colors.accent} ${theme.animations.pulse} font-semibold tracking-wider`}
      style={{ fontFamily: theme.fonts.primary }}
    >
      Loading missions...
    </p>
  </div>
));

/**
 * Enhanced mission card with your original background
 */
const MissionCard = ({ tracker, index }) => {
  const progressPercentage = Math.floor((tracker.daycount / tracker.duration) * 100);

  return (
    <Link
      to={`/missions/${tracker.id}`}
      className="animate-fadeInUp block cursor-pointer"
      style={{ 
        animationDelay: `${index * 0.1}s`, 
        fontFamily: theme.fonts.secondary 
      }}
    >
      <div className="relative w-72 h-96 rounded-2xl overflow-hidden hover-glow group">
        {/* Your original background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url('https://i.pinimg.com/736x/f6/86/e6/f686e63dda13314108d03863ddfd9f00.jpg')`,
          }}
        />

        {/* Inner shadow effect */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(139, 92, 246, 0.3)",
          }}
        />

        {/* Card Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          {/* Header Section */}
          <div>
            {/* Mission Title with better typography */}
            <h2 className="text-xl font-black tracking-wider mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 text-glow" 
                style={{ fontFamily: theme.fonts.primary }}>
              {tracker.title}
            </h2>

            {/* Enhanced Stats Row */}
            <div className="flex items-center gap-4 mb-4 text-xs font-bold">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 rank-glow">👑</span>
                <span className="text-yellow-400 rank-glow tracking-wider" style={{ fontFamily: theme.fonts.primary }}>
                  RANK: {tracker.rank}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">🔥</span>
                <span className="text-yellow-400 tracking-wider" style={{ fontFamily: theme.fonts.primary }}>
                  {tracker.streak} DAYS
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-300">⏱️</span>
                <span className="text-purple-300 tracking-wider" style={{ fontFamily: theme.fonts.primary }}>
                  {tracker.duration} DAYS
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Enhanced Progress Section */}
            <div className="mb-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-purple-300 tracking-wider" 
                      style={{ fontFamily: theme.fonts.primary }}>
                  PROGRESS
                </span>
                <span className="text-xs font-bold text-purple-300 tracking-wider" 
                      style={{ fontFamily: theme.fonts.primary }}>
                  DAY {tracker.daycount}/{tracker.duration} • {progressPercentage}%
                </span>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative w-full h-2 bg-gray-700/80 rounded-full overflow-hidden backdrop-blur-sm border border-purple-500/30">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-700 ease-out progress-shimmer"
                  style={{ 
                    width: `${progressPercentage}%`,
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)'
                  }}
                />
              </div>
            </div>

            {/* Enhanced Bottom Section */}
            <div className="flex justify-between gap-4">
              {/* Rewards */}
              <div className="flex-1">
                <div className="text-[10px] font-black text-emerald-400 mb-1 tracking-widest text-glow" 
                     style={{ fontFamily: theme.fonts.primary }}>
                  ⚡ REWARDS
                </div>
                <div className="text-[9px] space-y-0.5" style={{ fontFamily: theme.fonts.secondary }}>
                  <div className="text-emerald-300">XP: {tracker.reward?.xp || 0}</div>
                  <div className="text-emerald-300">COINS: {tracker.reward?.coins || 0}</div>
                </div>
              </div>

              {/* Penalties */}
              <div className="flex-1">
                <div className="text-[10px] font-black text-red-400 mb-1 tracking-widest text-glow" 
                     style={{ fontFamily: theme.fonts.primary }}>
                  💀 PENALTIES
                </div>
                <div className="text-[9px] space-y-0.5" style={{ fontFamily: theme.fonts.secondary }}>
                  <div className="text-red-300">SKIP: {tracker.penalty?.skip?.coins || 0}</div>
                  <div className="text-red-300">FAIL: {tracker.penalty?.missionFail?.coins || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Holographic Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
          }}
        />

        {/* Enhanced Edge Glow */}
        <div className="absolute inset-0 rounded-2xl border border-purple-400/30 group-hover:border-purple-400/70 transition-colors duration-300" />
      </div>
    </Link>
  );
};

/**
 * Main ActiveMissions component with improved layout
 */
const ActiveMissions = () => {
  const trackers = useTrackerStore((state) => state.trackers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(!Array.isArray(trackers));
  }, [trackers]);

  if (isLoading) return <LoadingState />;

  return (
    <><AuthLayout>
    <div className={`min-h-screen ${theme.colors.background} text-white p-6`}>
      <style>{styles}</style>
      
      {/* Background ambient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 ${theme.animations.fadeInUp} text-glow`}
            style={{ 
              fontFamily: theme.fonts.primary,
              textShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
            }}
          >
            ACTIVE MISSIONS
          </h1>
          <p className="text-purple-300 text-lg tracking-wide max-w-2xl mx-auto" 
             style={{ fontFamily: theme.fonts.secondary }}>
            Rise through the ranks by completing these challenging missions
          </p>
        </div>

        {/* Improved Mission Grid */}
        {trackers.length === 0 ? (
          <div className="text-center py-20">
            <p
              className={`text-xl ${theme.colors.empty} tracking-wide`}
              style={{ fontFamily: theme.fonts.primary }}
            >
              No active missions available.
            </p>
            <p className="text-purple-300 mt-2" style={{ fontFamily: theme.fonts.secondary }}>
              Visit the Guild to accept new missions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
            {trackers.map((tracker, index) => (
              <MissionCard key={tracker.id} tracker={tracker} index={index} />
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-center gap-6">
          <Link
            to="/add-custom"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-400 transition-all duration-300 ${theme.animations.fadeInUp}"
            style={{ fontFamily: theme.fonts.primary }}
          >
            Add custom 
          </Link>
          <Link
            to="/add-mission"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-400 transition-all duration-300 ${theme.animations.fadeInUp}"
            style={{ fontFamily: theme.fonts.primary }}
          >
            Join New Mission
          </Link>
        </div>
      </div>
    </div></AuthLayout></>
  );
};

export default ActiveMissions;