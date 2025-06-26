import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { Loader2, ArrowLeft, TrendingUp, BadgeCheck, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
        <div className={`flex items-center justify-center h-screen ${theme.colors.background} text-white`}>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-400">Ascension Trial Error</h1>
            <p className="text-purple-300">Something went wrong: {this.state.error.message}</p>
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
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
  colors: {
    background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    card: 'bg-gradient-to-br from-gray-800 to-black',
    border: 'border-purple-500/50',
    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    accent: 'text-purple-400',
    text: 'text-white',
    muted: 'text-purple-300',
    success: 'text-green-400',
    danger: 'text-red-400',
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
`;

const AscensionTrial = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAscensionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/user/rankAscension');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch ascension data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAscensionData();
    return () => {
      // Cleanup if needed
    };
  }, [fetchAscensionData]);

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme.colors.background}`} aria-live="polite">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme.colors.background} px-8 py-10 flex items-center justify-center text-white`} style={{ fontFamily: theme.fonts.primary }} aria-live="polite">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-xl text-red-400">Error: {error}</p>
          <button
            onClick={fetchAscensionData}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-500 hover:to-pink-400 transition-all hover-glow"
            aria-label="Retry fetching ascension data"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { ascended, newRank, reward, report } = data || {};

  return (
    <ErrorBoundary>
      <style>{styles}</style>
      <div className={`min-h-screen ${theme.colors.background} px-8 py-10 text-white`} style={{ fontFamily: theme.fonts.primary }}>
        <div className="max-w-screen-lg mx-auto space-y-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className={`${theme.colors.accent} hover:text-purple-300 flex items-center mb-4 transition-colors duration-300 hover-glow`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
            <BadgeCheck className="w-7 h-7 text-purple-400" />
            Ascension Trial Results
          </h1>

          {/* Summary Box */}
          <div className={`${theme.colors.card} rounded-xl p-6 ${theme.colors.border} shadow-lg ${theme.colors.shadow}`}>
            <h2 className="text-xl font-semibold text-purple-300 mb-2">Rank Evaluation</h2>
            <p className={theme.colors.text}>Current Rank: <span className="font-bold">{report?.currentRank}</span></p>
            <p className={ascended ? theme.colors.success : theme.colors.danger}>
              {ascended
                ? `🎉 You ascended to ${newRank}-Rank!`
                : 'No ascension this time. Keep grinding!'}
            </p>
          </div>

          {/* Reward Section */}
          {ascended && reward && (
            <div className={`${theme.colors.card} rounded-xl p-6 ${theme.colors.border}`}>
              <h2 className="text-xl font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" /> Rewards
              </h2>
              <ul className="space-y-1">
                <li>🎖️ Title: <strong>{reward.title}</strong></li>
                <li>💰 Coins: <strong>{reward.coins}</strong></li>
                <li>⚡ XP: <strong>{reward.xp}</strong></li>
              </ul>
            </div>
          )}

          {/* Report Breakdown */}
          <div className={`${theme.colors.card} rounded-xl p-6 ${theme.colors.border}`}>
            <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Performance Report
            </h2>

            <ul className="space-y-2 text-sm">
              <li>Total XP: {report?.components?.xp}</li>
              <li>Total Stat Levels: {report?.components?.totalStatLevels}</li>
              <li>Missions Completed: {report?.components?.completedMissions} / {report?.components?.totalMissions}</li>
              <li>Success Rate: {report?.components?.successRate}</li>
              <li>Average Streak: {report?.components?.avgStreak}</li>
            </ul>

            <div className="mt-4">
              <h4 className="text-purple-200 font-semibold mb-2">Hunter Score Components:</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {Object.entries(report?.components?.hunterScoreComponents || {}).map(([key, val]) => (
                  <li key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace('Score', '')}</span>
                    <span>{val}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-purple-300 font-bold">
              Total Hunter Score: {report?.hunterScore}
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AscensionTrial;