import { useState, memo } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Solo Leveling-inspired font (use a similar Google Font or custom font if available)
const soloLevelingFontStyle = {
  fontFamily: "'Orbitron', sans-serif", // Futuristic font resembling Solo Leveling's aesthetic
};

// Memoize Sidebar to prevent unnecessary re-renders
const Sidebar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Toggle Button (Hamburger Menu or Close, on right side) */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/50"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar (slides in from right) */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-black border-l border-indigo-900/50 z-40 transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={soloLevelingFontStyle}
      >
        <div className="p-6">
          {/* Header with Solo Leveling Logo/Title and Close Button */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-indigo-400 tracking-wider drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">
              Solo Leveling
            </h2>
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="text-gray-300 hover:text-red-500 transition-colors duration-200"
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
              { to: '/add-mission', label: 'New Mission' },
              { to: '/inventory', label: 'Inventory' },
              { to: '/titles', label: 'Titles' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)} // Close sidebar on link click
                className="block text-gray-300 text-lg font-medium hover:text-indigo-300 hover:scale-105 transition-all duration-300 ease-out drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer with Theme Flair */}
          <div className="absolute bottom-6 left-6">
            <p className="text-sm text-gray-500 tracking-wide">
              Shadow Monarch System
            </p>
            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-75" />
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
    </>
  );
});

// Display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;