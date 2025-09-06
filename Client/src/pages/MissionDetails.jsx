import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { ArrowLeft, CheckCircle, Loader2, Trash2 } from 'lucide-react'; // Added Trash2
import axiosInstance from '../utils/axios';
import { useTrackerStore } from '../store/trackerStore';
import { processQuestResponse } from '../utils/processQuestres';
import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { theme } from './Ineventory';
import MissionInfoPanel from '../components/MissionInfoPanel';
import AuthLayout from '../components/AuthLayout';
import SoloLoading from '../components/Loading';

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
  <div className="flex justify-between items-center bg-gray-950/50 p-4 rounded-lg mb-3 border border-purple-500/50 hover:shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-shadow duration-300" style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
    <div>
      <p className="font-medium text-white text-lg">{quest.title}</p>
      <p className="text-sm text-purple-300">
        Stat: <span className='text-purple-500'>{quest.statAffected}</span>  <span className='text-green-400'>• XP: +{quest.xp}</span>
      </p>
    </div>
    {isRemaining ? (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5 text-purple-500 bg-gray-800 border-purple-600 focus:ring-purple-500"
          onChange={() => handleComplete(quest)}
        />
        <span className="ml-2 text-sm text-purple-300">Mark Complete</span>
      </label>
    ) : (
      <CheckCircle className="w-6 h-6 text-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
    )}
  </div>
);

// Sub-component for Error State
const ErrorState = ({ error, navigate }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-red-400" style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
    <p className="mb-4 text-lg">Failed to load mission: {error.message}</p>
    <button
      onClick={() => navigate(-1)}
      className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-rose-600/20 hover:from-red-500 hover:to-rose-500/30 text-red-300 flex items-center transition-colors duration-300"
    >
      <ArrowLeft className="inline w-4 h-4 mr-2" />
      Back
    </button>
  </div>
);

// ✨ NEW: Reusable Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, isConfirming, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-red-500/50 shadow-lg shadow-red-500/20 max-w-sm w-full mx-4" style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
        <h2 className="text-2xl font-bold text-red-400 mb-4 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]">{title}</h2>
        <div className="text-purple-300 mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : "Confirm Delete"}
          </button>
        </div>
      </div>
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
    const i = setInterval(() => setNow(Date.now()), 1000); // second-level countdown
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
    <div className="mt-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="font-mono text-pink-400 bg-gray-900/60 px-3 py-1 rounded border border-pink-500/30">
          {allDoneToday ? 'Daily complete' : `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-xs uppercase tracking-wide px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-md shadow-purple-600/30"
        >View Streaks</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-gray-950/90 border border-purple-500/40 rounded-xl p-5 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-purple-300 hover:text-white text-sm"
            >✕</button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-purple-200 font-semibold tracking-wide text-sm">Progress Calendar</h3>
              <div className="font-mono text-pink-400 text-sm">
                {allDoneToday ? 'Done' : `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`}
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} className="text-xs text-purple-400 hover:text-purple-200">&lt;</button>
              <span className="text-sm text-purple-200 font-semibold">{monthCursor.toLocaleString(undefined,{ month:'long', year:'numeric'})}</span>
              <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} className="text-xs text-purple-400 hover:text-purple-200">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-purple-400 mb-1">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c,i) => c ? (
                <div key={i} className={`relative h-10 flex flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-all duration-300
                  ${c.completed ? 'bg-gradient-to-br from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'bg-gray-800/60 border-purple-500/20 text-purple-300'}
                  ${!c.completed && c.isToday ? 'ring-2 ring-pink-500/60' : ''}`}
                  title={`${c.iso}${c.completed ? ' - Completed' : c.isToday ? ' - Today' : ''}`}
                >
                  {c.d}
                  {c.completed && <CheckCircle className="w-3 h-3 mt-1" />}
                  {c.isToday && !c.completed && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />}
                </div>
              ) : <div key={i} />)}
            </div>
            <p className="mt-3 text-[10px] text-purple-500 tracking-wide">Blue ticks = completed days. Countdown resets at local midnight.</p>
          </div>
        </div>
      )}
    </div>
  );
};


const MissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateStreak = useTrackerStore((s) => s.updateStreak);
  const deleteTracker = useTrackerStore((s) => s.deleteTracker); // ✨ NEW: Get delete function from store

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // ✨ NEW: State for delete loading
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // ✨ NEW: State for modal visibility


  // ✨ NEW: Handle mission deletion
  const updateCoin = useUserStore(s=>s.updateCoin);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Call abandon endpoint (coin fee handled server-side)
      const res = await axiosInstance.post(`/tracker/${id}/abandon`);
      if(res?.data && res.data.remainingCoins !== undefined){
        updateCoin(res.data.remainingCoins);
      }
      deleteTracker(id);
      navigate('/missions');
    } catch (err) {
      console.error('Failed to delete mission:', err);
      // Optional: Add user feedback for the error
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
      <SoloLoading loading={loading} message="Loading Mission Details..." />
      {!loading && tracker && (
        <div className={`min-h-screen ${theme.colors.background} py-8 px-8 text-white`} style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
          <div className="w-full mx-auto max-w-screen-lg">
            {/* ✨ UPDATED: Header with Back and Delete buttons */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate(-1)}
                className="text-purple-400 hover:text-purple-300 flex items-center transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Missions
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-400 hover:text-red-300 flex items-center transition-colors duration-300 bg-red-900/50 hover:bg-red-800/50 px-3 py-2 rounded-lg border border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Abandon
              </button>
            </div>

            {/* Mission Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 tracking-wider drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                {tracker.title || 'Unnamed Mission'}
              </h1>
              <p className="text-purple-300 mt-2 text-lg">
                {tracker.description || 'Embark on a thrilling quest to conquer the shadows and rise as the ultimate hunter.'}
              </p>
              <p className="text-sm text-purple-400 mt-2">
                Day {tracker.daycount + 1} • Streak: {tracker.streak || 0}
              </p>
              <CountdownAndCalendar tracker={tracker} />
            </div>


            {tracker.streak >= 5 && (
              <div className="mb-6">
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white px-6 py-2 rounded-md font-semibold transition-all shadow-md shadow-purple-700/30 disabled:opacity-50 flex items-center gap-2 hover:shadow-lg"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Upgrade Quests
                    </>
                  )}
                </button>
                <p className="text-sm text-purple-300 mt-2">
                  You’ve reached a streak of {tracker.streak}. Ready for tougher challenges?
                </p>
              </div>
            )}

            {/* Quests Section */}
            <div className="bg-gradient-to-br from-gray-800 to-black border border-purple-500/50 rounded-xl p-6 shadow-lg shadow-purple-500/20">
              <h2 className="text-2xl font-semibold text-purple-300 mb-6 drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]">
                Today’s Quests
              </h2>
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
                <p className="text-purple-500 text-center">No quests available for this mission.</p>
              )}
            </div>

            {/* Guidance Panel (bottom) */}
            <div className="mt-10">
              <MissionInfoPanel sections={['penalties','rewards','calendar-reset','streak-upgrade']} title="Mission Rules & Tips" />
            </div>
            
          </div>
        </div>
      )}

      {/* ✨ NEW: Render the confirmation modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        title="Confirm Mission Abandon"
      >
        <p className="text-sm leading-relaxed">
          Abandoning this mission will permanently remove all its quests & progress.
          <br />Fee: <span className="text-yellow-300">Up to 5 coins</span> (5 if you have ≥5; otherwise all your remaining coins).
          <br />No rewards or streak benefits are granted. This cannot be undone.
        </p>
      </ConfirmationModal>
    </AuthLayout>
  );
};

export default MissionDetails;