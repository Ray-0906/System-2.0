
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
                    `group flex items-center gap-3 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-300 relative overflow-hidden ` +
                    (active
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-purple-100 ring-1 ring-purple-400/40 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                      : 'text-purple-300 hover:text-purple-100 hover:bg-purple-500/10')
                  }
                >
                  <span className={"p-1.5 rounded-md bg-black/30 border border-purple-500/20 shadow-inner shadow-black/50 transition-colors " + (active ? 'bg-purple-600/40 border-purple-400/50' : 'group-hover:bg-purple-700/30')}>
                    <item.icon className="w-4 h-4" />
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                  {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-purple-400 to-pink-500 rounded-r" />}
                </Link>
              </motion.div>
            );
          })
        ) : (
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              onClick={onLinkClick}
              className="block text-center w-full py-2 px-4 text-sm font-semibold tracking-wide rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all duration-300 ease-out hover:shadow-[0_0_12px_rgba(236,72,153,0.4)]"
            >
              Login
            </Link>
          </motion.div>
        )}
      </div>
  {/* Sidequests now included in main nav list above */}
      
      {user && (
        <motion.div variants={itemVariants} className="mt-auto">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm tracking-wide font-semibold rounded-lg bg-gradient-to-r from-red-600/90 to-rose-600/80 hover:from-red-600 hover:to-rose-600 text-white transition-all duration-300 ease-out hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
          {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
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
    // Additional explicit resets (defensive in case helper shape changes)
    resetUser();
    resetTrackers();
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
        className="fixed top-4 right-4 z-50 p-3 rounded-full text-white transition-colors duration-300 bg-black/25 backdrop-blur-md border border-white/10 hover:bg-black/40 shadow-[0_0_8px_rgba(139,92,246,0.25)]"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        disabled={isLoggingOut}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
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
              className="fixed top-0 right-0 h-full w-72 bg-gradient-to-br from-gray-950/95 via-[#0d0f17]/95 to-gray-900/90 backdrop-blur-xl border-l border-purple-500/30 z-40 shadow-[0_0_35px_-5px_rgba(139,92,246,0.35)]"
              style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}
            >
              <div className="p-6 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-600/30 hover:scrollbar-thumb-purple-500/50">
                <div className="flex items-center justify-between mb-8">
                  <Link to="/" onClick={toggleSidebar} className="group">
                    <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 text-xl font-extrabold tracking-wider drop-shadow-[0_0_8px_rgba(139,92,246,0.45)] group-hover:from-purple-300 group-hover:to-pink-400 transition-all">
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
                <div className="mt-6 pt-5 border-t border-purple-600/20 text-center space-y-2">
                  <p className="text-[10px] tracking-wide text-purple-400/70">Shadow Monarch System</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-purple-500/40">v2.0</p>
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
