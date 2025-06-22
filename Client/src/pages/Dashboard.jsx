import { useEffect, memo } from 'react';
import { Shield, Star, Award, Skull, Sword, Flame, ShieldPlus, Brain } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useLoadUser } from '../utils/userLoader';
import PropTypes from 'prop-types';

// Centralized theme constants for Solo Leveling aesthetic
const theme = {
  fonts: {
    primary: "'Orbitron', sans-serif",
  },
  colors: {
    background: 'bg-gradient-to-b from-black via-indigo-950 to-black',
    card: 'bg-gradient-to-r from-gray-900 to-indigo-900',
    statCard: 'bg-gray-900',
    border: 'border-indigo-500/50',
    shadow: 'shadow-indigo-500/50',
    title: 'text-indigo-300',
    accent: 'text-indigo-400',
    rank: 'text-yellow-300',
    level: 'text-green-400',
    coins: 'text-blue-400',
    stat: 'text-green-400',
    text: 'text-gray-300',
    muted: 'text-gray-400',
    loading: 'text-indigo-400',
    error: 'text-red-400',
    progress: 'bg-indigo-600',
    progressBg: 'bg-gray-700',
    particle: 'bg-indigo-400',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
    glow: 'animate-glow',
  },
};

// CSS-in-JS for animations, hover effects, and particle background
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
    100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
  }
  @keyframes float {
    0% { transform: translateY(0); opacity: 0.5; }
    50% { opacity: 0.8; }
    100% { transform: translateY(-100vh); opacity: 0; }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  .animate-glow {
    animation: glow 3s infinite;
  }
  .hover-glow {
    transition: all 0.3s ease;
  }
  .hover-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
    border-color: rgba(165, 180, 252, 0.8);
  }
  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.5);
    animation: float 8s infinite;
    pointer-events: none;
  }
`;

/**
 * Loading state component for user data
 * @returns {JSX.Element} Animated loading text
 */
const LoadingState = memo(() => (
  <p
    className={`text-center mt-8 ${theme.colors.loading} ${theme.animations.pulse}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    Loading...
  </p>
));

/**
 * Error state component for failed user data load
 * @param {Object} props
 * @param {string} props.message - Error message
 * @returns {JSX.Element} Error message display
 */
const ErrorState = memo(({ message }) => (
  <p
    className={`text-center mt-8 ${theme.colors.error}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    {message}
  </p>
));

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
};

/**
 * Stat card for user attributes (rank, level, coins)
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Card value
 * @param {string} props.color - Tailwind color class
 * @param {React.Component} props.icon - Lucide icon component
 * @returns {JSX.Element} Styled stat card
 */
const StatCard = memo(({ title, value, color, icon: Icon }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-6 ${theme.colors.shadow} ${theme.colors.border} text-center ${theme.animations.fadeInUp} hover-glow ${theme.animations.glow}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <h2 className={`text-xl font-semibold ${theme.colors.muted} mb-2`}>{title}</h2>
    <div className="flex items-center justify-center">
      {Icon && <Icon className={`w-6 h-6 mr-2 ${color} drop-shadow-[0_0_4px_rgba(99,102,241,0.6)]`} />}
      <p className={`text-3xl ${color}`}>{value}</p>
    </div>
  </div>
));

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

/**
 * Skills & Attributes grid
 * @param {Object} props
 * @param {Object} props.skills - Skills/Attributes object with fake data
 * @returns {JSX.Element} Grid of skill cards with progress bars
 */
const SkillsGrid = memo(({ skills }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-6 ${theme.colors.shadow} ${theme.colors.border} ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <div className="flex items-center mb-4">
      <Sword className={`w-6 h-6 mr-2 ${theme.colors.title} drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]`} />
      <h2 className={`text-2xl font-semibold ${theme.colors.title} drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]`}>
        Skills & Attributes
      </h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {skills &&
        Object.entries(skills).map(([key, skill], index) => {
          const progress = Math.min((skill.value / 100) * 100, 100); // Normalize value to 0-100 for progress bar
          const Icon = key.toLowerCase().includes('strength')
            ? Flame
            : key.toLowerCase().includes('intelligence')
            ? Brain
            : ShieldPlus; // Icon mapping
          return (
            <div
              key={key}
              className={`${theme.colors.statCard} rounded-xl p-4 ${theme.colors.border} text-center hover-glow ${theme.animations.glow}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-center mb-2">
                <Icon className={`w-5 h-5 mr-2 ${theme.colors.stat} drop-shadow-[0_0_4px_rgba(34,197,94,0.4)]`} />
                <h3 className={`text-lg font-medium ${theme.colors.muted} capitalize`}>{key}</h3>
              </div>
              <p className={`text-2xl ${theme.colors.stat} mb-1`}>{skill.value}</p>
              <div className={`w-full ${theme.colors.progressBg} rounded-full h-2.5`}>
                <div
                  className={`${theme.colors.progress} h-2.5 rounded-full transition-all duration-500 ease-in-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={`text-sm ${theme.colors.muted} mt-1`}>Lv {skill.level}</p>
            </div>
          );
        })}
    </div>
  </div>
));

SkillsGrid.propTypes = {
  skills: PropTypes.objectOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      level: PropTypes.number.isRequired,
    })
  ),
};

/**
 * Titles section for user achievements
 * @param {Object} props
 * @param {string[]} props.titles - Array of user titles
 * @returns {JSX.Element} Titles display with badges
 */
const TitlesSection = memo(({ titles }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-6 ${theme.colors.shadow} ${theme.colors.border} ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <div className="flex items-center mb-4">
      <Award className={`w-6 h-6 mr-2 ${theme.colors.title} drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]`} />
      <h2 className={`text-2xl font-semibold ${theme.colors.title} drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]`}>
        Titles
      </h2>
    </div>
    <div className="flex flex-wrap gap-2">
      {titles?.length ? (
        titles.map((title, index) => (
          <span
            key={index}
            className={`${theme.colors.statCard} ${theme.colors.border} rounded-full px-4 py-1 text-sm ${theme.colors.text} hover-glow ${theme.animations.glow}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {title}
          </span>
        ))
      ) : (
        <p className={theme.colors.muted}>No titles earned yet.</p>
      )}
    </div>
  </div>
));

TitlesSection.propTypes = {
  titles: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Particle background effect for Solo Leveling magic vibe
 * @returns {JSX.Element} Animated particles
 */
const ParticleBackground = memo(() => {
  const particles = Array.from({ length: 20 }).map((_, index) => (
    <div
      key={index}
      className="particle"
      style={{
        left: `${Math.random() * 100}vw`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${5 + Math.random() * 5}s`,
      }}
    />
  ));

  return <div className="fixed inset-0 z-0">{particles}</div>;
});

/**
 * Dashboard component displaying user profile and stats
 * @returns {JSX.Element} Styled dashboard with Solo Leveling theme
 */
const Dashboard = () => {
  const user = useUserStore((state) => state.user);
  const { loading, error } = useLoadUser();

  // Fake data for skills and attributes
  const fakeSkills = {
    strength: { value: 85, level: 6 },
    agility: { value: 70, level: 5 },
    intelligence: { value: 90, level: 7 },
    endurance: { value: 65, level: 4 },
  };

  // Log user data loading status
  useEffect(() => {
    if (loading) {
      console.log('Loading user data...');
    } else if (error) {
      console.error('Error loading user data:', error);
    } else {
      console.log('User data loaded successfully');
    }
  }, [loading, error]);

  if (loading || !user) return <LoadingState />;
  if (error) return <ErrorState message="Error loading user data." />;

  return (
    <div className={`min-h-screen ${theme.colors.background}`}>
      <style>{styles}</style>
      <ParticleBackground />
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className={`mb-10 ${theme.animations.fadeInUp}`}>
            <div className="flex items-center justify-center md:justify-start">
              <Skull className={`w-8 h-8 mr-3 ${theme.colors.accent} drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]`} />
              <h1
                className={`text-4xl md:text-5xl font-semibold ${theme.colors.accent} drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]`}
                style={{ fontFamily: theme.fonts.primary }}
              >
                Welcome, {user.username}
              </h1>
            </div>
            <div className="flex justify-center md:justify-start mt-2">
              <span
                className={`${theme.colors.statCard} ${theme.colors.border} rounded-full px-4 py-1 ${theme.colors.rank} text-sm ${theme.animations.glow}`}
                style={{ fontFamily: theme.fonts.primary }}
              >
                Rank: {user.rank}
              </span>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Rank"
              value={user.rank}
              color={theme.colors.rank}
              icon={Shield}
            />
            <StatCard
              title="Level"
              value={user.level}
              color={theme.colors.level}
              icon={Star}
            />
            <StatCard
              title="Coins"
              value={user.coins}
              color={theme.colors.coins}
              icon={Award}
            />
          </div>

          {/* Skills & Attributes Grid */}
          <SkillsGrid skills={fakeSkills} />

          {/* Titles Section */}
          <div className="mt-10">
            <TitlesSection titles={user.titles} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;