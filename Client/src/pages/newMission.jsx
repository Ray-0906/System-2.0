import { useState, useCallback, memo } from 'react';
import { Wand2, Shield, CheckCircle, Star, Skull, ArrowLeft, FilePenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useNotificationStore } from '../store/notificationStore';
import PropTypes from 'prop-types';
import AuthLayout from '../components/AuthLayout';
import MissionInfoPanel from '../components/MissionInfoPanel';
import { motion, AnimatePresence } from 'framer-motion';

const theme = { 
  fonts: { primary: "'Exo 2', sans-serif" }, 
  colors: { 
    background: 'bg-gradient-to-b from-[#030305] to-[#0a0a0f]', 
    card: 'bg-[#050608] border border-[#1e2330]', 
    input: 'bg-[#090b10] border-[#1e2330]', 
    border: 'border-[#a855f7]/30', 
    borderActive: 'border-[#a855f7]', 
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]', 
    title: 'text-white', 
    accent: 'text-[#a855f7]', 
    button: 'bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]', 
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]', 
    error: 'bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-500/50', 
    rank: 'text-[#a855f7]', 
    reward: 'text-green-400', 
    penalty: 'text-red-400', 
    text: 'text-gray-200', 
    muted: 'text-gray-500', 
    loading: 'text-[#a855f7]' 
  } 
};

const styles = `
  .hover-glow:hover {
    box-shadow: 0 0 20px rgba(168,85,247, 0.4);
  }
`;

const GeneratorIcon = memo(({ isLoading }) => isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />); GeneratorIcon.displayName = 'GeneratorIcon'; GeneratorIcon.propTypes = { isLoading: PropTypes.bool };

const AcceptIcon = memo(({ isAccepting }) => isAccepting ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />); AcceptIcon.displayName = 'AcceptIcon'; AcceptIcon.propTypes = { isAccepting: PropTypes.bool };

const DifficultyIcon = memo(({ difficulty }) => { switch (difficulty?.toLowerCase()) { case 'hard': return <Skull className={`w-4 h-4 ${theme.colors.penalty} drop-shadow-[0_0_3px_rgba(244,63,94,0.5)] mr-1`} />; case 'medium': return <Shield className={`w-4 h-4 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)] mr-1`} />; default: return <Star className={`w-4 h-4 text-green-400 drop-shadow-[0_0_3px_rgba(34,197,94,0.5)] mr-1`} />; } }); DifficultyIcon.displayName = 'DifficultyIcon'; DifficultyIcon.propTypes = { difficulty: PropTypes.string };

const RankBadge = memo(({ rank }) => ( 
  <div className={`px-4 py-2 border bg-[#121319] border-[#1e2330] text-center`} style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
    <span className="block text-[10px] text-gray-500 font-['Rajdhani'] tracking-widest font-black">RANK</span>
    <span className={`${theme.colors.rank} font-black font-['Exo_2'] drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] leading-none text-2xl capitalize`}>{rank || '?'}</span>
  </div> 
)); RankBadge.displayName = 'RankBadge'; RankBadge.propTypes = { rank: PropTypes.string };

const QuestList = memo(({ quests }) => (
  <ul className="space-y-4 relative z-10">
    {quests.map((q, i) => (
      <li key={i} className="flex gap-4 items-start">
        <div className="w-5 h-5 rounded-full bg-[#121319] border border-[#1e2330] flex items-center justify-center text-[10px] font-black text-gray-500 font-['Rajdhani'] mt-0.5 shrink-0">
          {i+1}
        </div>
        <div>
          <p className="text-gray-200 font-semibold text-sm mb-1">{q.title}</p>
          <p className="text-[10px] font-['Rajdhani'] tracking-widest font-bold">
            <span className="text-gray-500">STAT: </span><span className="text-[#a855f7] uppercase">{q.statAffected}</span> 
            <span className="mx-2 text-gray-700">|</span> 
            <span className="text-gray-500">REWARD: </span><span className="text-green-400">+{q.xp} XP</span>
          </p>
        </div>
      </li>
    ))}
  </ul>
)); QuestList.displayName = 'QuestList'; QuestList.propTypes = { quests: PropTypes.array.isRequired };

export default function NewMission() {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(7);
  const [mission, setMission] = useState(null);
  const [status, setStatus] = useState({ isLoading: false, isAccepting: false, error: null });
  const pushNotification = useNotificationStore(s => s.push);
  
  const generateMission = useCallback(async () => {
    if (!goal.trim()) { pushNotification({ type: 'mission', key: 'error', newValue: 'Enter an objective first!' }); return; }
    setStatus({ isLoading: true, isAccepting: false, error: null });
    try {
      const { data } = await axiosInstance.post('/mission/create', { description: goal, days: duration });
      if (data && data.mission && data.mission.title) { 
        setMission({ ...data.mission, quests: data.quests }); 
        pushNotification({ type: 'mission', key: 'generated', newValue: data.mission.title }); 
      }
      else { throw new Error('Invalid mission format received'); }
    } catch (err) {
      console.error(err);
      setStatus(prev => ({ ...prev, error: err.response?.data?.message || 'Failed to analyze request.' }));
      pushNotification({ type: 'mission', key: 'error', newValue: 'System error.' });
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [goal, duration, pushNotification]);
  
  const acceptMission = useCallback(async () => {
    if (!mission) return;
    setStatus(prev => ({ ...prev, isAccepting: true }));
    try {
      await axiosInstance.post('/mission/join', { missionId: mission._id });
      pushNotification({ type: 'mission', key: 'accepted', newValue: mission.title });
      window.location.href = '/missions';
    } catch (err) {
      setStatus(prev => ({ ...prev, error: 'Failed to accept mission.', isAccepting: false }));
      pushNotification({ type: 'mission', key: 'error', newValue: 'Failed to accept.' });
    }
  }, [mission, pushNotification]);
  
  return (
    <AuthLayout>
      <div 
        className={`min-h-screen ${theme.colors.background} text-white font-['Exo_2'] selection:bg-[#a855f7]/30 selection:text-white relative overflow-hidden pb-20 pt-6 md:pt-10`}
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
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <style>{styles}</style>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2330] pb-6 mb-8">
            <div>
              <Link to="/missions" className="inline-flex items-center text-[#a855f7] hover:text-[#c084fc] font-['Rajdhani'] font-bold tracking-widest text-sm mb-4 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> RECRUITMENT BOARD
              </Link>
              <h3 className="text-[#a855f7] text-[10px] font-black tracking-[0.4em] font-['Rajdhani'] mb-1">AI SYSTEM START</h3>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-wider drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] uppercase">MISSION GENERATOR</h1>
              <p className="text-gray-400 mt-2 font-light max-w-xl">
                Submit your objective. The system will calculate the optimal growth path.
              </p>
            </div>
            
            <div className="hidden md:block">
              <div className="w-16 h-16 border-2 border-[#a855f7]/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="w-2 h-2 bg-[#a855f7] rounded-full shadow-[0_0_10px_rgba(168,85,247,1)] blur-[1px]"></div>
              </div>
            </div>
          </div>

          <div className={`${theme.colors.card} p-1 relative overflow-hidden group transition-all duration-500 mb-8`}
               style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
            <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            
            <div className="bg-[#090b10] h-full p-8 md:p-10 relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#a855f7] to-transparent opacity-50"></div>

              {status.error && (
                <div className={`mb-6 p-4 border font-['Rajdhani'] font-bold tracking-widest text-sm flex items-center bg-red-950/30 border-red-500/50 text-red-400`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                  <Skull className="w-4 h-4 mr-3 shrink-0" />
                  <p>{status.error}</p>
                </div>
              )}
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="flex-1">
                    <label className={`flex text-[#a855f7] text-[10px] font-black font-['Rajdhani'] tracking-[0.2em] mb-3 uppercase items-center gap-2`}>
                      <Wand2 className="w-4 h-4" /> OBJECTIVE OVERRIDE
                    </label>
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Learn Next.js in 10 days, Complete a 5K run..."
                      className={`w-full bg-[#050608] border border-[#1e2330] text-white focus-visible:ring-1 focus-visible:ring-[#a855f7]/50 focus-visible:border-[#a855f7]/50 h-32 text-lg font-['Exo_2'] rounded-none p-4 resize-none transition-all placeholder:text-gray-600`}
                      disabled={status.isLoading}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className={`flex text-[#a855f7] text-[10px] font-black font-['Rajdhani'] tracking-[0.2em] mb-3 uppercase items-center gap-2`}>
                      <ClockIcon className="w-4 h-4" /> DAYS
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className={`w-full bg-[#050608] border border-[#1e2330] text-white focus-visible:ring-1 focus-visible:ring-[#a855f7]/50 focus-visible:border-[#a855f7]/50 h-32 text-center text-4xl font-['Exo_2'] font-black rounded-none p-4 transition-all`}
                      disabled={status.isLoading}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={generateMission}
                    disabled={status.isLoading || !goal.trim()}
                    className={`flex-1 flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-['Rajdhani'] font-black tracking-[0.2em] relative overflow-hidden group transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    {!status.isLoading && goal.trim() && (
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] pointer-events-none hidden group-hover:block"></div>
                    )}
                    <span className="relative z-10 flex items-center justify-center">
                      <GeneratorIcon isLoading={status.isLoading} />
                      {status.isLoading ? 'COMPUTING...' : 'INITIATE ANALYSIS'}
                    </span>
                  </button>
                  <Link
                    to="/add-custom"
                    className={`sm:w-auto h-14 px-6 flex items-center justify-center gap-2 bg-transparent border border-[#1e2330] text-gray-500 hover:border-[#a855f7]/50 hover:text-[#a855f7] hover:bg-[#a855f7]/5 font-['Rajdhani'] font-bold tracking-[0.2em] transition-all`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    <FilePenLine className="w-4 h-4" /> MANUAL ENTRY
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {mission && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                  <div className={`\${theme.colors.card} p-1 relative overflow-hidden transition-all duration-500`}
                       style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-[#a855f7]/10 opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    
                    <div className="bg-[#050608] h-full p-8 md:p-10 relative" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%)' }}>
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent"></div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none"></div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10 border-b border-[#1e2330] pb-6">
                        <div>
                          <h3 className="text-[#a855f7] text-[10px] font-black tracking-[0.4em] font-['Rajdhani'] mb-1">SYNTHESIS COMPLETE</h3>
                          <h2 className="text-2xl md:text-3xl font-black italic tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] uppercase">{mission.title}</h2>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-['Rajdhani'] tracking-widest mt-2">
                            <span className="px-2 py-1 bg-[#090b10] border border-[#1e2330] text-gray-400 flex items-center uppercase">
                              <ClockIcon className="w-3 h-3 mr-1 text-[#06b6d4]" /> {mission.duration} DAYS
                            </span>
                            <span className="px-2 py-1 bg-[#090b10] border border-[#1e2330] text-gray-400 flex items-center uppercase">
                              <DifficultyIcon difficulty={mission.difficulty} />{mission.difficulty || 'Normal'}
                            </span>
                          </div>
                        </div>
                        <RankBadge rank={mission.rank} />
                      </div>

                      <div className="space-y-6 relative z-10">
                        <MissionInfoPanel title="MISSION DIRECTIVE">
                          <p className={`text-gray-400 font-light text-sm pl-4 border-l-2 border-[#1e2330]`}>{mission.description}</p>
                        </MissionInfoPanel>
                        
                        <div className="mb-10">
                          <h4 className="text-gray-400 font-black tracking-widest font-['Rajdhani'] text-xs flex items-center gap-2 mb-4">
                            <Wand2 size={14} className="text-[#a855f7]" /> DAILY PROTOCOL
                          </h4>
                          <div className="bg-[#090b10] border border-[#1e2330] p-4 relative">
                            <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-[#1e2330]"></div>
                            <QuestList quests={mission.quests}/>
                          </div>
                        </div>

                        <div className="bg-[#090b10] border border-[#1e2330] p-4 relative overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,transparent_70%)]"></div>
                          <h4 className="text-green-500 font-black tracking-widest font-['Rajdhani'] text-xs flex items-center gap-2 mb-4 border-b border-green-500/20 pb-2">
                            <Star size={14} /> COMPLETION REWARDS
                          </h4>
                          <div className="flex flex-wrap gap-3 font-['Exo_2'] font-bold text-xs uppercase">
                            <span className={`px-3 py-1.5 bg-[#06b6d4]/10 border border-[#06b6d4]/30 \${theme.colors.reward} shadow-[0_0_10px_rgba(6,182,212,0.2)] tracking-widest`}>
                              +{mission.reward?.xp || 0} XP
                            </span>
                            <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)] tracking-widest flex items-center">
                              <CoinIcon className="w-3 h-3 mr-1"/>+{mission.reward?.coins || 0} COINS
                            </span>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-[#1e2330] mt-8 flex flex-col sm:flex-row gap-4 sm:justify-end">
                          <button 
                            onClick={() => setMission(null)} 
                            disabled={status.isAccepting} 
                            className={`w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-[#090b10] border border-[#1e2330] text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 font-['Rajdhani'] font-black tracking-[0.2em] relative overflow-hidden transition-all disabled:opacity-50`}
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                          >
                            <span className="relative z-10">DISCARD</span>
                          </button>
                          
                          <button 
                            onClick={acceptMission} 
                            disabled={status.isAccepting} 
                            className={`w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-['Rajdhani'] font-black tracking-[0.2em] relative overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.3)]`}
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                          >
                            <AcceptIcon isAccepting={status.isAccepting}/>
                            <span className="relative z-10">{status.isAccepting ? 'PROCESSING...' : 'ACCEPT MISSION'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  );
}

const ClockIcon = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CoinIcon = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="8"/><path d="M12 8v8"/></svg>;
