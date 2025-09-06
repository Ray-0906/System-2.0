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

const ITEMS_PER_PAGE = 12;

const rarityStyles = {
  legendary: "from-amber-600/30 to-yellow-700/10 border-amber-400/40",
  epic: "from-purple-600/30 to-fuchsia-700/10 border-purple-400/40",
  rare: "from-blue-600/30 to-cyan-700/10 border-blue-400/40",
  common: "from-gray-600/30 to-slate-700/10 border-gray-500/30",
};

const Inventory = () => {
  const { data, loading, error } = useQuery(GET_ALL_EQUIPMENT);
  const user = useUserStore((state) => state.user);
  const userOwned = user?.equipment || [];
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
        useUserStore.getState().updateCoin(userCoins - cost);
        useUserStore.getState().updateBuy(equipmentId, name, icon, desc);

        setMessage({ type: "success", text: "Purchase successful!" });
      } else {
        setMessage({ type: "error", text: res.message || "Purchase failed" });
      }
    } catch (e) {
      console.error("Purchase error:", e);
      setMessage({ type: "error", text: "Server error" });
    }
  };

  const handleDismiss = () => setMessage(null);

  return (
    <ErrorBoundary>
      <AuthLayout>
        <SoloLoading loading={loading} message="Loading Gear Vault..." />
        {!loading && (
          <div className={`min-h-screen px-6 py-10 ${theme.colors.text} bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden`}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 right-32 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full" />
              <div className="absolute bottom-24 left-20 w-72 h-72 bg-pink-600/20 blur-3xl rounded-full" />
            </div>
            <style>{styles}</style>
            <div className="w-full mx-auto max-w-screen-lg space-y-6">
              <div className="text-center mb-6">
                <h1
                  className={`${theme.colors.title} text-4xl font-bold mb-2 text-glow`}
                  style={{
                    fontFamily: theme.fonts.primary,
                    textShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
                  }}
                >
                  GEAR VAULT
                </h1>
                <p
                  className={`${theme.colors.accent} text-lg font-semibold tracking-wide mb-2`}
                  style={{ fontFamily: theme.fonts.primary }}
                >
                  Arm yourself for glory! Explore and acquire legendary gear,
                  filtered by rarity, to enhance your questing prowess.
                </p>

                <div className="inline-flex items-center justify-center gap-2 bg-gray-800 border border-yellow-400/40 px-4 py-2 rounded-full shadow-lg mx-auto w-fit">
                  <span className="text-yellow-300 text-lg">🪙</span>
                  <span
                    className="text-yellow-400 font-semibold tracking-wider"
                    style={{ fontFamily: theme.fonts.primary }}
                  >
                    {userCoins} Coins
                  </span>
                </div>
              </div>

              {message && <Alert message={message} onDismiss={handleDismiss} />}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="lg:w-64 space-y-6 bg-[#141823]/60 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm h-fit">
                  <div>
                    <h2 className="text-sm font-semibold mb-2 text-purple-200 tracking-wide">Rarity</h2>
                    <div className="flex flex-wrap gap-2">
                      {rarities.map(r => (
                        <button
                          key={r}
                          onClick={() => { setSelectedRarity(r); setPage(1); }}
                          className={
                            `px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedRarity === r
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow'
                              : 'bg-gray-700/60 text-purple-300 hover:bg-gray-600/60'}`}
                          aria-pressed={selectedRarity === r}
                        >{r}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold mb-2 text-purple-200 tracking-wide">Ownership</h2>
                    <button
                      onClick={() => { setFilterOwned(f => !f); setPage(1);} }
                      className={
                        `w-full px-3 py-2 rounded-md text-xs font-medium transition ${filterOwned
                          ? 'bg-green-600/80 text-white'
                          : 'bg-gray-700/60 text-purple-300 hover:bg-gray-600/60'}`}
                      aria-pressed={filterOwned}
                    >{filterOwned ? 'Filtering Owned' : 'Show Owned Only'}</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Search</label>
                    <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1);} } placeholder="Search gear..." className="w-full bg-[#0f141d] border border-purple-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Sort By</label>
                    <select value={sort} onChange={e=>{ setSort(e.target.value); setPage(1);} } className="w-full bg-[#0f141d] border border-purple-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50">
                      <option value="rarity">Rarity</option>
                      <option value="costAsc">Cost (Low-High)</option>
                      <option value="costDesc">Cost (High-Low)</option>
                    </select>
                  </div>
                  <div className="pt-2 border-t border-purple-500/10 text-[11px] text-purple-300/70 leading-relaxed">
                    <p>Tip: Legendary gear offers best multipliers. Save coins strategically.</p>
                  </div>
                </aside>
                {/* Main Content */}
                <div className="flex-1 space-y-5">
                  <div className="flex items-center justify-between text-xs text-purple-300/70">
                    <span>{filtered.length} item{filtered.length !== 1 && 's'} found</span>
                    <span>Page {page} / {totalPages || 1}</span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-purple-500/30 rounded-xl bg-[#141823]/40">
                      <p className="text-sm text-purple-300">No equipment matches your filters.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {paginated.map(equipment => {
                        const owned = userOwned.some(eid => String(eid) === String(equipment.id));
                        const canBuy = Number(userCoins) >= Number(equipment.cost) && !owned;
                        return (
                          <div key={equipment.id} className={
                            `relative rounded-xl p-4 flex flex-col border backdrop-blur-sm bg-gradient-to-br ${rarityStyles[equipment.rarity] || 'from-[#1a1e2a] to-[#0f141f] border-purple-500/30'} transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20`
                          }>
                            <div className="flex items-start gap-3">
                              <img src={`/pic/arti/${equipment.icon}`} alt={equipment.name} className="w-14 h-14 rounded-md border object-contain border-gray-600/60" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold tracking-wide uppercase line-clamp-1">{equipment.name}</h3>
                                <p className="text-[10px] text-purple-200/70 mt-1 line-clamp-2">{equipment.description}</p>
                              </div>
                            </div>
                            <div className="mt-3 mb-2 flex items-center justify-between text-[11px] text-purple-300/70">
                              <span className="capitalize">{equipment.rarity}</span>
                              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">🪙 {equipment.cost}</span>
                            </div>
                            <button
                              disabled={!canBuy}
                              onClick={() => handleBuy(equipment.id, equipment.name, equipment.icon, equipment.description, equipment.cost)}
                              className={`w-full py-1.5 rounded-md text-[11px] font-semibold tracking-wide flex items-center justify-center transition ${owned
                                ? 'bg-green-600/70 text-white cursor-default'
                                : canBuy
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white'
                                  : 'bg-gray-700/70 text-gray-400 cursor-not-allowed'}`}
                              aria-label={owned ? 'Owned' : canBuy ? `Buy for ${equipment.cost} coins` : 'Cannot buy'}
                              aria-disabled={!canBuy}
                            >
                              {owned ? 'Owned' : `Buy`}
                            </button>
                            {owned && <span className="absolute -top-1 -right-1 bg-green-600/80 text-white text-[10px] px-1.5 py-0.5 rounded-md">OWNED</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {filtered.length > 0 && (
                    <div className="flex justify-center items-center gap-4 pt-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded-md text-xs font-medium transition ${page === 1 ? 'bg-gray-700/60 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400'}`}>Prev</button>
                      <div className="text-[11px] text-purple-300/70">Page {page} of {totalPages || 1}</div>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages===0} className={`px-3 py-1 rounded-md text-xs font-medium transition ${(page === totalPages || totalPages===0) ? 'bg-gray-700/60 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400'}`}>Next</button>
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
