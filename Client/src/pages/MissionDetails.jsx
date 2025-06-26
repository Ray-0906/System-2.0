import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../utils/axios';
import { useTrackerStore } from '../store/trackerStore';
import { processQuestResponse } from '../utils/processQuestres';
import { useState } from 'react';
import { theme } from './Ineventory';

// GraphQL Query
const GET_TRACKER = gql`
  query GetTrackerById($id: ID!) {
    getTrackerById(id: $id) {
      id
      title
      streak
      daycount
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
        Stat: {quest.statAffected} • XP: +{quest.xp}
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

// Sub-component for Loading State
const LoadingState = () => (
  <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
    <Loader2 className="w-10 h-10 animate-spin text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
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

const MissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateTracker = useTrackerStore((s) => s.updateTracker);
  const [isUpgrading, setIsUpgrading] = useState(false);

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
      // Optimistic update
      const updatedRemaining = tracker.remainingQuests.filter((q) => q.id !== quest.id);
      updateTracker(id, { ...tracker, remainingQuests: updatedRemaining });
      refetch(); // Ensure backend sync
    } catch (err) {
      console.error('Quest completion failed:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} navigate={navigate} />;

  const remainingIds = tracker.remainingQuests?.map((q) => q.id) || [];

  return (
    <div className={`min-h-screen ${theme.colors.background} py-8 px-8 text-white`} style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
      <div className="w-full mx-auto max-w-screen-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-purple-400 mb-6 hover:text-purple-300 flex items-center transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Missions
        </button>

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
      </div>
    </div>
  );
};

export default MissionDetails;