import { useState, useEffect, useCallback, memo } from 'react';
import { PlusCircle, CheckCircle, Skull, Star, ListTodo, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useNotificationStore } from '../store/notificationStore';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

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
    error: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
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
  .hover-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
  }
  .alert {
    animation: fadeInUp 0.3s ease-out;
  }
  .spinner {
    border-top-color: rgba(139, 92, 246, 0.8);
  }
`;

/**
 * Dismissible Alert Component
 */
const Alert = memo(({ message, onDismiss }) => (
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
));

Alert.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * Custom Mission Form Component
 */
const CustomMissionForm = memo(({ tasks, setTasks, duration, setDuration, handleSubmit, isLoading }) => {
  const addTask = () => setTasks((prev) => [...prev, '']);
  const updateTask = useCallback((value, index) => {
    setTasks((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, [setTasks]);
  const removeTask = (index) => setTasks((prev) => prev.filter((_, i) => i !== index));

  return (
    <div
      className={`${theme.colors.card} rounded-2xl p-8 ${theme.colors.border} ${theme.colors.shadow} space-y-6 ${theme.animations.fadeInUp}`}
      style={{ fontFamily: theme.fonts.primary }}
    >
      <h2 className={`${theme.colors.title} text-2xl font-semibold`}>Custom Mission Builder</h2>

      <div>
        <label className={`block text-sm mb-1 ${theme.colors.text}`}>Duration (in days)</label>
        <input
          type="number"
          min={1}
          aria-label="Mission duration"
          aria-invalid={duration < 1}
          className={`w-full px-4 py-2 rounded-md ${theme.colors.input} ${theme.colors.border} focus:outline-none focus:ring-2 focus:ring-purple-500 ${theme.colors.text}`}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        {duration < 1 && <p className={`${theme.colors.muted} text-xs mt-1`}>Duration must be at least 1 day.</p>}
      </div>

      <div>
        <label className={`block text-sm mb-1 ${theme.colors.text}`}>Tasks</label>
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={task}
              aria-label={`Task ${index + 1}`}
              aria-invalid={!task.trim()}
              placeholder={`Task ${index + 1}`}
              onChange={(e) => updateTask(e.target.value, index)}
              className={`flex-1 px-4 py-2 rounded-md ${theme.colors.input} ${theme.colors.border} ${theme.colors.text}`}
            />
            <button
              onClick={() => removeTask(index)}
              aria-label={`Remove task ${index + 1}`}
              className={`${theme.colors.error} text-white p-1 rounded-full hover-glow`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addTask}
          className={`w-full mt-2 py-2 ${theme.colors.button} text-white rounded-md hover-glow flex items-center justify-center gap-2`}
          disabled={tasks.some((t) => !t.trim())}
        >
          <PlusCircle size={18} /> Add Task
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || tasks.length === 0 || tasks.some((t) => !t.trim()) || duration < 1}
        className={`w-full py-3 ${theme.colors.success} text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-all hover-glow`}
        aria-label="Create mission"
      >
        <ListTodo size={18} className={isLoading ? 'animate-spin spinner' : ''} />
        {isLoading ? 'Creating...' : 'Create Mission'}
      </button>
    </div>
  );
});

CustomMissionForm.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.string).isRequired,
  setTasks: PropTypes.func.isRequired,
  duration: PropTypes.number.isRequired,
  setDuration: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

/**
 * Custom Mission Result Component
 */
const CustomMissionResult = memo(({ mission, quests, onAccept, onDelete, isProcessing }) => (
  <div
    className={`${theme.colors.card} rounded-2xl p-8 ${theme.colors.border} ${theme.colors.shadow} space-y-4 ${theme.animations.fadeInUp}`}
    style={{ fontFamily: theme.fonts.primary }}
  >
    <h2 className={`${theme.colors.title} text-xl font-semibold`}>{mission.title}</h2>
    <p className={theme.colors.text}>{mission.description}</p>
    <p className={`text-sm ${theme.colors.muted}`}>Rank: <span className="capitalize">{mission.rank}</span> | Duration: {mission.duration} days</p>

    <div>
      <h4 className={`${theme.colors.success} font-semibold flex items-center gap-1`}><Star size={16} /> Rewards</h4>
      <p className={theme.colors.text}>XP: {mission.reward?.xp || 0}</p>
      <p className={theme.colors.text}>Coins: {mission.reward?.coins || 0}</p>
      {mission.reward?.specialReward && (
        <p className={`capitalize ${theme.colors.text}`}>Special: {mission.reward.specialReward}</p>
      )}
    </div>

    <div>
      <h4 className={`${theme.colors.error} font-semibold flex items-center gap-1`}><Skull size={16} /> Penalties</h4>
      <p className={theme.colors.text}>Skip: {mission.penalty?.skip?.coins} coins, {mission.penalty?.skip?.stats} stats</p>
      <p className={theme.colors.text}>Mission Fail: {mission.penalty?.missionFail?.coins} coins, {mission.penalty?.missionFail?.stats} stats</p>
    </div>

    <div>
      <h4 className={`${theme.colors.accent} font-semibold`}>Quests</h4>
      <ul className="list-disc list-inside text-sm space-y-1">
        {quests.map((q, i) => (
          <li key={i} className={theme.colors.text}>
            {q.title} ({q.statAffected}, {q.xp} XP)
          </li>
        ))}
      </ul>
    </div>

    <div className="flex gap-4 pt-4">
      <button
        onClick={onAccept}
        disabled={isProcessing}
        className={`flex-1 py-2 ${theme.colors.success} text-white font-semibold rounded-md flex items-center justify-center gap-2 hover-glow`}
        aria-label="Accept mission"
      >
        <CheckCircle size={18} className={isProcessing ? 'animate-spin spinner' : ''} />
        {isProcessing ? 'Accepting...' : 'Accept'}
      </button>

      <button
        onClick={onDelete}
        disabled={isProcessing}
        className={`flex-1 py-2 ${theme.colors.error} text-white font-semibold rounded-md flex items-center justify-center gap-2 hover-glow`}
        aria-label="Delete mission"
      >
        <Trash2 size={18} className={isProcessing ? 'animate-spin spinner' : ''} />
        {isProcessing ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </div>
));

CustomMissionResult.propTypes = {
  mission: PropTypes.object.isRequired,
  quests: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAccept: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool.isRequired,
};

/**
 * Main AddCustomMission Component
 */
const AddCustomMission = () => {
  const [tasks, setTasks] = useState(['']);
  const [duration, setDuration] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [missionResult, setMissionResult] = useState(null);
  const [message, setMessage] = useState(null);
  const pushNotification = useNotificationStore((s) => s.push);

  const debouncedHandleSubmit = useCallback(
    debounce(async () => {
      if (tasks.length === 0 || tasks.some((t) => !t.trim()) || duration < 1) {
        setMessage({ type: 'error', text: 'Please add valid tasks and duration.' });
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        const response = await axiosInstance.post('/mission/createCustom', { tasks, days: duration });
        setMissionResult(response.data);
        setMessage({ type: 'success', text: 'Mission created successfully!' });
        pushNotification({ type: 'mission', key: 'custom-created', delta: 0, newValue: response.data.mission.title });
      } catch (err) {
        console.error('Mission creation error:', err);
        setMessage({ type: 'error', text: 'Failed to create mission. Try again.' });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [tasks, duration, pushNotification]
  );

  const handleAccept = useCallback(async () => {
    if (!missionResult?.mission?._id) return;

    setIsProcessing(true);
    try {
      await axiosInstance.post('/mission/join', { missionId: missionResult.mission._id });
      setMessage({ type: 'success', text: 'Mission accepted successfully!' });
      pushNotification({ type: 'mission', key: 'accepted', delta: 0, newValue: missionResult.mission.title });
      setMissionResult(null);
      setTasks(['']);
      setDuration(7);
    } catch (err) {
      console.error('Mission accept error:', err);
      setMessage({ type: 'error', text: 'Failed to accept mission.' });
    } finally {
      setIsProcessing(false);
    }
  }, [missionResult, pushNotification]);

  const handleDelete = useCallback(async () => {
    if (!missionResult?.mission?._id) return;

    setIsProcessing(true);
    try {
      await axiosInstance.post('/mission/delete', { missionId: missionResult.mission._id });
      setMessage({ type: 'success', text: 'Mission deleted successfully.' });
      pushNotification({ type: 'mission', key: 'deleted', delta: 0, newValue: missionResult.mission.title });
      setMissionResult(null);
      setTasks(['']);
      setDuration(7);
    } catch (err) {
      console.error('Mission delete error:', err);
      setMessage({ type: 'error', text: 'Failed to delete mission.' });
    } finally {
      setIsProcessing(false);
    }
  }, [missionResult, pushNotification]);

  const handleDismiss = () => setMessage(null);

  return (
    <div className={`min-h-screen ${theme.colors.background} flex items-center justify-center p-6`}>
      <style>{styles}</style>
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center mb-6">
          <h1
            className={`${theme.colors.title} text-4xl font-bold mb-2 text-glow`}
            style={{ fontFamily: theme.fonts.primary, textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
          >
            CREATE CUSTOM MISSION
          </h1>
          <p
            className={`${theme.colors.accent} text-lg font-semibold tracking-wide`}
            style={{ fontFamily: theme.fonts.primary }}
          >
            Forge your own epic quest! Define custom tasks and set the duration to craft a personalized mission tailored to your journey.
          </p>
          <Link
            to="/missions"
            className={`mt-4 inline-flex items-center px-4 py-2 ${theme.colors.button} text-white rounded-md hover-glow transition-all`}
            aria-label="Back to missions"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to Missions
          </Link>
        </div>

        {message && <Alert message={message} onDismiss={handleDismiss} />}
        {!missionResult ? (
          <CustomMissionForm
            tasks={tasks}
            setTasks={setTasks}
            duration={duration}
            setDuration={setDuration}
            handleSubmit={debouncedHandleSubmit}
            isLoading={isLoading}
          />
        ) : (
          <CustomMissionResult
            mission={missionResult.mission}
            quests={missionResult.quests}
            onAccept={handleAccept}
            onDelete={handleDelete}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default AddCustomMission;