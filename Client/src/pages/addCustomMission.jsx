import { useState, useEffect, useCallback, memo } from 'react';
import { PlusCircle, CheckCircle, Skull, Star, ListTodo, Trash2, ArrowLeft, GripVertical, Check, Crosshair, Activity, Zap, Loader2, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import AuthLayout from '../components/AuthLayout';
import MissionInfoPanel from '../components/MissionInfoPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

// Centralized theme constants
const theme = {
  fonts: { primary: "'Exo 2', sans-serif" },
  colors: {
    background: 'bg-gradient-to-b from-[#030305] to-[#0a0a0f]',
    card: 'bg-[#050608] border border-[#1e2330]',
    input: 'bg-[#090b10] border-[#1e2330]',
    border: 'border-[#a855f7]/30',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    title: 'text-white',
    accent: 'text-[#a855f7]',
    button: 'bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9]',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
    error: 'bg-red-950/30 border-red-500/50 text-red-400',
    text: 'text-gray-200',
    muted: 'text-gray-500',
  },
};

const styles = `
  .hover-glow:hover {
    box-shadow: 0 0 20px rgba(168,85,247, 0.4);
  }
`;

/**
 * Dismissible Alert Component
 */
const Alert = memo(({ message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    role="alert"
    aria-live="polite"
    className={`p-4 border font-['Rajdhani'] font-bold tracking-widest text-sm flex justify-between items-center ${
      message.type === 'success' 
        ? 'bg-green-950/30 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
        : theme.colors.error
    } mb-6`}
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
  >
    <div className="flex items-center gap-3">
      {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Skull className="w-4 h-4" />}
      <span>{message.text}</span>
    </div>
    <button onClick={onDismiss} aria-label="Dismiss alert" className="opacity-50 hover:opacity-100 transition-opacity">
      ✕
    </button>
  </motion.div>
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
  const [draggedIdx, setDraggedIdx] = useState(null);

  const addTask = () => setTasks((prev) => [...prev, '']);
  const updateTask = useCallback((value, index) => {
    setTasks((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, [setTasks]);
  const removeTask = (index) => setTasks((prev) => prev.filter((_, i) => i !== index));

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    setTasks(prev => {
      const newTasks = [...prev];
      const items = newTasks.splice(draggedIdx, 1);
      newTasks.splice(index, 0, items[0]);
      return newTasks;
    });
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div
      className={`${theme.colors.card} p-1 relative overflow-hidden group transition-all duration-500`}
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      
      <div className="bg-[#090b10] h-full p-8 md:p-10 relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
        {/* Decorative Grid */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#a855f7] to-transparent opacity-50"></div>

        <div className="flex items-center gap-3 mb-8">
          <Crosshair className="w-6 h-6 text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <div>
            <h3 className="text-[#a855f7] text-[10px] font-black tracking-[0.4em] font-['Rajdhani']">SYSTEM AUTHORIZATION</h3>
            <h2 className={`${theme.colors.title} text-3xl font-black italic tracking-wide`}>CUSTOM DIRECTIVE BUILDER</h2>
          </div>
        </div>

        <div className="space-y-8">
          {/* Duration Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-black ${theme.colors.text} font-['Rajdhani'] tracking-[0.2em] flex items-center gap-2`}>
                <Clock className="w-4 h-4 text-[#a855f7]" /> DURATION PROTOCOL (DAYS)
              </label>
              <span className="text-[10px] text-gray-600 font-['Rajdhani'] tracking-widest border border-white/10 px-2 py-0.5">MIN: 1 DAY</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center bg-[#121319] border-r border-[#1e2330]">
                <Activity className="w-5 h-5 text-gray-500" />
              </div>
              <Input
                type="number"
                min={1}
                aria-label="Mission duration"
                aria-invalid={duration < 1}
                className={`w-full pl-16 bg-[#050608] border-[#1e2330] text-white focus-visible:ring-1 focus-visible:ring-[#a855f7]/50 focus-visible:border-[#a855f7]/50 h-14 text-xl font-['Rajdhani'] font-bold tracking-wider rounded-none`}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            {duration < 1 && <p className={`text-red-400 text-[10px] tracking-widest font-bold font-['Rajdhani'] mt-2 flex items-center gap-1`}><Skull className="w-3 h-3" /> INVALID DURATION PARAMETER.</p>}
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            <label className={`block text-xs font-black ${theme.colors.text} font-['Rajdhani'] tracking-[0.2em] flex items-center gap-2`}>
              <ListTodo className="w-4 h-4 text-[#a855f7]" /> SUB-ROUTINE PARAMETERS
            </label>
            
            <div className="space-y-3 relative">
              <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-[#1e2330] z-0"></div>
              
              <AnimatePresence>
                {tasks.map((task, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={index} 
                    className={`flex items-center gap-0 bg-[#050608] border transition-all duration-300 relative z-10 
                      ${draggedIdx === index 
                        ? 'border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]' 
                        : 'border-[#1e2330] hover:border-gray-600'}`
                    }
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    <div className="w-12 h-14 flex items-center justify-center cursor-grab hover:text-[#a855f7] text-gray-600 bg-[#121319] border-r border-[#1e2330]" aria-label="Drag to reorder">
                      <GripVertical size={16} />
                    </div>
                    
                    <div className="flex-1 flex items-center relative">
                      <span className="absolute left-4 text-[10px] font-black text-gray-600 font-['Rajdhani'] tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                      <Input
                        type="text"
                        value={task}
                        aria-label={`Task ${index + 1}`}
                        aria-invalid={!task.trim()}
                        placeholder="ENTER TASK PARAMETER..."
                        onChange={(e) => updateTask(e.target.value, index)}
                        className="w-full bg-transparent border-0 focus-visible:ring-0 text-white text-sm h-14 pl-12 pr-4 rounded-none shadow-none font-['Exo_2'] placeholder:text-gray-700 uppercase"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(index)}
                      aria-label={`Remove task ${index + 1}`}
                      className="w-14 h-14 rounded-none text-gray-500 hover:text-red-400 hover:bg-red-950/30 border-l border-[#1e2330]"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <Button
              type="button"
              onClick={addTask}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-12 bg-transparent border border-dashed border-[#1e2330] text-gray-500 hover:border-[#a855f7]/50 hover:text-[#a855f7] hover:bg-[#a855f7]/5 rounded-none font-['Rajdhani'] font-bold tracking-[0.2em] transition-all"
              disabled={tasks.some((t) => !t.trim())}
            >
              <PlusCircle size={16} /> ADD SUB-ROUTINE
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || tasks.length === 0 || tasks.some((t) => !t.trim()) || duration < 1}
          className={`w-full h-16 mt-10 text-sm tracking-[0.3em] font-black font-['Rajdhani'] transition-all 
            ${(isLoading || tasks.length === 0 || tasks.some((t) => !t.trim()) || duration < 1)
              ? 'bg-[#121319] text-gray-600 border border-[#1e2330] cursor-not-allowed'
              : 'bg-[#a855f7] text-white hover:bg-[#9333ea] hover-glow relative overflow-hidden group'
            } rounded-none`}
          aria-label="Create mission"
        >
          {!(isLoading || tasks.length === 0 || tasks.some((t) => !t.trim()) || duration < 1) && (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] pointer-events-none"></div>
          )}
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-[12px] font-black font-['Rajdhani'] tracking-[0.3em]">SYNTHESIZING PROTOCOLS...</span>
          </>
        ) : (
          <>
            <Check size={20} /> INITIATE DIRECTIVE SYNTHESIS
          </>
        )}
        </span>
      </Button>
    </div>
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
    className={`${theme.colors.card} p-1 relative overflow-hidden transition-all duration-500`}
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-[#a855f7]/10 opacity-100 transition-opacity duration-500 pointer-events-none`} />
    
    <div className="bg-[#050608] h-full p-8 md:p-10 relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[#a855f7] text-[10px] font-black tracking-[0.4em] font-['Rajdhani'] mb-1">SYNTHESIS COMPLETE</h3>
          <h2 className="text-3xl font-black italic tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{mission.title}</h2>
        </div>
        <div className="bg-[#121319] border border-[#1e2330] px-4 py-2 text-center" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
          <span className="block text-[10px] text-gray-500 font-['Rajdhani'] tracking-widest font-black">RANK</span>
          <span className="text-[#a855f7] font-black font-['Exo_2'] drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] leading-none text-xl capitalize">{mission.rank}</span>
        </div>
      </div>

      <div className="flex gap-6 mb-8 border-l-2 border-[#1e2330] pl-4">
        <p className="text-gray-400 font-light text-sm">{mission.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#090b10] border border-[#1e2330] p-4 relative overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,transparent_70%)]"></div>
          <h4 className="text-green-500 font-black tracking-widest font-['Rajdhani'] text-xs flex items-center gap-2 mb-4 border-b border-green-500/20 pb-2">
            <Star size={14} /> SYSTEM REWARDS
          </h4>
          <div className="space-y-2 text-sm font-['Exo_2']">
            <div className="flex justify-between items-center"><span className="text-gray-500">EXP GAIN</span> <span className="text-green-400 font-bold">+{mission.reward?.xp || 0}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500">SYSTEM COINS</span> <span className="text-yellow-400 font-bold">+{mission.reward?.coins || 0}</span></div>
            {mission.reward?.specialReward && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5"><span className="text-gray-500">SPECIAL</span> <span className="text-[#a855f7] font-bold capitalize drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">{mission.reward.specialReward}</span></div>
            )}
          </div>
        </div>

        <div className="bg-[#1e0a0a] border border-red-900/50 p-4 relative overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle,rgba(239,68,68,0.15)_0%,transparent_70%)]"></div>
          <h4 className="text-red-500 font-black tracking-widest font-['Rajdhani'] text-xs flex items-center gap-2 mb-4 border-b border-red-500/20 pb-2">
            <Skull size={14} /> FAILURE PENALTIES
          </h4>
          <div className="space-y-4 text-xs font-['Exo_2']">
            <div>
              <span className="block text-red-500/70 mb-1 font-['Rajdhani'] font-bold tracking-wider">SKIP PENALTY</span>
              <span className="text-red-300">-{mission.penalty?.skip?.coins} COINS, -{mission.penalty?.skip?.stats} STATS</span>
            </div>
            <div>
              <span className="block text-red-500/70 mb-1 font-['Rajdhani'] font-bold tracking-wider">MISSION FAIL PENALTY</span>
              <span className="text-red-300">-{mission.penalty?.missionFail?.coins} COINS, -{mission.penalty?.missionFail?.stats} STATS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h4 className="text-gray-400 font-black tracking-widest font-['Rajdhani'] text-xs flex items-center gap-2 mb-4">
          <ListTodo size={14} className="text-[#a855f7]" /> SYNTHESIZED SUB-ROUTINES <span className="text-gray-600 font-normal">({quests.length})</span>
        </h4>
        <div className="bg-[#090b10] border border-[#1e2330] p-4 relative">
          <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-[#1e2330]"></div>
          <ul className="space-y-4 relative z-10">
            {quests.map((q, i) => (
              <li key={i} className="flex gap-4 items-start">
                <div className="w-5 h-5 rounded-full bg-[#121319] border border-[#1e2330] flex items-center justify-center text-[10px] font-black text-gray-500 font-['Rajdhani'] mt-0.5 shrink-0">
                  {i+1}
                </div>
                <div>
                  <p className="text-gray-200 font-semibold text-sm mb-1">{q.title}</p>
                  <p className="text-[10px] font-['Rajdhani'] tracking-widest font-bold">
                    <span className="text-gray-500">STAT: </span><span className="text-[#a855f7]">{q.statAffected}</span> 
                    <span className="mx-2 text-gray-700">|</span> 
                    <span className="text-gray-500">REWARD: </span><span className="text-green-400">+{q.xp} XP</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
        <button
          onClick={onAccept}
          disabled={isProcessing}
          className={`flex-1 py-3 h-14 bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-['Rajdhani'] font-black tracking-[0.2em] relative overflow-hidden group hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
          aria-label="Accept mission"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] pointer-events-none hidden group-hover:block"></div>
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {isProcessing ? 'AUTHORIZING...' : 'ACCEPT DIRECTIVE'}
          </span>
        </button>

        <button
          onClick={onDelete}
          disabled={isProcessing}
        className={`flex-1 py-3 h-14 bg-[#1e0a0a] border border-red-900/50 text-red-500 hover:text-red-400 hover:bg-red-950/40 font-['Rajdhani'] font-black tracking-[0.2em] relative overflow-hidden transition-all`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
        aria-label="Delete mission"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 size={18} className="animate-spin text-red-500" /> : <Trash2 size={18} />}
          {isProcessing ? 'PURGING...' : 'DISCARD DIRECTIVE'}
        </span>
      </button>
    </div>
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
        setMessage({ type: 'error', text: 'INVALID DIRECTIVE PARAMETERS.' });
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        const response = await axiosInstance.post('/mission/createCustom', { tasks, days: duration });
        setMissionResult(response.data);
        setMessage({ type: 'success', text: 'DIRECTIVE SYNTHESIZED SUCCESSFULLY.' });
        pushNotification({ type: 'mission', key: 'custom-created', delta: 0, newValue: response.data.mission.title });
      } catch (err) {
        console.error('Mission creation error:', err);
        setMessage({ type: 'error', text: 'DIRECTIVE SYNTHESIS FAILED. RETRY.' });
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
      setMessage({ type: 'success', text: 'DIRECTIVE AUTHORIZED AND ACCEPTED.' });
      pushNotification({ type: 'mission', key: 'accepted', delta: 0, newValue: missionResult.mission.title });
      useUserStore.getState().triggerRefetch();
      setMissionResult(null);
      setTasks(['']);
      setDuration(7);
    } catch (err) {
      console.error('Mission accept error:', err);
      setMessage({ type: 'error', text: 'AUTHORIZATION FAILED.' });
    } finally {
      setIsProcessing(false);
    }
  }, [missionResult, pushNotification]);

  const handleDelete = useCallback(async () => {
    if (!missionResult?.mission?._id) return;

    setIsProcessing(true);
    try {
      await axiosInstance.post('/mission/delete', { missionId: missionResult.mission._id });
      setMessage({ type: 'success', text: 'DIRECTIVE PURGED FROM SYSTEM.' });
      pushNotification({ type: 'mission', key: 'deleted', delta: 0, newValue: missionResult.mission.title });
      setMissionResult(null);
      setTasks(['']);
      setDuration(7);
    } catch (err) {
      console.error('Mission delete error:', err);
      setMessage({ type: 'error', text: 'PURGE FAILED.' });
    } finally {
      setIsProcessing(false);
    }
  }, [missionResult, pushNotification]);

  const handleDismiss = () => setMessage(null);

  return (
    <AuthLayout>
      <div 
        className="min-h-screen bg-black text-white font-['Exo_2'] selection:bg-[#a855f7]/30 selection:text-white relative overflow-hidden pb-20 pt-6 md:pt-10"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 animate-pulse"
          style={{
            background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.15), transparent 80%)'
          }}
        />
        {/* Base Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:60px_60px] pointer-events-none" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.15)_0%,transparent_70%)] blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_70%)] blur-[50px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <style>{styles}</style>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2330] pb-6 mb-8">
            <div>
              <Link to="/missions" className="inline-flex items-center text-[#a855f7] hover:text-[#c084fc] font-['Rajdhani'] font-bold tracking-widest text-sm mb-4 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> RETURN TO DIRECTIVES
              </Link>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-wider drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">SYNTHESIZE DIRECTIVE</h1>
              <p className="text-gray-400 mt-2 font-light max-w-xl">
                Define custom operational parameters and durational constraints to generate a personalized system directive.
              </p>
            </div>
            
            <div className="hidden md:block">
              <div className="w-16 h-16 border-2 border-[#a855f7]/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="w-2 h-2 bg-[#a855f7] rounded-full shadow-[0_0_10px_rgba(168,85,247,1)] blur-[1px]"></div>
              </div>
            </div>
          </div>

          {message && <AnimatePresence><Alert message={message} onDismiss={handleDismiss} /></AnimatePresence>}
          
          <div className="relative">
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
          
          <div className="pt-12">
            <MissionInfoPanel sections={['ai-vs-custom','rewards','penalties','streak-upgrade']} title="SYSTEM MANUAL" />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default AddCustomMission;