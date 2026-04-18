import { useState, useMemo, useEffect } from 'react';
import { useTrackerStore } from '../store/trackerStore';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, ShieldAlert, Award, Zap, ChevronRight, Activity, Crosshair } from 'lucide-react';

const getRankColor = (rank) => {
  const map = { S: 'text-[#ffb000]', A: 'text-[#ff3366]', B: 'text-[#a855f7]', C: 'text-[#06b6d4]', D: 'text-[#3b82f6]', E: 'text-[#94a3b8]' };
  return map[rank] || 'text-[#94a3b8]';
};

const getRankBg = (rank) => {
  const map = { S: 'bg-[#ffb000]', A: 'bg-[#ff3366]', B: 'bg-[#a855f7]', C: 'bg-[#06b6d4]', D: 'bg-[#3b82f6]', E: 'bg-[#94a3b8]' };
  return map[rank] || 'bg-[#94a3b8]';
};

const getRankShadow = (rank) => {
  const map = { S: 'shadow-[0_0_15px_rgba(255,176,0,0.5)]', A: 'shadow-[0_0_15px_rgba(255,51,102,0.5)]', B: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]', C: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]', D: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]', E: 'shadow-[0_0_10px_rgba(148,163,184,0.3)]' };
  return map[rank] || 'shadow-none';
};

const ActiveMissions = () => {
  const trackers = useTrackerStore((state) => state.trackers);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { setIsLoading(!Array.isArray(trackers)); }, [trackers]);

  const sortedTrackers = useMemo(() => {
    if (!Array.isArray(trackers)) return [];
    return [...trackers].sort((a, b) => {
      const rankWeight = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };
      return (rankWeight[b.rank] || 0) - (rankWeight[a.rank] || 0);
    });
  }, [trackers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030305] text-white flex flex-col items-center justify-center font-['Rajdhani'] tracking-widest relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <Activity className="w-12 h-12 text-[#3b82f6] animate-pulse mb-4" />
        <div className="text-[#3b82f6] animate-pulse text-xl drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">SYNCHRONIZING SYSTEM...</div>
      </div>
    );
  }

  const primaryObjective = sortedTrackers[0];
  const secondaryObjectives = sortedTrackers.slice(1);

  return (
    <AuthLayout>
      <div 
        className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 pb-24 relative overflow-hidden font-['Exo_2']"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 animate-pulse"
          style={{
            background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.15), transparent 80%)'
          }}
        />
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
          
          {/* Header Section */}
          <div className="mb-12 border-b border-white/5 pb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-[#3b82f6] animate-ping rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <h3 className="text-[#3b82f6] text-xs font-black tracking-[0.4em] font-['Rajdhani']">SYSTEM INTERFACE // QUEST LOG</h3>
              </div>
              <h1 className="text-5xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                ACTIVE MISSIONS
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <div className="text-4xl font-black font-['Rajdhani'] text-white/10">{sortedTrackers.length}</div>
              <div className="text-[10px] text-white/30 tracking-widest">TOTAL ENGAGEMENTS</div>
            </div>
          </div>

          {/* Primary Objective Window */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#a855f7]/30 to-[#a855f7]/80"></div>
              <h3 className="text-[#a855f7] text-sm font-black tracking-[0.3em] font-['Rajdhani'] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                <Crosshair className="w-4 h-4" />
                PRIMARY DIRECTIVE
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#a855f7]/80 via-[#a855f7]/30 to-transparent"></div>
            </div>

            {primaryObjective ? (
              <motion.div 
                layoutId="primary"
                onClick={() => navigate(`/missions/${primaryObjective.id}`)}
                whileHover={{ scale: 1.01 }}
                className="group relative bg-[#090b10] border border-[#1e2330] p-1 cursor-pointer transition-all duration-300 hover:border-[#a855f7]/50"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${getRankBg(primaryObjective.rank).replace('bg-', '')}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="bg-[#050608] h-full p-8 relative overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#a855f7] to-transparent opacity-50"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-3 py-1 bg-[#121319] border ${getRankColor(primaryObjective.rank).replace('text-', 'border-')} ${getRankShadow(primaryObjective.rank)}`}>
                          <span className={`${getRankColor(primaryObjective.rank)} text-[11px] font-black tracking-widest font-['Rajdhani']`}>
                            {primaryObjective.rank}-RANK
                          </span>
                        </div>
                        {primaryObjective.streak > 0 && (
                          <div className="flex items-center gap-1.5 text-orange-400 text-[10px] tracking-widest font-['Rajdhani'] px-2 py-1 bg-orange-400/10 border border-orange-400/20 rounded">
                            <Zap className="w-3 h-3" /> STREAK: {primaryObjective.streak}
                          </div>
                        )}
                      </div>
                      
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 group-hover:text-[#a855f7] transition-colors">{primaryObjective.title || primaryObjective.missionId?.title}</h2>
                      <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">{primaryObjective.missionId?.description || "Critical mission parameters engaged. Awaiting user execution."}</p>
                    </div>

                    <div className="w-full md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-gray-500 tracking-[0.2em] font-['Rajdhani'] uppercase">COMPLETION RATE</span>
                        <span className={`text-xl font-bold font-['Rajdhani'] ${getRankColor(primaryObjective.rank)}`}>
                          {Math.min(100, Math.floor((primaryObjective.daycount / primaryObjective.duration) * 100))}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#121319] rounded-sm overflow-hidden border border-white/5 relative">
                        {/* Grid overlay for segmented progress bar look */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.5)_4px,rgba(0,0,0,0.5)_6px)] z-10"></div>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.floor((primaryObjective.daycount / primaryObjective.duration) * 100))}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full ${getRankBg(primaryObjective.rank)} shadow-[0_0_10px_currentColor]`} 
                        />
                      </div>
                      <div className="mt-4 flex justify-between items-center text-[10px] tracking-widest text-gray-500 font-['Rajdhani']">
                        <span>{primaryObjective.daycount} DAYS LOGGED</span>
                        <span>{primaryObjective.duration} REQUIRED</span>
                      </div>
                      <div className="mt-6 flex items-center justify-end gap-2 text-[#a855f7] text-xs font-bold tracking-widest font-['Rajdhani'] group-hover:translate-x-1 transition-transform">
                        ACCESS DIRECTIVE <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-16 bg-[#090b10] border border-[#1e2330] rounded-sm relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                <style>{`
                  @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                  }
                  .scanline-effect {
                    animation: scanline 8s linear infinite;
                  }
                `}</style>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#a855f7]/5 to-transparent h-[50px] w-full scanline-effect pointer-events-none"></div>
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="font-['Rajdhani'] tracking-[0.3em] font-bold text-gray-500">NO PRIMARY DIRECTIVE ASSIGNED</p>
                <Link to="/mission" className="inline-block mt-6 px-6 py-2 bg-transparent border border-[#a855f7]/50 text-[#a855f7] text-xs font-bold tracking-widest font-['Rajdhani'] hover:bg-[#a855f7]/10 transition-colors">BROWSE MISSIONS</Link>
              </div>
            )}
          </div>

          {/* Secondary Objectives List */}
          {secondaryObjectives.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-gray-500 text-xs font-black tracking-[0.3em] font-['Rajdhani'] whitespace-nowrap">
                  SECONDARY ASSIGNMENTS [{secondaryObjectives.length}]
                </h3>
                <div className="h-[1px] w-full bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {secondaryObjectives.map((quest, i) => {
                    const p = Math.min(100, Math.floor((quest.daycount / quest.duration) * 100));
                    const rColor = getRankColor(quest.rank);
                    const rBg = getRankBg(quest.rank);
                    const shadow = getRankShadow(quest.rank);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={quest.id}
                        onClick={() => navigate(`/missions/${quest.id}`)}
                        className={`group cursor-pointer bg-[#090b10] border border-[#1e2330] hover:border-gray-500 transition-all duration-300 flex flex-col relative overflow-hidden`}
                      >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-transparent to-${rBg.replace('bg-', '')} transition-opacity duration-300 pointer-events-none`}></div>
                        
                        {/* Status Line */}
                        <div className={`absolute top-0 left-0 w-full h-[2px] ${rBg} opacity-50 group-hover:opacity-100 ${shadow} transition-all`}></div>
                        
                        <div className="p-5 flex-1 flex flex-col relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`${rColor} text-[10px] font-black tracking-widest font-['Rajdhani'] drop-shadow-[0_0_2px_currentColor]`}>
                              RANK [{quest.rank}]
                            </span>
                            <Clock className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                          </div>
                          
                          <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 leading-snug group-hover:text-gray-200 transition-colors">
                            {quest.title || quest.missionId?.title}
                          </h3>
                          
                          <p className="text-xs text-gray-500 mb-6 line-clamp-2 mt-auto">
                            {quest.description || "Sub-routine execution active. Maintain consistency."}
                          </p>

                          <div className="mt-auto">
                            <div className="flex justify-between items-end mb-2">
                              <div className="text-[10px] tracking-widest font-['Rajdhani'] text-gray-500">
                                <span className="text-white">{quest.daycount}</span> / {quest.duration} DAYS
                              </div>
                              <span className={`text-xs font-bold font-['Rajdhani'] ${rColor}`}>{p}%</span>
                            </div>
                            
                            <div className="h-1.5 w-full bg-[#121319] rounded-sm overflow-hidden border border-white/5 relative">
                              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.7)_2px,rgba(0,0,0,0.7)_4px)] z-10"></div>
                              <div 
                                className={`h-full ${rBg} transition-all duration-1000 ease-out`} 
                                style={{ width: `${p}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {!primaryObjective && secondaryObjectives.length === 0 && (
            <div className="text-center py-20 bg-[#050608] border border-dashed border-white/10">
              <Activity className="w-12 h-12 mb-4 text-gray-700 mx-auto" />
              <p className="font-['Rajdhani'] tracking-[0.3em] font-bold text-gray-500 mb-2">NO ACTIVE ENGAGEMENTS DETECTED</p>
              <p className="text-xs text-gray-600 mb-6">Initialize new tracking subroutines to continue progression.</p>
              <Link to="/mission" className="mt-4 text-xs font-bold tracking-widest font-['Rajdhani'] bg-[#1e2330] border border-gray-700 px-6 py-3 rounded-sm text-white hover:bg-gray-800 hover:border-gray-500 transition-all uppercase">
                INITIATE NEW MISSION
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ActiveMissions;
