import { useEffect, useState, memo } from 'react';
import { Shield, Flame, Star, Skull, Crown, Trophy, Target } from 'lucide-react';
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
    text-shadow: 0 0 6px rgba(250,204,21,0.6), 0 0 12px rgba(250,204,21,0.4);
  }

  @keyframes auroraShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-aurora { background-size: 200% 200%; animation: auroraShift 9s ease-in-out infinite; }

  @keyframes floatBlob {
    0%,100% { transform: translateY(0) scale(1); opacity: .65; }
    50% { transform: translateY(-14px) scale(1.08); opacity: .9; }
  }
  .blob { filter: blur(28px); mix-blend-mode: plus-lighter; animation: floatBlob 11s ease-in-out infinite; }
  .blob:nth-child(2){ animation-duration: 13s; animation-delay: -4s; }
  .blob:nth-child(3){ animation-duration: 15s; animation-delay: -7s; }

  @keyframes rotateRing { to { transform: rotate(360deg); } }
  .rotating-ring { animation: rotateRing 18s linear infinite; }

  .noise-overlay { background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px); }
  .spark-overlay { background-image: radial-gradient(circle at 12% 18%, rgba(255,255,255,0.18) 0 8%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12) 0 6%, transparent 55%); }
`;

// Rank style configuration (palette, gradients, icon, effects)
const rankStyles = {
  E: {
    name: 'E',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 40%, #0f172a 100%)',
    border: 'rgba(148,163,184,0.4)',
    glow: 'rgba(148,163,184,0.55)',
    icon: <Shield className="w-4 h-4" />,
  aurora: 'linear-gradient(120deg,#334155,#1e293b,#0f172a,#334155)',
  bar: 'linear-gradient(90deg,#64748b,#94a3b8)',
  },
  D: {
    name: 'D',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%)',
    border: 'rgba(99,102,241,0.6)',
    glow: 'rgba(99,102,241,0.65)',
    icon: <Flame className="w-4 h-4" />,
  aurora: 'linear-gradient(115deg,#312e81,#1e40af,#4338ca,#1e1b4b)',
  bar: 'linear-gradient(90deg,#6366f1,#818cf8)',
  },
  C: {
    name: 'C',
    gradient: 'linear-gradient(135deg, #164e63 0%, #0e7490 55%, #083344 100%)',
    border: 'rgba(34,211,238,0.65)',
    glow: 'rgba(34,211,238,0.6)',
    icon: <Star className="w-4 h-4" />,
  aurora: 'linear-gradient(125deg,#0e7490,#164e63,#0891b2,#083344)',
  bar: 'linear-gradient(90deg,#06b6d4,#22d3ee)',
  },
  B: {
    name: 'B',
    gradient: 'linear-gradient(140deg, #3f1d47 0%, #5b1d5a 55%, #2d0f37 100%)',
    border: 'rgba(236,72,153,0.7)',
    glow: 'rgba(236,72,153,0.7)',
    icon: <Target className="w-4 h-4" />,
  aurora: 'linear-gradient(140deg,#5b1d5a,#3f1d47,#6d224d,#2d0f37)',
  bar: 'linear-gradient(90deg,#ec4899,#f472b6)',
  },
  A: {
    name: 'A',
    gradient: 'linear-gradient(145deg, #422006 0%, #713f12 50%, #1c1917 100%)',
    border: 'rgba(251,191,36,0.8)',
    glow: 'rgba(251,191,36,0.75)',
    icon: <Crown className="w-4 h-4" />,
  aurora: 'linear-gradient(130deg,#713f12,#b45309,#f59e0b,#422006)',
  bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
  },
  S: {
    name: 'S',
    gradient: 'linear-gradient(150deg, #581c87 0%, #7e22ce 45%, #9333ea 60%, #4c1d95 100%)',
    border: 'rgba(168,85,247,0.9)',
    glow: 'rgba(168,85,247,0.85)',
    icon: <Trophy className="w-4 h-4" />,
    special: true,
  aurora: 'linear-gradient(140deg,#7e22ce,#9333ea,#4c1d95,#a855f7,#7e22ce)',
  bar: 'linear-gradient(90deg,#a855f7,#ec4899)',
  },
};

const MissionCard = ({ tracker, index }) => {
  const progressPercentage = Math.min(100, Math.floor((tracker.daycount / tracker.duration) * 100));
  const rankCfg = rankStyles[tracker.rank] || rankStyles['E'];

  return (
    <Link
      to={`/missions/${tracker.id}`}
      className="animate-fadeInUp block cursor-pointer"
      style={{ animationDelay: `${index * 0.08}s`, fontFamily: theme.fonts.secondary }}
    >
      <div
        className={`relative w-72 h-[410px] rounded-2xl overflow-hidden group transition-all duration-500`}
        style={{
          background: rankCfg.gradient,
          boxShadow: `0 0 0 1px ${rankCfg.border}, 0 0 25px -4px ${rankCfg.glow}`,
        }}
      >
        {/* Animated multi-layer backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-aurora opacity-40" style={{ background: rankCfg.aurora }} />
          <div className="absolute inset-0 noise-overlay opacity-15 mix-blend-overlay" />
          <div className="absolute inset-0 spark-overlay opacity-25" />
          {/* Floating energy blobs */}
          <div className="absolute inset-0">
            <div className="blob absolute w-40 h-40 -top-10 -left-6 rounded-full" style={{ background: 'radial-gradient(circle,#ffffff30,#ffffff05 60%)' }} />
            <div className="blob absolute w-32 h-32 top-1/3 -right-8 rounded-full" style={{ background: 'radial-gradient(circle,#ffffff25,#ffffff05 65%)' }} />
            <div className="blob absolute w-28 h-28 bottom-4 left-10 rounded-full" style={{ background: 'radial-gradient(circle,#ffffff20,#ffffff05 70%)' }} />
          </div>
          {/* Rotating prestige ring for S rank */}
          {rankCfg.special && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rotating-ring w-[340px] h-[340px] rounded-full opacity-30"
                   style={{
                     background: 'conic-gradient(from 0deg,#ffffff10,#ffffff40,#ffffff05,#ffffff30,#ffffff10)'
                   }} />
            </div>
          )}
        </div>
        {rankCfg.special && (
          <div className="absolute -inset-px rounded-2xl pointer-events-none animate-pulse" style={{
            background: 'linear-gradient(120deg, rgba(255,255,255,0.25), transparent, rgba(255,255,255,0.15))',
            mixBlendMode: 'overlay'
          }} />
        )}

        {/* Top badge ribbon */}
        <div className="absolute top-0 left-0 right-0 flex justify-between p-3 z-20">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider"
               style={{
                 background: 'rgba(0,0,0,0.35)',
                 backdropFilter: 'blur(6px)',
                 border: `1px solid ${rankCfg.border}`,
                 color: '#fff'
               }}>
            <span className="flex items-center gap-1 text-[11px]">{rankCfg.icon} {rankCfg.name}-RANK</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold"
               style={{ background:'rgba(0,0,0,0.35)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-amber-300">Streak:</span>
            <span className="text-amber-200 font-bold">{tracker.streak}</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col pt-16 px-6 pb-5">
          <h2 className="text-xl font-black tracking-wider mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-300 drop-shadow" style={{ fontFamily: theme.fonts.primary }}>
            {tracker.title}
          </h2>
          <p className="text-[11px] text-purple-100/80 mb-4 line-clamp-3 leading-snug" style={{ fontFamily: theme.fonts.secondary }}>
            {tracker.description || 'An evolving challenge awaits your ascension.'}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] tracking-widest text-purple-200 font-semibold" style={{ fontFamily: theme.fonts.primary }}>PROGRESS</span>
              <span className="text-[10px] tracking-widest text-purple-200 font-semibold" style={{ fontFamily: theme.fonts.primary }}>
                {tracker.daycount}/{tracker.duration} • {progressPercentage}%
              </span>
            </div>
            <div className="relative h-2 w-full rounded-full overflow-hidden bg-black/40 border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  background: rankCfg.bar,
                  boxShadow: '0 0 10px rgba(236,72,153,0.6),0 0 4px rgba(139,92,246,0.8)'
                }}
              />
              <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2.2s_infinite]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div>
              <div className="text-[9px] font-black text-emerald-300 mb-1 tracking-widest" style={{ fontFamily: theme.fonts.primary }}>REWARDS</div>
              <div className="text-[10px] space-y-0.5 text-emerald-200" style={{ fontFamily: theme.fonts.secondary }}>
                <div>XP: {tracker.reward?.xp || 0}</div>
                <div>Coins: {tracker.reward?.coins || 0}</div>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-black text-red-300 mb-1 tracking-widest" style={{ fontFamily: theme.fonts.primary }}>PENALTIES</div>
              <div className="text-[10px] space-y-0.5 text-red-200" style={{ fontFamily: theme.fonts.secondary }}>
                <div>Skip: {tracker.penalty?.skip?.coins || 0}</div>
                <div>Fail: {tracker.penalty?.missionFail?.coins || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0),rgba(236,72,153,0.8),rgba(255,255,255,0))' }} />

        {/* Hover ring */}
        <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-purple-400/60 transition-all duration-500 pointer-events-none" />
      </div>
    </Link>
  );
};

// Simple loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen text-purple-300" style={{ fontFamily: theme.fonts.primary }}>
    Loading missions...
  </div>
);

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
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-400 transition-all duration-300 animate-fade-in-up"
            style={{ fontFamily: theme.fonts.primary }}
          >
            Add custom 
          </Link>
          <Link
            to="/add-mission"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-400 transition-all duration-300 animate-fade-in-up"
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