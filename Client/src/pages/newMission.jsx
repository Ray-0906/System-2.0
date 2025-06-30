import { useState, useCallback, memo } from 'react';
import { Wand2, Shield, CheckCircle, Star, Skull, ArrowLeft, FilePenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useNotificationStore } from '../store/notificationStore';
import PropTypes from 'prop-types';
import AuthLayout from '../components/AuthLayout';

// Centralized theme constants
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-gray-800 to-black',
    input: 'bg-gray-800/70',
    border: 'border-purple-500/50',
    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    title: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500',
    accent: 'text-purple-400',
    button: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
    error: 'bg-gradient-to-r from-red-600 to-rose-600',
    rank: 'text-yellow-400',
    reward: 'text-emerald-400',
    penalty: 'text-red-400',
    text: 'text-white',
    muted: 'text-purple-300',
    loading: 'text-purple-400',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
    pulse: 'animate-pulse',
  },
};

// CSS-in-JS for animations and hover effects
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

/**
 * Loading state component
 */
const LoadingState = memo(() => (
  <p
    className={`text-center text-lg ${theme.colors.loading} ${theme.animations.pulse}`}
    style={{ fontFamily: theme.fonts.primary }}
    aria-live="polite"
  >
    Generating mission...
  </p>
));

/**
 * Message component for success/error feedback
 */
const Message = memo(({ message }) => (
  <div
    role="alert"
    aria-live="polite"
    className={`text-sm px-4 py-2 rounded-md ${message.type === 'success' ? theme.colors.success : theme.colors.error} ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    {message.text}
  </div>
));

Message.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Mission form component
 */
const MissionForm = memo(({ formState, setFormState, handleGenerate, isLoading }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-8 ${theme.colors.border} ${theme.colors.shadow} space-y-6 ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <h2 className={`${theme.colors.title} text-2xl font-semibold drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]`}>
      Create New Mission
    </h2>
    <div>
      <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.colors.accent}`}>
        <Wand2 size={20} className="text-purple-300" /> AI Mission Generator
      </h3>
      <p className={`text-sm ${theme.colors.muted} mt-1`}>
        Describe your goal, and let the AI craft a mission to help you achieve it.
      </p>
    </div>
    <div>
      <label className={`block text-sm mb-1 ${theme.colors.text}`}>Mission Goal</label>
      <textarea
        rows={3}
        aria-label="Mission goal"
        className={`w-full px-4 py-2 rounded-md ${theme.colors.input} ${theme.colors.border} focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${theme.colors.text}`}
        placeholder="e.g., 'Learn to cook healthy meals', 'Improve my coding skills', 'Run a 5k'"
        value={formState.goal}
        onChange={(e) => setFormState({ ...formState, goal: e.target.value })}
      />
      <p className={`text-xs ${theme.colors.muted} mt-1`}>Be specific about what you want to achieve.</p>
    </div>
    <div>
      <label className={`block text-sm mb-1 ${theme.colors.text}`}>Duration (in days)</label>
      <input
        type="number"
        min={1}
        aria-label="Mission duration"
        className={`w-full px-4 py-2 rounded-md ${theme.colors.input} ${theme.colors.border} focus:outline-none focus:ring-2 focus:ring-purple-500 ${theme.colors.text}`}
        value={formState.duration}
        onChange={(e) => setFormState({ ...formState, duration: Number(e.target.value) })}
      />
    </div>
    <button
      onClick={handleGenerate}
      disabled={isLoading}
      className={`w-full py-3 ${theme.colors.button} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover-glow`}
      aria-label="Generate mission"
    >
      <Wand2 size={18} className={isLoading ? 'animate-spin' : ''} />
      {isLoading ? 'Generating...' : 'Generate Mission'}
    </button>
  </div>
));

MissionForm.propTypes = {
  formState: PropTypes.shape({
    goal: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  setFormState: PropTypes.func.isRequired,
  handleGenerate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

/**
 * Mission details component
 */
const MissionDetails = memo(({ mission, quests, handleAccept, isAccepting, handleBack }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-8 ${theme.colors.border} ${theme.colors.shadow} space-y-6 ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <h2 className={`${theme.colors.title} text-2xl font-semibold drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]`}>
      Mission Details
    </h2>
    <div>
      <h3 className={`text-lg font-medium ${theme.colors.accent}`}>{mission.title}</h3>
      <p className={`text-sm ${theme.colors.text} mt-1`}>{mission.description}</p>
      <p className={`text-sm ${theme.colors.muted} flex items-center gap-1 mt-2`}>
        <Shield className={`w-4 h-4 ${theme.colors.rank}`} /> Rank: <span className={theme.colors.rank}>{mission.rank}</span>
      </p>
      <p className={`text-sm ${theme.colors.muted} mt-1`}>Duration: {mission.duration} days</p>
    </div>
    <div>
      <h4 className={`text-md font-medium ${theme.colors.reward} flex items-center gap-1`}>
        <Star className={`w-4 h-4 ${theme.colors.reward}`} /> Rewards
      </h4>
      <p className={`text-sm ${theme.colors.text} mt-1`}>XP: {mission.reward?.xp || 0}</p>
      <p className={`text-sm ${theme.colors.text}`}>Coins: {mission.reward?.coins || 0}</p>
      {mission.reward?.specialReward && (
        <p className={`text-sm ${theme.colors.text} capitalize`}>Special: {mission.reward.specialReward}</p>
      )}
    </div>
    <div>
      <h4 className={`text-md font-medium ${theme.colors.penalty} flex items-center gap-1`}>
        <Skull className={`w-4 h-4 ${theme.colors.penalty}`} /> Penalties
      </h4>
      <p className={`text-sm ${theme.colors.text} mt-1`}>
        Skip - Coins: {mission.penalty?.skip?.coins || 0}, Stats: {mission.penalty?.skip?.stats || 0}
      </p>
      <p className={`text-sm ${theme.colors.text}`}>
        Mission Fail - Coins: {mission.penalty?.missionFail?.coins || 0}, Stats: {mission.penalty?.missionFail?.stats || 0}
      </p>
    </div>
    <div>
      <h4 className={`text-md font-medium ${theme.colors.accent}`}>Quests</h4>
      <ul className={`list-disc list-inside ${theme.colors.text} text-sm space-y-1`}>
        {quests?.length ? (
          quests.map((quest, index) => (
            <li key={index}>
              {quest.title} (Stat: {quest.statAffected}, XP: {quest.xp})
            </li>
          ))
        ) : (
          <li>No quests available.</li>
        )}
      </ul>
    </div>
    <div className="flex gap-4">
      <button
        onClick={handleAccept}
        disabled={isAccepting}
        className={`flex-1 py-3 ${theme.colors.success} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover-glow`}
        aria-label="Accept mission"
      >
        <CheckCircle size={18} className={isAccepting ? 'animate-spin' : ''} />
        {isAccepting ? 'Accepting...' : 'Accept Mission'}
      </button>
      <button
        onClick={handleBack}
        disabled={isAccepting}
        className={`flex-1 py-3 ${theme.colors.button} text-white font-semibold rounded-md flex items-center justify-center transition-all disabled:opacity-60 hover-glow`}
        aria-label="Back to form"
      >
        Back to Form
      </button>
    </div>
  </div>
));

MissionDetails.propTypes = {
  mission: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    rank: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    reward: PropTypes.shape({
      xp: PropTypes.number,
      coins: PropTypes.number,
      specialReward: PropTypes.string,
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
  quests: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      statAffected: PropTypes.string.isRequired,
      xp: PropTypes.number.isRequired,
    })
  ),
  handleAccept: PropTypes.func.isRequired,
  isAccepting: PropTypes.bool.isRequired,
  handleBack: PropTypes.func.isRequired,
};

/**
 * Main AddMission Component
 */
const AddMission = () => {
  const [formState, setFormState] = useState({ goal: '', duration: 7 });
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [message, setMessage] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const pushNotification = useNotificationStore((state) => state.push);

  const handleGenerate = useCallback(async () => {
    if (!formState.goal || formState.duration < 1) {
      setMessage({ type: 'error', text: 'Please provide a valid goal and duration.' });
      pushNotification({
        type: 'mission',
        key: 'error',
        delta: 0,
        newValue: 'Invalid goal or duration',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axiosInstance.post('/mission/create', {
        description: formState.goal,
        days: formState.duration,
      });
      setMissionData({ mission: response.data.mission, quests: response.data.quests });
      setMessage({ type: 'success', text: response.data.message });
      pushNotification({
        type: 'mission',
        key: 'generated',
        delta: 0,
        newValue: response.data.mission.title,
      });
      console.log('Mission Response:', response.data);
    } catch (error) {
      console.error('Error generating mission:', error);
      setMessage({ type: 'error', text: 'Failed to generate mission. Please try again.' });
      pushNotification({
        type: 'mission',
        key: 'error',
        delta: 0,
        newValue: 'Failed to generate mission',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formState.goal, formState.duration, pushNotification]);

  const handleAccept = useCallback(async () => {
    if (!missionData?.mission?._id) return;

    setIsAccepting(true);
    setMessage(null);

    try {
      await axiosInstance.post('/mission/join', { missionId: missionData.mission._id });
      setMessage({ type: 'success', text: 'Mission accepted successfully!' });
      pushNotification({
        type: 'mission',
        key: 'accepted',
        delta: 0,
        newValue: missionData.mission.title,
      });
      setFormState({ goal: '', duration: 7 });
      setMissionData(null);
    } catch (error) {
      console.error('Error accepting mission:', error);
      setMessage({ type: 'error', text: 'Failed to accept mission. Please try again.' });
      pushNotification({
        type: 'mission',
        key: 'error',
        delta: 0,
        newValue: 'Failed to accept mission',
      });
    } finally {
      setIsAccepting(false);
    }
  }, [missionData, pushNotification]);

  const handleBack = useCallback(() => {
    setMissionData(null);
    setMessage(null);
  }, []);

  return (
    <><AuthLayout>
    <div className={`min-h-screen ${theme.colors.background} flex items-center justify-center p-6`}>
      <style>{styles}</style>
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center mb-6">
          <h1
            className={`${theme.colors.title} text-4xl font-bold mb-2 text-glow`}
            style={{ fontFamily: theme.fonts.primary, textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
          >
            AI MISSION CRAFT
          </h1>
          <p
            className={`${theme.colors.accent} text-lg font-semibold tracking-wide`}
            style={{ fontFamily: theme.fonts.primary }}
          >
            Unleash your destiny! Describe your goal and set the days—let the AI weave a bespoke mission to conquer your ambitions.
          </p>
          <Link
            to="/add-custom"
            className={`mt-4 inline-flex items-center px-4 py-2 ${theme.colors.button} text-white rounded-md hover-glow transition-all`}
            aria-label="Back to missions"
          >
            <FilePenLine size={18} className="mr-2" /> Custom Mission
          </Link>
        </div>
        {isLoading && <LoadingState />}
        {message && <Message message={message} />}
        {!missionData ? (
          <MissionForm
            formState={formState}
            setFormState={setFormState}
            handleGenerate={handleGenerate}
            isLoading={isLoading}
          />
        ) : (
          <MissionDetails
            mission={missionData.mission}
            quests={missionData.quests}
            handleAccept={handleAccept}
            isAccepting={isAccepting}
            handleBack={handleBack}
          />
        )}
      </div>
    </div></AuthLayout></>
  );
};

export default AddMission;