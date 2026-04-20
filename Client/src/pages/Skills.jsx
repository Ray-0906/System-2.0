import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { getAllSkills } from "../graphql/query";
import { useUserStore } from "../store/userStore";
import { cn } from "../utils/cn";
import AuthLayout from "../components/AuthLayout";
import SoloLoading from "../components/Loading";
import axiosInstance from "../utils/axios";

// --------------------------------------------------
// Error Boundary
// --------------------------------------------------
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  handleRetry = () => this.setState({ hasError: false, error: null });
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6 text-white">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Oops! Something Went Wrong</h1>
            <p className="text-purple-300">Error: {this.state.error?.message}</p>
            <button onClick={this.handleRetry} className="px-8 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-500 hover:to-pink-400 transition-all">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --------------------------------------------------
// Alert
// --------------------------------------------------
const Alert = ({ message, onDismiss }) => (
  <div role="alert" aria-live="polite" className="p-4 rounded-md bg-gradient-to-r from-red-600 to-rose-600 animate-fade-in-up mb-4">
    <div className="flex justify-between items-center">
      <span className="text-white text-sm font-medium">{message.text}</span>
      <button onClick={onDismiss} aria-label="Dismiss alert" className="text-white ml-4">✕</button>
    </div>
  </div>
);

// --------------------------------------------------
// Theme + Styles
// --------------------------------------------------
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    text: "text-white",
    title: "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500",
  }
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px);} to { opacity:1; transform:translateY(0);} }
  .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
  .loader { border-radius: 50%; display:inline-block; border:2px solid rgba(255,255,255,0.5); border-top-color:white; animation:spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// --------------------------------------------------
// Rarity Accent Mapping
// --------------------------------------------------
const rarityAccent = {
  legendary: "from-amber-950/40 to-black border-amber-500/30 hover:border-amber-400/60",
  epic: "from-purple-950/40 to-black border-purple-500/30 hover:border-purple-400/60",
  rare: "from-blue-950/40 to-black border-blue-500/30 hover:border-blue-400/60",
  common: "from-gray-900/40 to-black border-gray-500/30 hover:border-gray-400/50",
};

// --------------------------------------------------
// Skill Card
// --------------------------------------------------
const SkillCard = ({ skill, userStats = {}, unlockedSkills = [], onUnlock, loadingSkillId }) => {
  const isUnlocked = unlockedSkills.includes(skill.id);
  const totalRequired = skill.statRequired.length;
  const fulfilled = skill.statRequired.filter(req => (userStats?.[req.stat]?.level || 0) >= req.value).length;
  const progressPercent = Math.round((fulfilled / totalRequired) * 100);
  const unlockable = !isUnlocked && progressPercent === 100;

  const effectLabels = {
    xp_multiplier: '⚡ XP Boost',
    coin_multiplier: '🪙 Coin Boost',
    stat_bonus: '📈 Stat Boost',
  };

  const rankCfg = {
    E: { color: 'text-gray-400', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.1)] hover:shadow-[0_0_30px_rgba(156,163,175,0.2)]', dot: 'bg-gray-400 shadow-[0_0_5px_rgba(156,163,175,0.8)]' },
    D: { color: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]', dot: 'bg-green-400 shadow-[0_0_5px_rgba(34,197,94,0.8)]' },
    C: { color: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]', dot: 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]' },
    B: { color: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]', dot: 'bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.8)]' },
    A: { color: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]', dot: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' },
    S: { color: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]', dot: 'bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)]' },
  };
  const rc = rankCfg[skill.rank] || rankCfg.E;

  return (
    <div className={cn(
      "group relative rounded-2xl overflow-hidden border backdrop-blur-xl bg-gradient-to-br transition-all duration-500 flex flex-col justify-between",
      rarityAccent[skill.rank?.toLowerCase()] || rarityAccent.common,
      rc.glow,
      isUnlocked && "ring-1 ring-green-400/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
    )} style={{ fontFamily: theme.fonts.primary }}>
      {/* Inner Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex gap-4 items-start">
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-white/5 rounded-xl blur-md" />
              <img src={`/pic/skill/${skill.icon}`} alt={skill.name} className={cn("relative w-16 h-16 rounded-xl border object-contain bg-black/60 p-2 shadow-inner", isUnlocked ? "border-green-400/40" : "border-white/10")} />
              {isUnlocked && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[12px] text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.8)] border-2 border-black z-20">✓</div>}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${rc.color}`}>Rank {skill.rank}</span>
                <span className="text-[10px] text-white/30">·</span>
                <span className="text-[9px] font-black tracking-widest text-[#a855f7] uppercase">Lvl {skill.minLevel}+</span>
              </div>
              <h3 className="text-sm font-black tracking-widest uppercase text-white leading-tight font-['Exo_2'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title={skill.name}>{skill.name}</h3>
            </div>
          </div>
          <p className="text-[11px] text-white/40 mt-3 leading-relaxed font-semibold tracking-wide line-clamp-2 h-[34px]">{skill.description}</p>
        </div>

        {/* Requirements + Effect */}
        <div className="px-5 pb-4 space-y-3 flex-1 flex flex-col justify-end">
          {/* Stat requirements */}
          <div className="flex flex-wrap gap-2">
            {skill.statRequired.map(req => {
              const met = (userStats?.[req.stat]?.level || 0) >= req.value;
              return (
                <div key={req.stat} className={`flex items-center gap-1.5 px-2 py-1 rounded shadow-inner border ${
                  met ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <span className={`text-[10px] font-black tracking-widest uppercase ${met ? 'text-green-400' : 'text-red-400'}`}>
                    {req.stat.substring(0,3)}
                  </span>
                  <span className="text-[10px] font-black text-white">
                    {(userStats?.[req.stat]?.level || 0)}/{req.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Effect */}
          {skill.effect?.type && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]">
              <span className="text-[12px] mt-0.5">✨</span>
              <span className="text-[11px] text-cyan-200/90 font-bold tracking-wide leading-tight">
                {effectLabels[skill.effect.type] || skill.effect.type} : {skill.effect.stat === 'all' ? 'All Stats' : skill.effect.stat} +{Math.round((skill.effect.value - 1) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress + Button */}
        <div className="p-5 pt-3 border-t border-white/5 bg-black/40 flex flex-col gap-3 mt-auto">
          {!isUnlocked && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <button
            disabled={(isUnlocked || !unlockable) || loadingSkillId === skill.id}
            onClick={() => onUnlock && onUnlock(skill.id, skill.name, skill.icon, skill.description)}
            className={cn(
              "w-full py-2.5 rounded-lg text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300",
              isUnlocked
                ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                : unlockable
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10',
              loadingSkillId === skill.id && "opacity-80"
            )}
          >
            {loadingSkillId === skill.id
              ? <span className="flex items-center justify-center gap-2">Obtaining...</span>
              : isUnlocked ? '✓ ACQUIRED' : unlockable ? 'OBTAIN SKILL' : 'LOCKED'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Grid
// --------------------------------------------------

const SkillGrid = ({ skills, userStats, unlockedSkills, onUnlock, loadingSkillId }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map(skill => (
        <SkillCard key={skill.id} skill={skill} userStats={userStats} unlockedSkills={unlockedSkills} onUnlock={onUnlock} loadingSkillId={loadingSkillId} />
      ))}
    </div>
  );
};

// --------------------------------------------------
// Main Page
// --------------------------------------------------
const ITEMS_PER_PAGE = 9;

const SkillsPage = () => {
  const { data: skillData, loading: loadingSkills } = useQuery(getAllSkills);
  const userData = useUserStore(state => state.user);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [message, setMessage] = useState(null);
  const [loadingSkillId, setLoadingSkillId] = useState(null);
  const [page, setPage] = useState(1);

  const skills = skillData?.getAllSkills || [];
  const userStats = userData?.stats ?? {};
  const unlockedSkillIds = (userData?.skills || []).map(s => s.id);

  const filteredSkills = useMemo(() => {
    let result = skills;
    if (filter === "unlocked") result = result.filter(s => unlockedSkillIds.includes(s.id));
    else if (filter === "locked") result = result.filter(s => !unlockedSkillIds.includes(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (sort === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "rank") result = [...result].sort((a, b) => a.rank.localeCompare(b.rank));
    else if (sort === "minLevel") result = [...result].sort((a, b) => a.minLevel - b.minLevel);
    return result;
  }, [skills, filter, unlockedSkillIds, search, sort]);

  const totalPages = Math.ceil(filteredSkills.length / ITEMS_PER_PAGE);
  const paginatedSkills = filteredSkills.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleUnlock = async (skillId, name, icon, desc) => {
    setLoadingSkillId(skillId);
    try {
      const res = await axiosInstance.post(`/skill/unlock`, { skillId });
      if (res?.data) {
        useUserStore.getState().unlockSkill(skillId, name, icon, desc);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to unlock skill" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error" });
    } finally { setLoadingSkillId(null); }
  };

  return (
    <ErrorBoundary>
      <AuthLayout>
        <SoloLoading loading={loadingSkills} message="Loading Skill Forge..." />
        {!loadingSkills && (
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
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

            <style>{styles}</style>
            <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 relative z-10 space-y-6">
              
              {/* Header Section */}
              <div className="mb-12 border-b border-white/5 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-[#a855f7] animate-ping rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    <h3 className="text-[#a855f7] text-xs font-black tracking-[0.4em] font-['Rajdhani'] uppercase">SYSTEM INTERFACE // SKILL FORGE</h3>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    SKILL FORGE
                  </h1>
                </div>
                
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-4 bg-black/40 border border-[#a855f7]/30 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-sm">
                    <span className="text-white text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">🌟</span>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] text-white/50 font-black tracking-widest font-['Rajdhani']">UNLOCKED SKILLS</span>
                      <span className="text-2xl font-black font-['Rajdhani'] text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                        {unlockedSkillIds.length} <span className="text-sm text-white/40">/ {skills.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {message && <Alert message={message} onDismiss={() => setMessage(null)} />}
              
              <div className="flex flex-col lg:flex-row gap-8 relative z-10 font-['Rajdhani']">
                {/* Sidebar Container */}
                <aside className="lg:w-72 shrink-0 space-y-6 bg-[#0a0a0f]/80 border border-[#a855f7]/20 rounded-xl p-5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] h-fit relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                    <span className="text-[#a855f7] text-lg">⧗</span>
                    <h2 className="text-xl font-bold tracking-widest text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] uppercase">
                      SORT & FILTER
                    </h2>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black mb-3 text-white/40 tracking-[0.2em] uppercase">Skill Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {["all", "unlocked", "locked"].map(type => (
                        <button 
                          key={type} 
                          onClick={() => { setFilter(type); setPage(1); }} 
                          aria-pressed={filter === type} 
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-1 min-w-[70px]
                            ${filter === type
                              ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                              : 'bg-black/40 text-white/50 border border-white/10 hover:bg-[#a855f7]/10 hover:text-white/80 hover:border-[#a855f7]/30'}
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase block">Search Database</label>
                    <div className="relative">
                      <input 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                        placeholder="SEARCH SKILLS..." 
                        className="w-full bg-black/60 border border-white/10 rounded-md px-4 py-3 text-sm font-semibold tracking-wide text-white focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 placeholder:text-white/20 transition-all" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">⌕</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase block">Sort Parameters</label>
                    <select 
                      value={sort} 
                      onChange={e => { setSort(e.target.value); setPage(1); }} 
                      className="w-full bg-black/60 border border-white/10 rounded-md px-4 py-3 text-sm font-semibold tracking-wide text-white/80 focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="name">NAME (A-Z)</option>
                      <option value="rank">RANK (S TO E)</option>
                      <option value="minLevel">MIN LEVEL REQ.</option>
                    </select>
                  </div>
                  
                  <div className="pt-6 mt-4 border-t border-white/5">
                    <div className="flex items-start gap-3 bg-[#a855f7]/5 border border-[#a855f7]/20 p-3 rounded-lg">
                      <span className="text-[#a855f7] text-lg">ℹ</span>
                      <p className="text-[11px] text-white/50 tracking-wider">
                        <strong className="text-[#a855f7]/80 block mb-1">SYSTEM TIP:</strong>
                        Meet all stat thresholds for a specific skill to unlock its ability.
                      </p>
                    </div>
                  </div>
                </aside>

                <div className="flex-1 space-y-6">
                  {/* Results Header */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse"></div>
                      <span className="text-[11px] font-black tracking-[0.2em] text-white/50 uppercase">
                        DATABASE MATCHES: <span className="text-white/90">{filteredSkills.length}</span> SKILL{filteredSkills.length !== 1 && 'S'}
                      </span>
                    </div>
                    <span className="text-[11px] font-black tracking-[0.2em] text-[#a855f7]/70 uppercase">PAGE {page} // {totalPages || 1}</span>
                  </div>

                  {filteredSkills.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
                      <span className="text-4xl mb-4 opacity-50">⊘</span>
                      <p className="text-sm font-bold tracking-widest text-white/40 uppercase">NO SKILLS MATCH CURRENT PARAMETERS.</p>
                      <button onClick={() => { setSearch(''); setFilter('all'); setPage(1); }} className="mt-4 text-xs text-[#a855f7] hover:text-pink-400 font-bold uppercase tracking-widest border-b border-[#a855f7]/30 pb-0.5">Reset Filters</button>
                    </div>
                  ) : (
                    <>
                      <SkillGrid skills={paginatedSkills} userStats={userStats} unlockedSkills={unlockedSkillIds} onUnlock={handleUnlock} loadingSkillId={loadingSkillId} />
                      
                      {filteredSkills.length > 0 && (
                        <div className="flex justify-center items-center gap-6 pt-6 pb-4">
                          <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1} 
                            className={`px-5 py-2.5 rounded-lg text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${page === 1 ? 'bg-black/40 text-white/20 cursor-not-allowed border border-white/5' : 'bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/40 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'}`}
                          >
                            « PREV
                          </button>
                          
                          <div className="flex items-center gap-3">
                            {[...Array(totalPages || 1)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${(i+1) === page ? 'bg-[#a855f7] scale-150 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-white/20'}`} 
                              />
                            ))}
                          </div>

                          <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages || totalPages===0} 
                            className={`px-5 py-2.5 rounded-lg text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${(page === totalPages || totalPages===0) ? 'bg-black/40 text-white/20 cursor-not-allowed border border-white/5' : 'bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/40 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'}`}
                          >
                            NEXT »
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthLayout>
    </ErrorBoundary>
  );
};

export default SkillsPage;
