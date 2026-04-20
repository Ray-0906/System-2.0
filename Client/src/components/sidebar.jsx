
import { useState, memo, useCallback } from "react";
import { Menu, X, LogOut, Home, Compass, PlusSquare, BarChart, Package, Sparkles, Trophy, Swords } from "lucide-react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";

import axiosInstance, { performClientLogout } from "../utils/axios";
import { useUserStore } from '../store/userStore';
import { useTrackerStore } from '../store/trackerStore';

// --- Error Boundary Component (Good Practice) ---
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Sidebar Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
          <div className="text-center space-y-4 p-4">
            <h1 className="text-2xl font-bold text-red-400">Sidebar Error</h1>
            <p className="text-purple-300">
              Something went wrong: {this.state.error?.message || 'An unknown error occurred'}
            </p>
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

// --- Sub-Components for Better Structure ---

const NavLinks = memo(({ user, onLinkClick, onLogout, isLoggingOut, error }) => {
  const location = useLocation();
  const current = location.pathname;
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/missions", label: "Missions", icon: Compass },
    { to: "/add-mission", label: "Add Mission", icon: PlusSquare },
    { to: "/report", label: "Ascension Room", icon: BarChart },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/skills", label: "Skills", icon: Sparkles },
    { to: "/sidequests", label: "Sidequests", icon: Swords },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.nav
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full"
    >
      <div className="flex-grow space-y-2">
        {user ? (
          navItems.map((item) => {
            const active = current.startsWith(item.to);
            return (
              <motion.div key={item.to} variants={itemVariants}>
                <Link
                  to={item.to}
                  onClick={onLinkClick}
                  className={
                    `group flex items-center gap-4 text-[13px] font-bold tracking-[0.2em] uppercase px-4 py-3 border-l-2 transition-all duration-300 relative overflow-hidden ` +
                    (active
                      ? 'border-[#3b82f6] bg-[#3b82f6]/5 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]')
                  }
                >
                  <div className={"relative z-10 transition-colors " + (active ? 'text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'group-hover:text-gray-300 group-hover:scale-110')}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="relative z-10 truncate">{item.label}</span>
                  {active && <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/10 to-transparent pointer-events-none" />}
                </Link>
              </motion.div>
            );
          })
        ) : (
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              onClick={onLinkClick}
              className="block text-center w-full py-3 px-4 text-xs font-bold tracking-[0.2em] border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/10 transition-colors uppercase"
            >
              ACCESS SYSTEM
            </Link>
          </motion.div>
        )}
      </div>
  {/* Sidequests now included in main nav list above */}
      
      {user && (
        <motion.div variants={itemVariants} className="mt-8">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 text-xs tracking-[0.2em] font-bold border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{isLoggingOut ? "DISCONNECTING..." : "DISCONNECT LOG"}</span>
          </button>
          {error && <p className="text-red-400 text-[10px] tracking-widest mt-3 xl text-center uppercase font-bold">{error}</p>}
        </motion.div>
      )}
    </motion.nav>
  );
});
NavLinks.displayName = 'NavLinks';

// --- Main Sidebar Component ---
const Sidebar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Global user state (reactive)
  const user = useUserStore(s => s.user);
  const resetUser = useUserStore(s => s.reset);
  const resetTrackers = useTrackerStore(s => s.reset);

  // ✅ FIX: The toggle function is now stable and has no dependencies.
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
  setIsLoggingOut(true);
  setError(null);
  try {
    await axiosInstance.get("/auth/logout");
    performClientLogout();
    // Don't call resetUser/resetTrackers again — performClientLogout already handled it
    setIsOpen(false); // ✅ safely close sidebar
    navigate("/login");
  } catch (err) {
    console.error("Logout error:", err);
    const errorMessage = err.response?.data?.message || "Server error during logout";
    setError(errorMessage);
  } finally {
    setIsLoggingOut(false);
  }
}, [navigate, resetUser, resetTrackers]);


  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <ErrorBoundary>
      <motion.button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 p-3 text-[#3b82f6] bg-[#050608] border border-[#3b82f6]/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-[#3b82f6]/10 transition-all duration-300"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        disabled={isLoggingOut}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2)_0%,transparent_70%)] opacity-0 hover:opacity-100 transition-opacity"></div>
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? "x" : "menu"}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-30"
              onClick={toggleSidebar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 h-full w-72 bg-[#050608]/95 backdrop-blur-2xl border-l border-white/5 z-40 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] font-['Rajdhani']"
            >
              {/* Scanline & Glow Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-10 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#a855f7]/30 to-transparent"></div>

              <div className="p-6 flex flex-col h-full overflow-y-auto relative z-10 scrollbar-none">
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                  <Link to="/" onClick={toggleSidebar} className="group flex flex-col">
                    <span className="text-[#3b82f6] text-[10px] font-black tracking-[0.4em] mb-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-ping"></div>
                      MAIN MENU
                    </span>
                    <h2 className="text-white text-2xl font-black italic tracking-wider font-['Exo_2'] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:text-[#a855f7] transition-colors">
                      SYSTEM 2.0
                    </h2>
                  </Link>
                </div>
                <NavLinks
                  user={user}
                  onLinkClick={toggleSidebar}
                  onLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                  error={error}
                />
                <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-2">
                  <p className="text-[10px] tracking-[0.3em] font-bold text-gray-600">SHADOW MONARCH HUD</p>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-[#a855f7]/50 font-bold">v2.0 // ONLINE</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
});
Sidebar.displayName = "Sidebar";

export default Sidebar;
