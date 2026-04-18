const fs = require('fs');
const content = import { useEffect, useState, useMemo } from 'react';
import { Shield, Flame, Star, Skull, Crown, Trophy, Target, Search, SlidersHorizontal, ArrowDownWideNarrow, LayoutGrid, List, Filter, Clock, CheckCircle2, Trash2, Zap, Lock, Sword } from 'lucide-react';
import { useTrackerStore } from '../store/trackerStore';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const styles = \\\
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700;800&family=Exo+2:wght@300;400;500;600;700&display=swap');
  .font-primary { font-family: 'Rajdhani', sans-serif; }
  .font-secondary { font-family: 'Exo 2', sans-serif; }
  .text-glow { text-shadow: 0 0 10px rgba(255,255,255,0.3); }
\\\;

const getRankColor = (rank) => {
  const map = { S: '#a855f7', A: '#d946ef', B: '#06b6d4', C: '#c084fc', D: '#3b82f6', E: '#94a3b8' };
  return map[rank] || '#94a3b8';
};

const CircularProgress = ({ percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: '120px', height: '120px' }}>
      <svg className="w-full h-full -rotate-90 transform">
        <circle cx="60" cy="60" r={radius} className="stroke-gray-800" strokeWidth="8" fill="none" />
        <circle cx="60" cy="60" r={radius} className="stroke-[#d946ef]" strokeWidth="8" fill="none" strokeLinecap="round" 
          strokeDasharray={circumference} strokeDashoffset={offset} 
          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out', filter: 'drop-shadow(0 0 6px rgba(217, 70, 239, 0.6))' }} />
      </svg>
      <div className="absolute flex items-center justify-center text-3xl font-black font-secondary tracking-tighter text-white">
        {percentage}<span className="text-xl ml-0.5">%</span>
      </div>
    </div>
  );
};

const ActiveMissions = () => {
  const trackers = useTrackerStore((state) => state.trackers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setIsLoading(!Array.isArray(trackers)); }, [trackers]);

  const sortedTrackers = useMemo(() => {
    if (!Array.isArray(trackers)) return [];
    return [...trackers].sort((a, b) => {
      const rankWeight = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };
      return (rankWeight[b.rank] || 0) - (rankWeight[a.rank] || 0);
    });
  }, [trackers]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0b0c10] text-[#e2e8f0] flex items-center justify-center font-primary tracking-widest">SYSTEM LOADING...</div>;
  }

  const totalProgress = sortedTrackers.length > 0 
    ? Math.round(sortedTrackers.reduce((acc, t) => acc + Math.min(100, (t.daycount / t.duration) * 100), 0) / sortedTrackers.length) : 0;

  const legendary = sortedTrackers[0];
  const secondary = sortedTrackers.length > 1 ? sortedTrackers[1] : null;
  const dailyQuests = sortedTrackers.length > 2 ? sortedTrackers.slice(2) : [];

  return (
    <AuthLayout>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="min-h-screen bg-[#0f1015] text-[#e2e8f0] p-4 pb-20 relative overflow-hidden flex justify-center">
        <div className="w-full max-w-md relative z-10 font-secondary mt-4">
          <div className="mb-6 animate-fade-in-up">
            <h3 className="text-gray-400 text-xs font-black tracking-[0.2em] mb-1 font-primary">CURRENT STATUS</h3>
            <h1 className="text-4xl md:text-5xl font-black tracking-widest text-white leading-none font-primary shadow-black" style={{ textShadow: '0 4px 20px rgba(255,255,255,0.15)' }}>
              ACTIVE<br/>MISSIONS
            </h1>
          </div>

          <div className="flex justify-between items-end mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <p className="text-xs text-gray-400 font-bold tracking-widest mb-1 font-primary">TOTAL PROGRESS</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#d946ef] font-secondary">
                {totalProgress}<span className="text-xl">%</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold tracking-widest mb-1 font-primary">ACTIVE QUESTS</p>
              <h2 className="text-3xl font-black text-white font-secondary leading-none">{sortedTrackers.length}</h2>
            </div>
          </div>

          {legendary && (
            <Link to={\/missions/\\} className="block relative bg-[#15161e] rounded-xl mb-6 overflow-hidden border border-[#2a2b36] hover:border-[#a855f7]/50 transition-colors group animate-fade-in-up shadow-xl shadow-black/50" style={{ animationDelay: '0.2s' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#d946ef] rounded-full mix-blend-screen filter blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative p-5 z-10">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] text-[#a855f7] font-bold tracking-[0.2em] font-primary">LEGENDARY QUEST</span>
                  <div className="bg-gradient-to-r from-[#a855f7] to-[#d946ef] text-black text-xs font-black px-3 py-1 -mr-5 -mt-2 rounded-l-md shadow-[0_0_15px_rgba(217,70,239,0.5)] font-primary tracking-widest">
                    RANK {legendary.rank}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3 tracking-wide leading-tight shadow-black" style={{textShadow: '0 0 10px rgba(255,255,255,0.2)'}}>
                  {legendary.title.toUpperCase()}
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed mb-6 font-secondary pr-4 line-clamp-3">
                  {legendary.description || "Conquer the high-rank dungeon."}
                </p>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest block mb-0.5 font-primary">CURRENT STREAK</span>
                    <span className="text-xl text-white font-black font-primary">{legendary.streak} DAYS</span>
                  </div>
                  <span className="text-sm font-bold text-[#d946ef] font-secondary">{Math.min(100, Math.floor((legendary.daycount / legendary.duration) * 100))}%</span>
                </div>

                <div className="h-2 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#d946ef] rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)] transition-all duration-700 ease-out" style={{ width: \\%\ }}></div>
                </div>
              </div>
            </Link>
          )}

          {secondary && (
            <Link to={\/missions/\\} className="block relative bg-[#15161e] rounded-xl p-4 mb-8 border border-[#2a2b36] hover:border-[#a855f7]/30 transition-colors group animate-fade-in-up shadow-lg shadow-black/40" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="bg-[#a855f7] text-black text-[10px] font-black px-2 py-0.5 rounded font-primary tracking-widest">RANK {secondary.rank}</div>
                <span className="text-[10px] text-gray-500 tracking-widest font-primary">QUEST #{secondary.id.toString().slice(-4).toUpperCase()}</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2 tracking-wide font-primary">{secondary.title.toUpperCase()}</h2>
              <p className="text-xs text-gray-400 mb-5 leading-snug line-clamp-2">{secondary.description || "Analyze combat patterns."}</p>

              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-400 tracking-widest font-primary">PROGRESS</span>
                <span className="text-[11px] text-gray-300 font-bold font-secondary">{secondary.daycount} / {secondary.duration}</span>
              </div>
              
              <div className="h-1 w-full bg-[#0a0a0f] rounded-full overflow-hidden mb-3 border border-white/5">
                <div className="h-full bg-[#d946ef] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(217,70,239,0.6)]" style={{ width: \\%\ }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-primary">STREAK: {secondary.streak} DAYS</span>
                <span className="text-[10px] text-[#d946ef] font-bold tracking-widest font-primary group-hover:text-purple-300 transition-colors">DETAILS</span>
              </div>
            </Link>
          )}

          {dailyQuests.length > 0 && (
            <div className="flex items-center gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <span className="text-[10px] text-gray-500 font-black tracking-[0.25em] whitespace-nowrap font-primary">DAILY QUESTS</span>
              <div className="h-px w-full bg-gradient-to-r from-[#2a2b36] to-transparent"></div>
            </div>
          )}

          <div className="space-y-3 mb-10">
            {dailyQuests.map((quest, idx) => {
              const p = Math.min(100, Math.floor((quest.daycount / quest.duration) * 100));
              const isComplete = p >= 100;
              const color = getRankColor(quest.rank);
              
              return (
                <Link to={\/missions/\\} key={quest.id} className="block relative bg-[#111218] rounded-lg p-4 border border-[#1e1f28] hover:border-gray-600 transition-colors animate-fade-in-up" style={{ animationDelay: \\s\ }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black tracking-widest font-primary" style={{ color }}>RANK {quest.rank}</span>
                    {isComplete ? 
                      <CheckCircle2 className="w-4 h-4 text-[#d946ef]" /> :
                      ((quest.streak === 0 && quest.daycount === 0) ? <Trash2 className="w-4 h-4 text-gray-600" /> : <Clock className="w-4 h-4 text-[#06b6d4]" />)
                    }
                  </div>
                  <h3 className="text-base font-bold text-white mb-4 leading-tight">{quest.title}</h3>
                  <div className="flex justify-between items-center">
                    <div className="h-1 w-1/2 bg-[#1e1f28] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: \\%\, backgroundColor: color }}></div>
                    </div>
                    {isComplete ? (
                      <span className="text-[10px] text-[#d946ef] font-bold tracking-widest font-primary uppercase">COMPLETE</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-bold font-secondary">{p}%</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="bg-[#0b0c10] p-6 rounded-xl border border-[#15161e] mb-8 relative animate-fade-in-up shadow-xl shadow-black/60" style={{ animationDelay: '0.6s' }}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#d946ef] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none"></div>
             <span className="text-[10px] text-gray-400 font-black tracking-[0.2em] mb-6 block font-primary">LOOT PROBABILITY</span>
             <div className="flex flex-col items-center mb-8">
               <CircularProgress percentage={72} />
             </div>
             <span className="text-[10px] text-gray-400 font-black tracking-[0.2em] mb-4 block font-primary relative z-10">UPCOMING REWARDS</span>
             <div className="flex gap-4 justify-start relative z-10">
               <div className="w-12 h-12 bg-[#15161e] rounded flex items-center justify-center border border-[#2a2b36] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] hover:border-[#a855f7]/50 transition-colors">
                 <Zap className="w-5 h-5 text-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" />
               </div>
               <div className="w-12 h-12 bg-[#15161e] rounded flex items-center justify-center border border-[#2a2b36] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] hover:border-[#06b6d4]/50 transition-colors">
                 <Shield className="w-5 h-5 text-[#06b6d4] drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
               </div>
               <div className="w-12 h-12 bg-[#15161e] rounded flex items-center justify-center border border-[#2a2b36] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] hover:border-[#d946ef]/50 transition-colors">
                 <Sword className="w-5 h-5 text-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" />
               </div>
               <div className="w-12 h-12 bg-[#0a0a0f] rounded flex items-center justify-center border border-[#1e1f28] opacity-60">
                 <Lock className="w-4 h-4 text-gray-600" />
               </div>
             </div>
          </div>

          {!legendary && sortedTrackers.length === 0 && (
            <div className="text-center py-20 opacity-60 flex flex-col items-center justify-center animate-fade-in-up">
              <Target className="w-16 h-16 mb-4 text-[#a855f7]/30" />
              <p className="font-primary tracking-widest text-[#a855f7]/80">NO ACTIVE MISSIONS</p>
              <Link to="/add-custom" className="mt-4 text-xs bg-[#15161e] border border-[#a855f7]/30 px-4 py-2 rounded text-white hover:bg-[#a855f7]/10 transition-colors">CREATE NEW MISSION</Link>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};
export default ActiveMissions;
\;
fs.writeFileSync('src/pages/Activemissions.jsx', content);
