import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { getAllSkills } from '../graphql/query';
import { useUserStore } from '../store/userStore';
import { cn } from '../utils/cn';
import AuthLayout from '../components/AuthLayout';
import SoloLoading from '../components/Loading'; // Assuming this is the correct import path
import axiosInstance from '../utils/axios';

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
              className="px-8 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-500 hover:to-pink-400 transition-all"
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

/**
 * Dismissible Alert Component
 */
const Alert = ({ message, onDismiss }) => (
  <div
    role="alert"
    aria-live="polite"
    className="p-4 rounded-md bg-gradient-to-r from-red-600 to-rose-600 animate-fade-in-up mb-4"
    style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}
  >
    <div className="flex justify-between items-center">
      <span className="text-white">{message.text}</span>
      <button onClick={onDismiss} aria-label="Dismiss alert" className="text-white ml-4">
        ✕
      </button>
    </div>
  </div>
);

// Centralized theme constants
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-[#1a1e2a] to-[#0f141f]',
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

const SkillCard = ({ skill, userStats = {}, unlockedSkills = [], onUnlock }) => {
  const isUnlocked = unlockedSkills.includes(skill.id);
  
  // Progress calculation
  const totalRequired = skill.statRequired.length;
  const fulfilled = skill.statRequired.filter(req => {
    return (userStats?.[req.stat]?.level || 0) >= req.value;
  }).length;

  const progressPercent = Math.round((fulfilled / totalRequired) * 100);
  const unlockable = !isUnlocked && progressPercent === 100;

  // Determine button state
  let buttonText = 'Locked';
  let buttonClass = 'bg-gray-700 text-gray-400 cursor-not-allowed';
  let buttonDisabled = true;

  if (isUnlocked) {
    buttonText = 'Unlocked';
    buttonClass = 'bg-gray-700 text-gray-500 cursor-default';
  } else if (unlockable) {
    buttonText = 'Obtain';
    buttonClass = 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white';
    buttonDisabled = false;
  }

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#1a1e2a] to-[#0f141f] rounded-lg p-5 text-white shadow-lg shadow-black/40 border-2 border-purple-500/50 min-w-0',
        'transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]',
        isUnlocked && 'ring-2 ring-opacity-50 ring-offset-2 ring-offset-[#0f141f] ring-gray-600'
      )}
      style={{ fontFamily: theme.fonts.primary }}
    >
      {/* Card Border Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gray-600" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-gray-600" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-gray-600" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gray-600" />

      <img
        src={skill.icon}
        alt={skill.name}
        className="w-16 h-16 mx-auto rounded-md mb-3 border border-gray-600"
      />
      <h3 className="text-lg font-bold text-center uppercase tracking-wider mb-1">{skill.name}</h3>
      <p className="text-sm text-purple-300 text-center mb-2">{skill.description}</p>

      <div className="mb-2 text-xs text-purple-400 space-y-1">
        <p><span className="font-semibold">Rank:</span> {skill.rank}</p>
        <p><span className="font-semibold">Min Level:</span> {skill.minLevel}</p>
        {skill.statRequired.map(req => (
          <p key={req.stat}>
            <span className="capitalize">{req.stat}:</span>{" "}
            <span className={userStats?.[req.stat]?.level >= req.value ? "text-green-500" : "text-red-500"}>
              {userStats?.[req.stat]?.level || 0}/{req.value}
            </span>
          </p>
        ))}
      </div>

      <div className="mt-3 mb-2">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-center mt-1 text-purple-300">
          {isUnlocked ? "Unlocked" : unlockable ? "Ready to Obtain" : "Locked"}
        </p>
      </div>

      <button
        disabled={buttonDisabled}
        onClick={() => onUnlock && onUnlock(skill.id)}
        className={cn(
          'w-full py-2 mt-2 rounded text-sm font-semibold uppercase transition hover-glow',
          buttonClass
        )}
        aria-label={buttonText.toLowerCase()}
      >
        {buttonText}
      </button>
    </div>
  );
};

const SkillGrid = ({ skills, userStats = {}, unlockedSkills = [], onUnlock }) => {
  return (
    <div className="w-full mx-auto max-w-screen-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-4">
        {skills.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            userStats={userStats}
            unlockedSkills={unlockedSkills}
            onUnlock={onUnlock}
          />
        ))}
      </div>
    </div>
  );
};

const SkillsPage = () => {
  const { data: skillData, loading: loadingSkills, error } = useQuery(getAllSkills);
  const userData = useUserStore((state) => state.user);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState(null);

  const skills = skillData?.getAllSkills || [];
  const userStats = userData?.stats || {};

  // Ensure unlockedSkills is an array of IDs
  const unlockedSkillIds = (userData?.skills || []).map(skill => skill.id);

  const filterSkills = () => {
    if (filter === 'unlocked') {
      return skills.filter((s) => unlockedSkillIds.includes(s.id));
    } else if (filter === 'locked') {
      return skills.filter((s) => !unlockedSkillIds.includes(s.id));
    }
    return skills;
  };

  const handleUnlock = async (skillId) => {
    try {
      const res = await axiosInstance.post(`/skill/unlock`, {skillId
      });

      if (res?.data) {
        console.log('Skill Unlocked:', res.data);
        // Optional: Refetch user if you have GraphQL for user
        // Or update zustand store manually if you're syncing
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to unlock skill' });
      }
    } catch (err) {
      console.error('Error unlocking skill:', err);
      setMessage({ type: 'error', text: 'Server error' });
    }
  };

  const handleDismiss = () => setMessage(null);

  return (
    <ErrorBoundary>
      <AuthLayout>
        <SoloLoading loading={loadingSkills} message="Loading Skill Forge..." />
        {!loadingSkills && (
          <div className={`min-h-screen ${theme.colors.background} px-8 py-10 ${theme.colors.text}`}>
            <style>{styles}</style>
            <div className="w-full mx-auto space-y-6">
              <div className="text-center mb-6">
                <h1
                  className={`${theme.colors.title} text-4xl font-bold mb-2 text-glow`}
                  style={{ fontFamily: theme.fonts.primary, textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
                >
                  SKILL FORGE
                </h1>
                <p
                  className={`${theme.colors.accent} text-lg font-semibold tracking-wide`}
                  style={{ fontFamily: theme.fonts.primary }}
                >
                  Master your path! Unlock powerful skills by meeting stat thresholds and filter your arsenal with ease.
                </p>
              </div>

              {message && <Alert message={message} onDismiss={handleDismiss} />}
              <div className='flex justify-center'>
                <div className="flex justify-between items-center mb-6">
                  <div className="space-x-2">
                    {['all', 'unlocked', 'locked'].map((type) => (
                      <button
                        key={type}
                        className={`px-3 py-1 rounded ${
                          filter === type
                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                            : 'bg-gray-700 text-purple-300'
                        } hover-glow`}
                        onClick={() => setFilter(type)}
                        aria-label={`Filter by ${type} skills`}
                        aria-pressed={filter === type}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <SkillGrid
                skills={filterSkills()}
                userStats={userStats}
                unlockedSkills={unlockedSkillIds}
                onUnlock={handleUnlock}
              />
            </div>
          </div>
        )}
      </AuthLayout>
    </ErrorBoundary>
  );
};

export default SkillsPage;