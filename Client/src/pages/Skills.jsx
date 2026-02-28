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
  legendary: "from-yellow-500/30 to-amber-600/10 border-yellow-400/40",
  epic: "from-purple-600/30 to-fuchsia-700/10 border-purple-400/40",
  rare: "from-blue-600/30 to-cyan-700/10 border-blue-400/40",
  common: "from-gray-600/30 to-slate-700/10 border-gray-400/30",
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
    E: { color: 'text-gray-400', glow: 'shadow-gray-500/20 hover:shadow-gray-400/30', dot: 'bg-gray-400' },
    D: { color: 'text-green-400', glow: 'shadow-green-500/20 hover:shadow-green-400/30', dot: 'bg-green-400' },
    C: { color: 'text-blue-400', glow: 'shadow-blue-500/20 hover:shadow-blue-400/30', dot: 'bg-blue-400' },
    B: { color: 'text-purple-400', glow: 'shadow-purple-500/20 hover:shadow-purple-400/30', dot: 'bg-purple-400' },
    A: { color: 'text-amber-400', glow: 'shadow-amber-500/30 hover:shadow-amber-400/50', dot: 'bg-amber-400' },
    S: { color: 'text-red-400', glow: 'shadow-red-500/30 hover:shadow-red-400/50', dot: 'bg-red-400' },
  };
  const rc = rankCfg[skill.rank] || rankCfg.E;

  return (
    <div className={cn(
      "group relative rounded-2xl overflow-hidden border backdrop-blur-md bg-gradient-to-br transition-all duration-300 shadow-lg hover:scale-[1.02]",
      rarityAccent[skill.rank?.toLowerCase()] || "from-[#141823] to-[#10141d] border-purple-500/30",
      rc.glow,
      isUnlocked && "ring-1 ring-green-400/40"
    )} style={{ fontFamily: theme.fonts.primary }}>

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex gap-3">
          <div className="relative shrink-0">
            <img src={`/pic/skill/${skill.icon}`} alt={skill.name} className={cn("w-16 h-16 rounded-lg border-2 object-contain bg-black/30 p-1", isUnlocked ? "border-green-400/40" : "border-white/10")} />
            {isUnlocked && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg">✓</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold tracking-wider uppercase text-white/95 leading-tight">{skill.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
              <span className={`text-[10px] font-bold ${rc.color}`}>Rank {skill.rank}</span>
              <span className="text-[10px] text-white/30">·</span>
              <span className="text-[10px] text-white/40">Lvl {skill.minLevel}+</span>
            </div>
            <p className="text-[10px] text-white/35 mt-1 leading-relaxed line-clamp-2">{skill.description}</p>
          </div>
        </div>
      </div>

      {/* Requirements + Effect */}
      <div className="px-4 pb-2 space-y-2">
        {/* Stat requirements */}
        <div className="flex flex-wrap gap-1">
          {skill.statRequired.map(req => {
            const met = (userStats?.[req.stat]?.level || 0) >= req.value;
            return (
              <span key={req.stat} className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded capitalize ${
                met ? 'text-green-400/90 bg-green-500/10' : 'text-red-400/80 bg-red-500/10'
              }`}>
                {req.stat} {(userStats?.[req.stat]?.level || 0)}/{req.value}
              </span>
            );
          })}
        </div>

        {/* Effect */}
        {skill.effect?.type && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-400/5 border border-cyan-500/15">
            <span className="text-[10px] text-cyan-300/90 font-medium">
              {effectLabels[skill.effect.type] || skill.effect.type}
            </span>
            <span className="text-[10px] text-cyan-200/60 capitalize">
              {skill.effect.stat === 'all' ? 'All Stats' : skill.effect.stat}
            </span>
            <span className="ml-auto text-[10px] text-cyan-200 font-bold">+{Math.round((skill.effect.value - 1) * 100)}%</span>
          </div>
        )}
      </div>

      {/* Progress + Button */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <button
          disabled={(isUnlocked || !unlockable) || loadingSkillId === skill.id}
          onClick={() => onUnlock && onUnlock(skill.id, skill.name, skill.icon, skill.description)}
          className={cn(
            "w-full py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all duration-200",
            isUnlocked
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
              : unlockable
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10',
            loadingSkillId === skill.id && "opacity-80"
          )}
        >
          {loadingSkillId === skill.id
            ? <span className="flex items-center justify-center gap-2"><span className="loader w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />Obtaining...</span>
            : isUnlocked ? '✓ Unlocked' : unlockable ? 'Obtain' : 'Locked'}
        </button>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Grid
// --------------------------------------------------

const SkillGrid = ({ skills, userStats, unlockedSkills, onUnlock, loadingSkillId }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {skills.map(skill => (
        <SkillCard key={skill.id} skill={skill} userStats={userStats} unlockedSkills={unlockedSkills} onUnlock={onUnlock} loadingSkillId={loadingSkillId} />
      ))}
    </div>
  );
};

// --------------------------------------------------
// Main Page
// --------------------------------------------------
const SkillsPage = () => {
  const { data: skillData, loading: loadingSkills } = useQuery(getAllSkills);
  const userData = useUserStore(state => state.user);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [message, setMessage] = useState(null);
  const [loadingSkillId, setLoadingSkillId] = useState(null);

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
          <div className="min-h-screen px-8 py-10 text-white bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 right-32 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full" />
              <div className="absolute bottom-24 left-20 w-72 h-72 bg-pink-600/20 blur-3xl rounded-full" />
            </div>
            <style>{styles}</style>
            <div className="w-full mx-auto space-y-6">
              <div className="text-center mb-2">
                <h1 className={`${theme.colors.title} text-4xl font-bold mb-2`} style={{ fontFamily: theme.fonts.primary }}>SKILL FORGE</h1>
                <p className="text-purple-300 text-sm md:text-base font-semibold tracking-wide" style={{ fontFamily: theme.fonts.primary }}>Master your path! Unlock powerful skills by meeting stat thresholds and organize your arsenal.</p>
              </div>
              {message && <Alert message={message} onDismiss={() => setMessage(null)} />}
              <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-64 space-y-5 bg-[#141823]/60 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm h-fit">
                  <div>
                    <h2 className="text-sm font-semibold mb-2 text-purple-200 tracking-wide">Filters</h2>
                    <div className="flex flex-wrap gap-2">
                      {["all", "unlocked", "locked"].map(type => (
                        <button key={type} onClick={() => setFilter(type)} aria-label={`Filter ${type}`} aria-pressed={filter === type} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition", filter === type ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow" : "bg-gray-700/60 text-purple-300 hover:bg-gray-600/60")}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Search</label>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills..." className="w-full bg-[#0f141d] border border-purple-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Sort By</label>
                    <select value={sort} onChange={e => setSort(e.target.value)} className="w-full bg-[#0f141d] border border-purple-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50">
                      <option value="name">Name (A-Z)</option>
                      <option value="rank">Rank</option>
                      <option value="minLevel">Min Level</option>
                    </select>
                  </div>
                  <div className="pt-2 border-t border-purple-500/10 text-[11px] text-purple-300/70 leading-relaxed">
                    <p>Tip: Meet all stat requirements to unlock. Unlocked skills show a green ✓.</p>
                  </div>
                </aside>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between text-xs text-purple-300/70">
                    <span>{filteredSkills.length} skill{filteredSkills.length !== 1 && 's'} found</span>
                  </div>
                  {filteredSkills.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-purple-500/30 rounded-xl bg-[#141823]/40">
                      <p className="text-sm text-purple-300">No skills match your filters.</p>
                    </div>
                  ) : (
                    <SkillGrid skills={filteredSkills} userStats={userStats} unlockedSkills={unlockedSkillIds} onUnlock={handleUnlock} loadingSkillId={loadingSkillId} />
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
