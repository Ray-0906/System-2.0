
import { useState, memo, useCallback, useEffect } from "react";
import { Menu, X, LogOut, Home, Compass, PlusSquare, BarChart, Package, Sparkles } from "lucide-react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import axiosInstance from "../utils/axios";

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
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/missions", label: "Missions", icon: Compass },
    { to: "/add-mission", label: "Add Mission", icon: PlusSquare },
    { to: "/report", label: "Ascension Room", icon: BarChart },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/skills", label: "Skills", icon: Sparkles },
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
          navItems.map((item) => (
            <motion.div key={item.to} variants={itemVariants}>
              <Link
                to={item.to}
                onClick={onLinkClick}
                className="flex items-center gap-4 text-purple-300 text-lg font-medium p-3 rounded-lg hover:bg-purple-500/10 hover:text-purple-100 transition-all duration-200 ease-out"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          ))
        ) : (
          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              onClick={onLinkClick}
              className="block text-center w-full py-2 px-4 text-lg font-medium rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all duration-300 ease-out hover:scale-105 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              Login
            </Link>
          </motion.div>
        )}
      </div>
      
      {user && (
        <motion.div variants={itemVariants} className="mt-auto">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 text-lg text-center font-medium rounded-lg bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-600 hover:to-rose-600 text-white transition-all duration-300 ease-out hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
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
  
  const [localUser, setLocalUser] = useState(null);
 

  // This effect runs only once on mount to set the initial user state.
  useEffect(() => {
    try {
      const userInStorage = localStorage.getItem("user");
      setLocalUser(userInStorage ? JSON.parse(userInStorage) : null);
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      setLocalUser(null);
    }
  }, []);

  // ✅ FIX: The toggle function is now stable and has no dependencies.
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ✅ FIX: This effect now handles the logic of re-syncing the user state when the sidebar opens.
  // This prevents the infinite loop.
  useEffect(() => {
    if (isOpen) {
        try {
            const userInStorage = localStorage.getItem("user");
            setLocalUser(userInStorage ? JSON.parse(userInStorage) : null);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            setLocalUser(null);
        }
    }
  }, [isOpen]);

  const handleLogout = useCallback(async () => {
  setIsLoggingOut(true);
  setError(null);
  try {
    await axiosInstance.get("/auth/logout");
    localStorage.removeItem("user");
    setLocalUser(null);
    setIsOpen(false); // ✅ safely close sidebar
    navigate("/login");
  } catch (err) {
    console.error("Logout error:", err);
    const errorMessage = err.response?.data?.message || "Server error during logout";
    setError(errorMessage);
  } finally {
    setIsLoggingOut(false);
  }
}, [navigate]);


  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <ErrorBoundary>
      <motion.button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 p-3 rounded-full text-white transition-colors duration-300 bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50"
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
              className="fixed top-0 right-0 h-full w-72 bg-gray-900/80 backdrop-blur-xl border-l border-purple-500/30 z-40"
              style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 text-2xl font-bold tracking-wider drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
                    <Link to="/" onClick={toggleSidebar}>SYSTEM 2.0</Link>
                  </h2>
                </div>
                <NavLinks
                  user={localUser}
                  onLinkClick={toggleSidebar}
                  onLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                  error={error}
                />
                <div className="mt-6 pt-6 border-t border-purple-500/20">
                  <p className="text-xs text-purple-500/80 tracking-wide text-center">
                    Shadow Monarch System
                  </p>
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
