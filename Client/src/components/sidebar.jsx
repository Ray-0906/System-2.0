import { useState, memo, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { useUserStore } from '../store/userStore';

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
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-400">Sidebar Error</h1>
            <p className="text-purple-300">Something went wrong: {this.state.error.message}</p>
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
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-gray-800 to-black',
    border: 'border-purple-500/50',
    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    title: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500',
    accent: 'text-purple-400',
    button: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600',
    error: 'bg-gradient-to-r from-red-600 to-rose-600',
    text: 'text-white',
    muted: 'text-purple-300',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
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
`;

// Memoize Sidebar to prevent unnecessary re-renders
const Sidebar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setIsOpen(false);
    setError(null);
    try {
      await axiosInstance.get('/auth/logout'); // this clears the cookie on backend

       localStorage.removeItem('user');
       useUserStore.getState().reset(); 
       // clear Zustand user state
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.response?.data?.message || 'Server error during logout');
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate]);

  return (
    <ErrorBoundary>
      <style>{styles}</style>
      {/* Toggle Button (Hamburger Menu or Close, on right side) */}
      <button
        onClick={toggleSidebar}
        className={`${theme.colors.button} fixed top-4 right-4 z-50 p-2 rounded-full text-white transition-all duration-300 ${theme.colors.shadow}`}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        disabled={isLoggingOut}
        aria-disabled={isLoggingOut}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar (slides in from right) */}
      <div
        className={`fixed top-0 right-0 h-full w-72 ${theme.colors.background} border-l ${theme.colors.border} z-40 transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ fontFamily: theme.fonts.primary }}
      >
        <div className="p-6">
          {/* Header with Solo Leveling Logo/Title and Close Button */}
          <div className="flex justify-between items-center mb-8">
            <h2 className={`${theme.colors.title} text-2xl font-bold tracking-wider drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]`}>
             <Link to={'/home'} onClick={()=>{setIsOpen(false);}}>SYSTEM 2.0</Link> 
            </h2>
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="text-purple-300 hover:text-red-500 transition-colors duration-200"
                aria-label="Close sidebar"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/missions', label: 'Missions' },
              { to: '/add-mission', label: 'Add Mission' },
              { to: '/report', label: 'Ascension Room' },
              { to: '/inventory', label: 'Inventory' },
              { to: '/skills', label: 'Skills' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)} // Close sidebar on link click
                className="block text-purple-300 text-lg font-medium hover:text-purple-200 hover:scale-105 transition-all duration-300 ease-out drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`${theme.colors.button} w-full  py-2 text-lg text-center font-medium rounded transition-all duration-300 ease-out hover:scale-105 ${theme.colors.shadow} ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Logout"
              aria-disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </nav>

          {/* Footer with Theme Flair */}
          <div className="absolute bottom-6 left-6">
            <p className="text-sm text-purple-500 tracking-wide">
              Shadow Monarch System
            </p>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full opacity-75" />
          </div>
        </div>
      </div>

      {/* Overlay for when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </ErrorBoundary>
  );
});

// Display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;