import { useQuery } from "@apollo/client";
import { useState, useMemo } from "react";

import { GET_ALL_EQUIPMENT } from "../graphql/query";

import { useUserStore } from "../store/userStore";
import PropTypes from "prop-types";
import React from "react";
import AuthLayout from "../components/AuthLayout";
import SoloLoading from "../components/Loading"; // Assuming this is the correct import path
import axiosInstance from "../utils/axios";

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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6 text-white">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-red-500">
              Oops! Something Went Wrong
            </h1>
            <p className="text-purple-300">Error: {this.state.error.message}</p>
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
export const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: "bg-gradient-to-br from-gray-900 via-black to-gray-800",
    card: "bg-gradient-to-br from-gray-800 to-black",
    border: "border-purple-500/50",
    shadow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    title:
      "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500",
    accent: "text-purple-400",
    button:
      "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400",
    success: "bg-gradient-to-r from-green-600 to-emerald-600",
    error: "bg-gradient-to-r from-red-600 to-rose-600",
    text: "text-white",
    muted: "text-purple-300",
    loading: "text-purple-400",
  },
  animations: {
    fadeInUp: "animate-fade-in-up",
    pulse: "animate-pulse",
  },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  .hover-glow {
    transition: all 0.3s ease;
  }
  .hover-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
    border-color: rgba(139, 92, 246, 0.8);
  }
  .alert {
    animation: fadeInUp 0.3s ease-out;
  }
`;

/**
 * Dismissible Alert Component
 */
const Alert = ({ message, onDismiss }) => (
  <div
    role="alert"
    aria-live="polite"
    className={`p-4 rounded-md ${
      message.type === "success" ? theme.colors.success : theme.colors.error
    } ${theme.animations.fadeInUp} mb-4`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <div className="flex justify-between items-center">
      <span className={theme.colors.text}>{message.text}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="text-white ml-4"
      >
        ✕
      </button>
    </div>
  </div>
);

Alert.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.oneOf(["success", "error"]).isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const ITEMS_PER_PAGE = 9;

const rarityStyles = {
  legendary: "from-amber-600/30 to-yellow-700/10 border-amber-400/40",
  epic: "from-purple-600/30 to-fuchsia-700/10 border-purple-400/40",
  rare: "from-blue-600/30 to-cyan-700/10 border-blue-400/40",
  common: "from-gray-600/30 to-slate-700/10 border-gray-500/30",
};

const Inventory = () => {
  const { data, loading, error } = useQuery(GET_ALL_EQUIPMENT);
  const user = useUserStore((state) => state.user);
  const userOwned = (user?.equiments || []).map(e => typeof e === 'string' ? e : e.id);
  const userCoins = user?.coins || 0;

  const [selectedRarity, setSelectedRarity] = useState("All");
  const [filterOwned, setFilterOwned] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rarity");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null);

  // Filter by rarity and ownership
  const filtered = useMemo(() => {
    let result = data?.getAllEquipment || [];
    if (selectedRarity !== "All") result = result.filter(eq => eq.rarity === selectedRarity);
    if (filterOwned) result = result.filter(eq => userOwned.includes(eq.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(eq =>
        eq.name.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q)
      );
    }
    if (sort === "costAsc") result = [...result].sort((a,b)=>a.cost-b.cost);
    else if (sort === "costDesc") result = [...result].sort((a,b)=>b.cost-a.cost);
    else if (sort === "rarity") {
      const order = { legendary:1, epic:2, rare:3, common:4 };
      result = [...result].sort((a,b)=>(order[a.rarity]||9)-(order[b.rarity]||9));
    }
    return result;
  }, [selectedRarity, filterOwned, data, userOwned, search, sort]);

  const totalPages = useMemo(
    () => Math.ceil(filtered.length / ITEMS_PER_PAGE),
    [filtered.length]
  );
  const paginated = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const rarities = ["All", "legendary", "epic", "rare", "common"];

  const handleBuy = async (equipmentId, name, icon, desc, cost) => {
    if (userCoins < cost) {
      setMessage({ type: "error", text: "Not enough coins" });
      return;
    }
    try {
      const res = await axiosInstance.post("/inventory/buy", {
        equipmentId,
        price: cost,
      });

      if (res.data) {
        // Update coins from server (authoritative)
        useUserStore.getState().updateCoin(res.data.coins ?? (userCoins - cost));
        useUserStore.getState().updateBuy(equipmentId, name, icon, desc);

        // Apply stat bonuses to store from server response
        if (res.data.updatedStats) {
          const store = useUserStore.getState();
          for (const [stat, data] of Object.entries(res.data.updatedStats)) {
            if (stat !== '__typename' && data?.value !== undefined) {
              store.updateStats(stat, data.value, data.level);
            }
          }
        }

        const bonusText = res.data.appliedBonuses
          ? Object.entries(res.data.appliedBonuses)
              .filter(([k]) => k !== '__typename')
              .map(([k, v]) => `${k.toUpperCase()} +${v}`)
              .join(', ')
          : '';

        setMessage({ 
          type: "success", 
          text: bonusText ? `Purchase successful! ${bonusText}` : "Purchase successful!"
        });
      } else {
        setMessage({ type: "error", text: res.message || "Purchase failed" });
      }
    } catch (e) {
      console.error("Purchase error:", e);
      setMessage({ type: "error", text: e.response?.data?.error || "Server error" });
    }
  };

  const handleDismiss = () => setMessage(null);

  return (
    <ErrorBoundary>
      <AuthLayout>
        <SoloLoading loading={loading} message="Loading Gear Vault..." />
        {!loading && (
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

            <style>{styles}</style>
            <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 relative z-10 space-y-6">
              
              {/* Header Section */}
              <div className="mb-12 border-b border-white/5 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-[#a855f7] animate-ping rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    <h3 className="text-[#a855f7] text-xs font-black tracking-[0.4em] font-['Rajdhani'] uppercase">SYSTEM INTERFACE // GEAR VAULT</h3>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    INVENTORY
                  </h1>
                </div>
                
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-3 bg-black/40 border border-[#a855f7]/30 px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-sm">
                    <span className="text-yellow-400 text-2xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">🪙</span>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] text-white/50 font-black tracking-widest font-['Rajdhani']">AVAILABLE FUNDS</span>
                      <span className="text-2xl font-black font-['Rajdhani'] text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                        {userCoins.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {message && <Alert message={message} onDismiss={handleDismiss} />}
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
                    <h3 className="text-[10px] font-black mb-3 text-white/40 tracking-[0.2em] uppercase">Rarity Class</h3>
                    <div className="flex flex-wrap gap-2">
                      {rarities.map(r => (
                        <button
                          key={r}
                          onClick={() => { setSelectedRarity(r); setPage(1); }}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300
                            ${selectedRarity === r
                              ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                              : 'bg-black/40 text-white/50 border border-white/10 hover:bg-[#a855f7]/10 hover:text-white/80 hover:border-[#a855f7]/30'}
                          `}
                          aria-pressed={selectedRarity === r}
                        >{r}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black mb-3 text-white/40 tracking-[0.2em] uppercase">Ownership Status</h3>
                    <button
                      onClick={() => { setFilterOwned(f => !f); setPage(1);} }
                      className={`
                        w-full px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-between
                        ${filterOwned
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                          : 'bg-black/40 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80'}
                      `}
                      aria-pressed={filterOwned}
                    >
                      <span>Show Owned Only</span>
                      {filterOwned && <span className="text-green-400 text-lg leading-none">✓</span>}
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase block">Search Database</label>
                    <div className="relative">
                      <input 
                        value={search} 
                        onChange={e=>{ setSearch(e.target.value); setPage(1);} } 
                        placeholder="SEARCH KEYWORDS..." 
                        className="w-full bg-black/60 border border-white/10 rounded-md px-4 py-3 text-sm font-semibold tracking-wide text-white focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 placeholder:text-white/20 transition-all" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">⌕</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase block">Sort Parameters</label>
                    <select 
                      value={sort} 
                      onChange={e=>{ setSort(e.target.value); setPage(1);} } 
                      className="w-full bg-black/60 border border-white/10 rounded-md px-4 py-3 text-sm font-semibold tracking-wide text-white/80 focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="rarity">RARITY (LEGENDARY FIRST)</option>
                      <option value="costAsc">COST (LOWEST FIRST)</option>
                      <option value="costDesc">COST (HIGHEST FIRST)</option>
                    </select>
                  </div>
                  
                  <div className="pt-6 mt-4 border-t border-white/5">
                    <div className="flex items-start gap-3 bg-[#a855f7]/5 border border-[#a855f7]/20 p-3 rounded-lg">
                      <span className="text-[#a855f7] text-lg">ℹ</span>
                      <p className="text-[11px] text-white/50 tracking-wider">
                        <strong className="text-[#a855f7]/80 block mb-1">SYSTEM TIP:</strong>
                        Legendary artifacts provide the highest stat multipliers. Prioritize funds accordingly.
                      </p>
                    </div>
                  </div>
                </aside>
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  
                  {/* Results Header */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse"></div>
                      <span className="text-[11px] font-black tracking-[0.2em] text-white/50 uppercase">
                        DATABASE MATCHES: <span className="text-white/90">{filtered.length}</span> ARTIFACT{filtered.length !== 1 && 'S'}
                      </span>
                    </div>
                    <span className="text-[11px] font-black tracking-[0.2em] text-[#a855f7]/70 uppercase">PAGE {page} // {totalPages || 1}</span>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
                      <span className="text-4xl mb-4 opacity-50">⊘</span>
                      <p className="text-sm font-bold tracking-widest text-white/40 uppercase">NO ARTIFACTS MATCH CURRENT PARAMETERS.</p>
                      <button onClick={() => { setSearch(''); setSelectedRarity('All'); setFilterOwned(false); }} className="mt-4 text-xs text-[#a855f7] hover:text-pink-400 font-bold uppercase tracking-widest border-b border-[#a855f7]/30 pb-0.5">Reset Filters</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginated.map(equipment => {
                        const owned = userOwned.some(eid => String(eid) === String(equipment.id));
                        const canBuy = Number(userCoins) >= Number(equipment.cost) && !owned;
                        const bonuses = equipment.statBonuses || {};
                        const STAT_KEYS = ['strength', 'agility', 'intelligence', 'endurance'];
                        const activeStats = STAT_KEYS.filter(k => bonuses[k] && bonuses[k] !== 0).map(k => [k, bonuses[k]]);
                        const effectDesc = equipment.effect?.description;
                        const typeIcon = { weapon: '⚔️', armor: '🛡️', accessory: '💍' }[equipment.type] || '📦';
                        
                        const rarityGlow = {
                          legendary: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] border-amber-500/30 hover:border-amber-400/60',
                          epic: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] border-purple-500/30 hover:border-purple-400/60',
                          rare: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-500/30 hover:border-blue-400/60',
                          common: 'shadow-[0_0_20px_rgba(156,163,175,0.1)] hover:shadow-[0_0_30px_rgba(156,163,175,0.2)] border-gray-500/30 hover:border-gray-400/50',
                        };

                        const rarityBg = {
                          legendary: 'from-amber-950/40 to-black',
                          epic: 'from-purple-950/40 to-black',
                          rare: 'from-blue-950/40 to-black',
                          common: 'from-gray-900/40 to-black',
                        };

                        const rarityDot = {
                          legendary: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]', 
                          epic: 'bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.8)]', 
                          rare: 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]', 
                          common: 'bg-gray-400 shadow-[0_0_5px_rgba(156,163,175,0.8)]',
                        };

                        return (
                          <div key={equipment.id} className={
                            `group relative rounded-2xl overflow-hidden border backdrop-blur-xl bg-gradient-to-br ${rarityBg[equipment.rarity]} transition-all duration-500 ${rarityGlow[equipment.rarity]} flex flex-col justify-between`
                          }>
                            {/* Inner Glow Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-0" />

                            <div className="relative z-10 flex flex-col h-full">
                              {/* Top section: image + info */}
                              <div className="p-5 pb-3">
                                <div className="flex gap-4 items-start">
                                  <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-white/5 rounded-xl blur-md" />
                                    <img src={`/pic/arti/${equipment.icon}`} alt={equipment.name} className="relative w-16 h-16 rounded-xl border border-white/10 object-contain bg-black/60 p-2 shadow-inner" />
                                    {owned && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[12px] text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.8)] border-2 border-black z-20">✓</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${rarityDot[equipment.rarity]}`} />
                                      <span className="text-[9px] font-black text-white/50 tracking-[0.2em] uppercase">{equipment.rarity} {equipment.type}</span>
                                    </div>
                                    <h3 
                                      className="text-sm font-black tracking-widest uppercase text-white leading-tight font-['Exo_2'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                      title={equipment.name}
                                    >
                                      {equipment.name}
                                    </h3>
                                  </div>
                                </div>
                                
                                <p className="text-[11px] text-white/40 mt-3 leading-relaxed font-semibold tracking-wide line-clamp-2 h-[34px]">
                                  {equipment.description}
                                </p>
                              </div>

                              {/* Stats + Effect section */}
                              <div className="px-5 pb-4 space-y-3 flex-1 flex flex-col justify-end">
                                {activeStats.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {activeStats.map(([stat, val]) => {
                                      const cfg = {
                                        strength:     { label: 'STR', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                                        agility:      { label: 'AGI', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                                        intelligence: { label: 'INT', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                        endurance:    { label: 'END', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                      };
                                      const { label, color, bg, border } = cfg[stat] || { label: stat.toUpperCase(), color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
                                      return (
                                        <div key={stat} className={`flex items-center gap-1.5 ${bg} border ${border} px-2 py-1 rounded shadow-inner`}>
                                          <span className={`text-[10px] font-black tracking-widest ${color}`}>{label}</span>
                                          <span className="text-[10px] font-black text-white">{val > 0 ? `+${val}` : val}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {effectDesc && effectDesc !== 'None' && (
                                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]">
                                    <span className="text-[12px] mt-0.5">✨</span>
                                    <span className="text-[11px] text-cyan-200/90 font-bold tracking-wide leading-tight">{effectDesc}</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer: price + action */}
                              <div className="p-5 pt-3 border-t border-white/5 bg-black/40 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">🪙</span>
                                  <span className="text-lg text-yellow-400 font-black font-['Exo_2']">{equipment.cost.toLocaleString()}</span>
                                </div>
                                <button
                                  disabled={!canBuy}
                                  onClick={() => handleBuy(equipment.id, equipment.name, equipment.icon, equipment.description, equipment.cost)}
                                  className={`
                                    px-6 py-2 rounded-lg text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300
                                    ${owned
                                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                                      : canBuy
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-105'
                                        : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}
                                  `}
                                >
                                  {owned ? 'ACQUIRED' : 'PURCHASE'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filtered.length > 0 && (
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
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthLayout>
    </ErrorBoundary>
  );
};

export default Inventory;
