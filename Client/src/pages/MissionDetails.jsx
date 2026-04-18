import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { ArrowLeft, CheckCircle, Loader2, Trash2, Target, Zap, ShieldAlert, Clock, Activity, Crosshair } from 'lucide-react'; // Added System Icons
import axiosInstance from '../utils/axios';
import { useTrackerStore } from '../store/trackerStore';
import { processQuestResponse } from '../utils/processQuestres';
import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import MissionInfoPanel from '../components/MissionInfoPanel';
import AuthLayout from '../components/AuthLayout';
import SoloLoading from '../components/Loading';
import { motion, AnimatePresence } from 'framer-motion';

// GraphQL Query
const GET_TRACKER = gql`
  query GetTrackerById($id: ID!) {
    getTrackerById(id: $id) {
      id
      title
      streak
      daycount
  lastUpdated
  lastCompleted
  lastStreakReset
  completedDays
      description
      currentQuests {
        id
        title
        xp
        statAffected
      }
      remainingQuests {
        id
      }
    }
  }
`;

// Sub-component for Quest Item
const QuestItem = ({ quest, isRemaining, handleComplete }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, height: 0 }}
    className={`group relative flex justify-between items-center p-5 mb-4 border transition-all duration-300 overflow-hidden font-['Exo_2'] cursor-pointer
      ${isRemaining 
        ? 'bg-[#090b10] border-[#1e2330] hover:border-[#3b82f6]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
        : 'bg-[#050608] border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
      }`} 
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
  >
    {/* Hover highlight line */}
    {isRemaining && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
    
    <div className="relative z-10 flex-1">
      <div className="flex items-center gap-3 mb-1">
        <Target className={`w-4 h-4 ${isRemaining ? 'text-[#3b82f6]' : 'text-green-500'}`} />
        <p className={`font-bold text-lg tracking-wide ${isRemaining ? 'text-white group-hover:text-[#3b82f6] transition-colors' : 'text-green-500/80 line-through'}`}>
          {quest.title}
        </p>
      </div>
      <div className="flex items-center gap-4 mt-2 font-['Rajdhani'] tracking-widest pl-7">
        <span className="text-[10px] text-gray-500 uppercase">
          STAT: <span className={`font-bold ${isRemaining ? 'text-purple-400' : 'text-gray-600'}`}>{quest.statAffected}</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-white/10"></span>
        <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
          XP: <span className={`font-bold ${isRemaining ? 'text-green-400' : 'text-gray-600'}`}>+{quest.xp}</span>
        </span>
      </div>
    </div>

    <div className="relative z-10 ml-6 pl-6 border-l border-white/5">
      {isRemaining ? (
        <button
          onClick={() => handleComplete(quest)}
          className="flex items-center justify-center w-12 h-12 rounded-sm bg-[#121319] border border-[#1e2330] group-hover:border-[#3b82f6]/50 group-hover:bg-[#3b82f6]/10 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_2s_infinite]"></div>
          <span className="w-4 h-4 border-2 border-gray-600 group-hover:border-[#3b82f6] rounded-full transition-colors"></span>
        </button>
      ) : (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center w-12 h-12"
        >
          <CheckCircle className="w-8 h-8 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
        </motion.div>
      )}
    </div>
  </motion.div>
);

// Sub-component for Error State
const ErrorState = ({ error, navigate }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#030305] text-red-500 font-['Rajdhani'] tracking-widest relative overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    <ShieldAlert className="w-16 h-16 mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
    <h2 className="text-3xl font-bold mb-2">SYSTEM ERROR</h2>
    <p className="mb-8 text-sm text-red-400/80 uppercase">Failed to load directive parameters: {error.message}</p>
    <button
      onClick={() => navigate(-1)}
      className="px-8 py-3 bg-[#1e0a0a] border border-red-500/50 hover:bg-red-900/40 hover:border-red-400 text-red-300 transition-all duration-300 font-bold"
    >
      INITIATE RETREAT
    </button>
  </div>
);

// Reusable Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, isConfirming, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[100] backdrop-blur-md font-['Exo_2']">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#050608] p-8 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-w-md w-full mx-4 relative overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(239,68,68,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,1)]" />
          <h2 className="text-2xl font-black text-red-100 tracking-wide">{title}</h2>
        </div>
        
        <div className="text-gray-400 mb-8 font-light text-sm">{children}</div>
        
        <div className="flex justify-end gap-4 mt-6 border-t border-white/5 pt-6">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-6 py-2 bg-[#121319] hover:bg-[#1a1b23] border border-gray-700 text-gray-300 font-['Rajdhani'] font-bold tracking-widest transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-6 py-2 bg-red-950 border border-red-500/50 hover:bg-red-900 text-red-300 font-['Rajdhani'] font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRM ABANDON"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ================= Time Left + Calendar Component =================
const CountdownAndCalendar = ({ tracker }) => {
  const [now, setNow] = useState(Date.now());
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000); 
    return () => clearInterval(i);
  }, []);

  const endOfDay = (() => {
    const d = new Date();
    d.setHours(23,59,59,999);
    return d.getTime();
  })();
  const msLeft = endOfDay - now;
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const allDoneToday = tracker.remainingQuests?.length === 0;

  // Build month grid
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const completedSet = new Set((tracker.completedDays || []).map(d => d.split('T')[0]));

  const cells = [];
  for (let i=0;i<firstDayIndex;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) {
    const dateObj = new Date(year, month, d); dateObj.setHours(0,0,0,0);
    const iso = dateObj.toISOString().split('T')[0];
    const isToday = dateObj.getTime() === today.getTime();
    const completed = completedSet.has(iso) || (isToday && allDoneToday);
    cells.push({ d, iso, isToday, completed });
  }

  return (
    <div className="mt-8 font-['Rajdhani']">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">SYSTEM RESET IN:</div>
          <div className="font-['Exo_2'] text-2xl font-black text-[#a855f7] bg-[#090b10] border border-[#1e2330] px-4 py-2 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)] drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
            {allDoneToday ? 'CLEARED' : `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`}
          </div>
        </div>
        
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-bold tracking-[0.2em] px-6 py-3 bg-[#121319] border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/10 transition-all duration-300 flex items-center gap-2"
        >
          <Activity className="w-4 h-4" /> REVEAL LOGS
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[#090b10] border border-[#a855f7]/40 p-1 font-['Exo_2']"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
            >
              <div className="bg-[#050608] h-full p-8 relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >✕</button>
                
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-[#a855f7] animate-ping"></div>
                  <h3 className="text-[#a855f7] font-black tracking-[0.3em] font-['Rajdhani']">HISTORICAL LOG // CALENDAR</h3>
                </div>

                <div className="flex items-center justify-between mb-6 bg-[#121319] p-3 border border-white/5">
                  <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} className="text-gray-500 hover:text-[#a855f7] px-3 font-black">&lt;&lt;</button>
                  <span className="text-lg text-white font-bold tracking-widest uppercase font-['Rajdhani']">
                    {monthCursor.toLocaleString(undefined,{ month:'long', year:'numeric'})}
                  </span>
                  <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} className="text-gray-500 hover:text-[#a855f7] px-3 font-black">&gt;&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs font-black tracking-widest text-gray-600 mb-2 font-['Rajdhani']">
                  {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d} className="text-center py-2">{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {cells.map((c,i) => c ? (
                    <div key={i} className={`relative h-14 flex flex-col items-center justify-center border font-bold transition-all duration-300
                      ${c.completed 
                        ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6] shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' 
                        : 'bg-[#121319] border-[#1e2330] text-gray-500 hover:border-gray-600'}
                      ${!c.completed && c.isToday ? 'ring-1 ring-[#a855f7] bg-[#a855f7]/5 text-white' : ''}`}
                      title={`${c.iso}${c.completed ? ' - Logged' : c.isToday ? ' - Current' : ''}`}
                    >
                      <span className="font-['Exo_2'] text-sm">{c.d}</span>
                      {c.completed && <CheckCircle className="w-4 h-4 mt-1 absolute bottom-1 right-1 opacity-50" />}
                      {c.isToday && !c.completed && <div className="absolute top-1 right-1 w-2 h-2 bg-[#a855f7] rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]" />}
                    </div>
                  ) : <div key={i} className="bg-[#030305]" />)}
                </div>
                
                <div className="mt-8 flex gap-4 text-[10px] text-gray-500 font-['Rajdhani'] font-bold tracking-widest border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#3b82f6]/20 border border-[#3b82f6]/50"></div> CLEAR</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#121319] border border-[#1e2330]"></div> PENDING</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#a855f7]/5 border border-[#a855f7]"></div> CURRENT CYCLE</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


const MissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateStreak = useTrackerStore((s) => s.updateStreak);
  const deleteTracker = useTrackerStore((s) => s.deleteTracker); 

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 


  const updateCoin = useUserStore(s=>s.updateCoin);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await axiosInstance.post(`/tracker/${id}/abandon`);
      if(res?.data && res.data.remainingCoins !== undefined){
        updateCoin(res.data.remainingCoins);
      }
      deleteTracker(id);
      navigate('/missions');
    } catch (err) {
      console.error('Failed to delete mission:', err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await axiosInstance.post('/mission/upgrade', { trackerId: id });
      refetch();
    } catch (err) {
      console.error('Upgrade failed:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const { data, loading, error, refetch } = useQuery(GET_TRACKER, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  const tracker = data?.getTrackerById;

  const handleComplete = async (quest) => {
    try {
      const res = await axiosInstance.post('/quest/complete', {
        questId: quest.id,
        trackerid: id,
        xp: quest.xp,
        statAffected: quest.statAffected,
      });

      processQuestResponse(res.data, quest.xp);
      const updatedRemaining = tracker.remainingQuests.filter((q) => q.id !== quest.id);
      if(updatedRemaining.length === 0){
        updateStreak(id);
      }
      refetch();
    } catch (err) {
      console.error('Quest completion failed:', err);
    }
  };

  if (error) return <ErrorState error={error} navigate={navigate} />;

  const remainingIds = tracker?.remainingQuests?.map((q) => q.id) || [];

  return (
    <AuthLayout>
      <SoloLoading loading={loading} message="ACCESSING DIRECTIVE DATA..." />
      {!loading && tracker && (
        <div 
          className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] pb-24 relative overflow-hidden font-['Exo_2']"
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
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[30vh] bg-gradient-to-b from-[#3b82f6]/10 to-transparent pointer-events-none filter blur-[100px]"></div>

          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
            {/* Nav Row */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white flex items-center font-['Rajdhani'] font-bold tracking-widest text-xs transition-colors duration-300"
              >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center mr-2 border border-white/10">
                  <ArrowLeft className="w-3 h-3" />
                </div>
                RETURN TO LOG
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-500 hover:text-red-400 flex items-center font-['Rajdhani'] font-bold tracking-widest text-[10px] transition-colors duration-300 bg-red-950/30 px-3 py-1.5 border border-red-900/50 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                TERMINATE DIRECTIVE
              </button>
            </div>

            {/* Mission Header */}
            <div className="mb-12 relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-[#3b82f6] to-transparent"></div>
              
              <div className="flex items-center gap-3 mb-3">
                <Crosshair className="w-5 h-5 text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <h3 className="text-[#3b82f6] text-xs font-black tracking-[0.4em] font-['Rajdhani']">ACTIVE ENGAGEMENT // DETAILS</h3>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4">
                {tracker.title || 'UNNAMED_DIRECTIVE'}
              </h1>
              
              <p className="text-gray-400 text-lg font-light leading-relaxed max-w-3xl border-l-2 border-white/10 pl-4 py-1">
                {tracker.description || 'Proceed with target evaluation and maintain continuous effort.'}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex flex-col bg-[#090b10] border border-[#1e2330] px-6 py-3">
                  <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] font-['Rajdhani'] mb-1">CURRENT DAY</span>
                  <span className="text-white font-black text-xl">{tracker.daycount}</span>
                </div>
                <div className="flex flex-col bg-orange-500/5 border border-orange-500/20 px-6 py-3">
                  <span className="text-[10px] text-orange-500/70 font-bold tracking-[0.2em] font-['Rajdhani'] mb-1">ACTIVE STREAK</span>
                  <span className="text-orange-400 font-black text-xl flex items-center gap-2">
                    <Zap className="w-4 h-4" /> {tracker.streak || 0}
                  </span>
                </div>
              </div>

              <CountdownAndCalendar tracker={tracker} />
            </div>

            {/* Upgrade Panel */}
            {tracker.streak >= 5 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 bg-gradient-to-r from-purple-900/20 to-pink-900/10 border border-purple-500/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
              >
                <div>
                  <h4 className="text-purple-400 font-bold tracking-widest text-sm font-['Rajdhani'] mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" /> THRESHOLD REACHED
                  </h4>
                  <p className="text-gray-400 text-sm">Continuous dedication detected (Streak: {tracker.streak}). Ready to escalate difficulty parameters?</p>
                </div>
                
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black tracking-widest text-xs font-['Rajdhani'] shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap min-w-[180px] justify-center scale-95 hover:scale-100"
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "INITIATE UPGRADE"}
                </button>
              </motion.div>
            )}

            {/* Quests Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center text-[#3b82f6] text-[10px] font-['Rajdhani']">Q</span>
                  DAILY SUB-DIRECTIVES
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#1e2330] to-transparent"></div>
              </div>

              <div className="grid gap-0 relative">
                {/* Vertical connecting line for quests */}
                <div className="absolute left-6 top-8 bottom-8 w-[1px] bg-[#1e2330] z-0 hidden sm:block"></div>
                
                <AnimatePresence>
                  {tracker.currentQuests?.length > 0 ? (
                    tracker.currentQuests.map((quest) => (
                      <QuestItem
                         key={quest.id}
                         quest={quest}
                         isRemaining={remainingIds.includes(quest.id)}
                         handleComplete={handleComplete}
                       />
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 bg-[#050608]">
                      <Activity className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold tracking-[0.2em] font-['Rajdhani']">NO PARAMETERS ASSIGNED FOR CURRENT CYCLE</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Guidance Panel */}
            <div className="border border-[#1e2330] bg-[#050608] mt-10 p-1 font-['Exo_2']" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
              <div className="bg-[#090b10] border border-white/5 h-full p-2 pl-4" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
                <MissionInfoPanel sections={['penalties','rewards','calendar-reset','streak-upgrade']} title="SYSTEM LOGIC & RULES" />
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        title="WARNING: FATAL ACTION"
      >
        <p className="mb-2 uppercase tracking-wide text-red-100 font-bold border-l-2 border-red-500 pl-3">
          Terminating this directive will erase all accumulated data & progress.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-red-500">
          <li><strong>Penalty:</strong> <span className="text-yellow-500">Up to 5 system coins</span> will be deducted.</li>
          <li>Zero rewards or streak benefits will be granted.</li>
          <li>This action is irreversible.</li>
        </ul>
      </ConfirmationModal>
    </AuthLayout>
  );
};

export default MissionDetails;