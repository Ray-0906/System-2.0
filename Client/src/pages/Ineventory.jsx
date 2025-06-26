import { useQuery } from '@apollo/client';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GET_ALL_EQUIPMENT } from '../graphql/query';
import EquipmentCard from '../components/equimentCard';
import { useUserStore } from '../store/userStore';
import PropTypes from 'prop-types';
import React from 'react';
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
            <h1 className="text-2xl font-bold text-red-500">Oops! Something Went Wrong</h1>
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
    loading: 'text-purple-400',
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
    className={`p-4 rounded-md ${message.type === 'success' ? theme.colors.success : theme.colors.error} ${theme.animations.fadeInUp} mb-4`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <div className="flex justify-between items-center">
      <span className={theme.colors.text}>{message.text}</span>
      <button onClick={onDismiss} aria-label="Dismiss alert" className="text-white ml-4">
        ✕
      </button>
    </div>
  </div>
);

Alert.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const ITEMS_PER_PAGE = 8;

const Inventory = () => {
  const { data, loading, error } = useQuery(GET_ALL_EQUIPMENT);
  const user = useUserStore((state) => state.user?.getUser);
  const userOwned = user?.equipment || [];
  const userCoins = user?.coins || 0;

  const [selectedRarity, setSelectedRarity] = useState('All');
  const [filterOwned, setFilterOwned] = useState(false);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null);

  // Filter by rarity and ownership
  const filtered = useMemo(() => {
    let result = selectedRarity === 'All'
      ? data?.getAllEquipment || []
      : (data?.getAllEquipment || []).filter(eq => eq.rarity === selectedRarity);
    if (filterOwned) {
      result = result.filter(eq => userOwned.includes(eq.id));
    }
    return result;
  }, [selectedRarity, filterOwned, data, userOwned]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / ITEMS_PER_PAGE), [filtered.length]);
  const paginated = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  const rarities = ['All', 'legendary', 'epic', 'rare', 'common'];

  const handleBuy = async (equipmentId, cost) => {
    if (userCoins < cost) {
      setMessage({ type: 'error', text: 'Not enough coins' });
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/inventory/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ equipmentId, price: cost }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Purchase successful!' });
        useUserStore.getState().refreshUser();
      } else {
        setMessage({ type: 'error', text: result.message || 'Purchase failed' });
      }
    } catch (e) {
      console.error('Purchase error:', e);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleDismiss = () => setMessage(null);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${theme.colors.background} px-6 py-10 ${theme.colors.text}`}>
        <style>{styles}</style>
        <div className="w-full mx-auto max-w-screen-lg space-y-6">
          <div className="text-center mb-6">
            <h1
              className={`${theme.colors.title} text-4xl font-bold mb-2 text-glow`}
              style={{ fontFamily: theme.fonts.primary, textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
            >
              GEAR VAULT
            </h1>
            <p
              className={`${theme.colors.accent} text-lg font-semibold tracking-wide`}
              style={{ fontFamily: theme.fonts.primary }}
            >
              Arm yourself for glory! Explore and acquire legendary gear, filtered by rarity, to enhance your questing prowess.
            </p>
          </div>

          {message && <Alert message={message} onDismiss={handleDismiss} />}
          <div className='flex justify-center'>
          <div className="flex flex-wrap gap-2 mb-4">
            {rarities.map(r => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRarity(r);
                  setPage(1);
                }}
                className={`px-4 py-1 rounded-full ${theme.colors.border} ${
                  selectedRarity === r
                    ? 'bg-purple-700 border-purple-400'
                    : 'bg-gray-700 border-gray-500'
                } text-sm hover-glow`}
                aria-label={`Filter by ${r} rarity`}
                aria-pressed={selectedRarity === r}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setFilterOwned(f => !f)}
              className={`px-4 py-1 rounded-full ${theme.colors.border} ${
                filterOwned
                  ? 'bg-green-600 border-green-400'
                  : 'bg-gray-700 border-gray-500'
              } text-sm hover-glow`}
              aria-label="Toggle owned filter"
              aria-pressed={filterOwned}
            >
              {filterOwned ? 'Showing Owned' : 'Show Owned Only'}
            </button>
          </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {paginated.map(equipment => {
              const owned = userOwned.includes(equipment.id);
              const canBuy = userCoins >= equipment.cost && !owned;

              return (
                <div
                  key={equipment.id}
                  className={`${theme.colors.card} rounded-lg p-4 flex flex-col items-center ${theme.colors.border} ${theme.colors.shadow}`}
                >
                  <img
                    src={equipment.icon}
                    alt={equipment.name}
                    className="w-16 h-16 mb-3 rounded object-cover"
                  />
                  <h2 className="text-lg font-bold mb-1" style={{ fontFamily: theme.fonts.primary }}>{equipment.name}</h2>
                  <p className={`text-xs ${theme.colors.muted} text-center mb-2`}>{equipment.description}</p>

                  <button
                    disabled={!canBuy}
                    onClick={() => handleBuy(equipment.id, equipment.cost)}
                    className={`w-full py-2 text-sm font-semibold rounded transition ${
                      owned
                        ? `${theme.colors.success} text-white cursor-default`
                        : canBuy
                        ? `${theme.colors.button} text-white`
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    } hover-glow`}
                    aria-label={owned ? 'Owned' : canBuy ? `Buy for ${equipment.cost} coins` : 'Cannot buy'}
                    aria-disabled={!canBuy}
                  >
                    {owned ? 'Owned' : <span>🪙 {equipment.cost}</span>}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`${theme.colors.button} px-3 py-1 rounded hover:from-purple-500 hover:to-pink-400`}
              aria-label="Previous page"
              aria-disabled={page === 1}
            >
              Prev
            </button>
            <span className={theme.colors.text}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`${theme.colors.button} px-3 py-1 rounded hover:from-purple-500 hover:to-pink-400`}
              aria-label="Next page"
              aria-disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Inventory;