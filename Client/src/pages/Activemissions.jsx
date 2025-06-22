import { useEffect, useState, memo } from 'react';
import { useTrackerStore } from '../store/trackerStore';
import { Link } from 'react-router-dom';
import { Shield, Flame, Star, Skull } from 'lucide-react';
import PropTypes from 'prop-types';

// Centralized theme constants for Solo Leveling aesthetic
const theme = {
  fonts: {
    primary: "'Orbitron', sans-serif",
  },
  colors: {
    background: 'bg-gradient-to-b from-black via-indigo-950 to-black',
    card: 'bg-gradient-to-r from-gray-900 to-indigo-900',
    border: 'border-indigo-500/50',
    shadow: 'shadow-indigo-500/50',
    title: 'text-indigo-300',
    accent: 'text-indigo-400',
    rank: 'text-yellow-300',
    streak: 'text-orange-400',
    dayCount: 'text-blue-400',
    reward: 'text-green-400',
    penalty: 'text-red-400',
    text: 'text-gray-300',
    muted: 'text-gray-400',
    empty: 'text-gray-500',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
  },
};

// CSS-in-JS for animations and hover effects
const styles = `
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
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
    border-color: rgba(165, 180, 252, 0.8);
  }
`;

/**
 * Loading state component for mission data
 * @returns {JSX.Element} Animated loading text
 */
const LoadingState = memo(() => (
  <p
    className={`text-center mt-8 ${theme.colors.accent} ${theme.animations.pulse}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    Loading missions...
  </p>
));

/**
 * Mission card component for displaying tracker details
 * @param {Object} props
 * @param {Object} props.tracker - Tracker data from store
 * @param {number} props.index - Index for staggered animation
 * @returns {JSX.Element} Styled mission card
 */
const MissionCard = memo(({ tracker, index }) => (
  <Link
    to={`/missions/${tracker.id}`}
    className={theme.animations.fadeInUp}
    style={{ animationDelay: `${index * 0.1}s`, fontFamily: theme.fonts.primary }}
  >
    <div
      className={`${theme.colors.card} p-6 rounded-2xl ${theme.colors.border} ${theme.colors.shadow} hover-glow`}
    >
      <h2 className={`text-2xl font-semibold ${theme.colors.title} mb-2 drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]`}>
        {tracker.title}
      </h2>
      <p className={`text-sm ${theme.colors.muted} mb-1 flex items-center`}>
        <Shield className={`w-4 h-4 mr-1 ${theme.colors.rank} drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]`} />
        Rank: <span className={`${theme.colors.rank} ml-1`}>{tracker.rank}</span>
      </p>
      <p className={`text-sm ${theme.colors.muted} mb-1 flex items-center`}>
        <Flame className={`w-4 h-4 mr-1 ${theme.colors.streak} drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]`} />
        Streak: {tracker.streak} days
      </p>
      <p className={`text-sm ${theme.colors.muted} mb-1 flex items-center`}>
        <Star className={`w-4 h-4 mr-1 ${theme.colors.dayCount} drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]`} />
        Day Count: {tracker.daycount}
      </p>
      <div className="mt-3">
        <h3 className={`text-lg ${theme.colors.reward} font-medium flex items-center`}>
          <Star className={`w-5 h-5 mr-1 ${theme.colors.reward.replace('400', '300')} drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]`} />
          Reward
        </h3>
        <p className={`text-sm ${theme.colors.text}`}>XP: {tracker.reward?.xp || 0}</p>
        <p className={`text-sm ${theme.colors.text}`}>Coins: {tracker.reward?.coins || 0}</p>
      </div>
      <div className="mt-3">
        <h3 className={`text-lg ${theme.colors.penalty} font-medium flex items-center`}>
          <Skull className={`w-5 h-5 mr-1 ${theme.colors.penalty.replace('400', '300')} drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]`} />
          Penalty
        </h3>
        <p className={`text-sm ${theme.colors.text}`}>
          Skip - Coins: {tracker.penalty?.skip?.coins || 0}, Stats: {tracker.penalty?.skip?.stats || 0}
        </p>
        <p className={`text-sm ${theme.colors.text}`}>
          Mission Fail - Coins: {tracker.penalty?.missionFail?.coins || 0}, Stats: {tracker.penalty?.missionFail?.stats || 0}
        </p>
      </div>
    </div>
  </Link>
));

// PropTypes for MissionCard
MissionCard.propTypes = {
  tracker: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    rank: PropTypes.string.isRequired,
    streak: PropTypes.number.isRequired,
    daycount: PropTypes.number.isRequired,
    reward: PropTypes.shape({
      xp: PropTypes.number,
      coins: PropTypes.number,
    }),
    penalty: PropTypes.shape({
      skip: PropTypes.shape({
        coins: PropTypes.number,
        stats: PropTypes.number,
      }),
      missionFail: PropTypes.shape({
        coins: PropTypes.number,
        stats: PropTypes.number,
      }),
    }),
  }).isRequired,
  index: PropTypes.number.isRequired,
};

/**
 * ActiveMissions component displays a list of active mission trackers
 * @returns {JSX.Element} Styled mission list with Solo Leveling theme
 */
const ActiveMissions = () => {
  const trackers = useTrackerStore((state) => state.trackers);
  const [isLoading, setIsLoading] = useState(true);

  // Optimize loading state update
  useEffect(() => {
    setIsLoading(!Array.isArray(trackers));
  }, [trackers]);

  if (isLoading) return <LoadingState />;

  return (
    <div className={`min-h-screen ${theme.colors.background} text-white p-6`}>
      <style>{styles}</style>
      <div className="max-w-6xl mx-auto">
        <h1
          className={`text-4xl font-bold mb-8 ${theme.colors.accent} drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] ${theme.animations.fadeInUp}`}
          style={{ fontFamily: theme.fonts.primary }}
        >
          Active Missions
        </h1>

        {trackers.length === 0 ? (
          <p
            className={`text-center ${theme.colors.empty}`}
            style={{ fontFamily: theme.fonts.primary }}
          >
            No active missions available.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trackers.map((tracker, index) => (
              <MissionCard key={tracker.id} tracker={tracker} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveMissions;