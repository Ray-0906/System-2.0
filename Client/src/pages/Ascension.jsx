import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '../utils/axios';
import { ArrowLeft, TrendingUp, BadgeCheck, Award, Activity, Zap, Target, BarChart3, RefreshCw, ShieldAlert, ChevronUp, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as echarts from 'echarts';

import AuthLayout from '../components/AuthLayout';
import MissionInfoPanel from '../components/MissionInfoPanel';
import SoloLoading from '../components/Loading';

// --- Helper Components ---
const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-3 flex flex-col gap-2 hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all duration-300 group">
    <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
      <Icon className="w-3.5 h-3.5 text-purple-500 group-hover:text-pink-400 transition-colors" /> {label}
    </span>
    <span className="text-xl font-black text-white px-1 drop-shadow-md" style={{ fontFamily: "'Exo 2', sans-serif" }}>{value ?? '-'}</span>
  </div>
);

const AscensionTrial = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAscensionData = useCallback(async (isRefresh = false) => {
    if(isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/rank/ascension');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'System failed to evaluate rank.');
    } finally {
      if(isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAscensionData(); }, [fetchAscensionData]);

  const { ascended, newRank, reward, report } = data || {};
  const breakdown = report?.components || {};
  const hunterScoreComponents = breakdown.hunterScoreComponents || {};
  
  const chartData = useMemo(() => Object.entries(hunterScoreComponents).map(([k, v]) => ({ name: k.replace('Score',''), value: v })), [hunterScoreComponents]);

  // ECharts refs
  const pieRef = useRef(null);
  const gaugeRef = useRef(null);
  const barRef = useRef(null);

  // Initialize Pie Chart
  useEffect(() => {
    if(!chartData.length || loading || error || !pieRef.current) return;
    const inst = echarts.getInstanceByDom(pieRef.current) || echarts.init(pieRef.current);
    inst.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#a855f7', textStyle: { color: '#fff' } },
      legend: { bottom: 0, textStyle: { color: '#c4b5fd', fontFamily: "'Rajdhani', sans-serif", fontSize: 12 } },
      series: [{ 
        type: 'pie', 
        radius: ['40%', '75%'], 
        roseType: 'radius', 
        itemStyle: { borderRadius: 4, borderColor: '#000', borderWidth: 2 },
        label: { show: false },
        data: chartData,
        color: ['#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#f59e0b']
      }]
    });
    const resize = () => inst.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); inst.dispose(); };
  }, [chartData, loading, error]);

  // Initialize Gauge Chart
  useEffect(() => {
    if(!report?.hunterScore || loading || error || !gaugeRef.current) return;
    const inst = echarts.getInstanceByDom(gaugeRef.current) || echarts.init(gaugeRef.current);
    const target = 1000; 
    const percent = Math.min(100, ((report.hunterScore / target) * 100).toFixed(1));
    
    inst.setOption({
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge',
        startAngle: 210, endAngle: -30, min: 0, max: target,
        splitNumber: 5,
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0,color:'#8b5cf6'},{offset:1,color:'#ec4899'}]) },
        progress: { show: true, width: 12 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 12, color: [[1, '#1e1b4b']] } },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        detail: { valueAnimation: true, fontSize: 28, fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold', color: '#fff', formatter: '{value}', offsetCenter: [0, '0%'] },
        data: [{ value: report.hunterScore }]
      }]
    });
    const resize = () => inst.resize(); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); inst.dispose(); };
  }, [report?.hunterScore, loading, error]);

  // Initialize Bar Chart
  useEffect(() => {
    if(!breakdown?.xp || loading || error || !barRef.current) return;
    const inst = echarts.getInstanceByDom(barRef.current) || echarts.init(barRef.current);
    const items = [ 
      {label:'XP', val: breakdown.xp}, 
      {label:'Stats', val: breakdown.totalStatLevels * 10}, 
      {label:'Missions', val: breakdown.completedMissions * 50}, 
      {label:'Streak', val: breakdown.avgStreak * 20} 
    ];
    
    inst.setOption({
      backgroundColor: 'transparent',
      grid: { left: '15%', right: '15%', top: '5%', bottom: '15%' },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(139,92,246,0.1)' } }, axisLabel: { show: false } },
      yAxis: { type: 'category', data: items.map(i=>i.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#c4b5fd', fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 'bold' } },
      series: [{
        type: 'bar',
        data: items.map(i=>i.val),
        barWidth: 12,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0,color:'#8b5cf6'},{offset:1,color:'#ec4899'}]) },
        label: { show: true, position: 'right', color: '#fff', fontSize: 10, fontFamily: "'Exo 2', sans-serif" }
      }]
    });
    const resize = () => inst.resize(); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); inst.dispose(); };
  }, [breakdown, loading, error]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-purple-300 w-full">
          <SoloLoading />
          <p className="mt-4 text-xl tracking-widest font-bold animate-pulse" style={{ fontFamily: "'Rajdhani', sans-serif" }}>EVALUATING HUNTER SCORE...</p>
        </div>
      );
    }

    if (error) {
      return (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center min-h-[50vh] text-red-400 w-full">
          <ShieldAlert className="w-16 h-16 mb-4 drop-shadow-[0_0_15px_rgba(248,113,113,0.6)]" />
          <h2 className="text-3xl mb-2 font-bold tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>SYSTEM INTERFERENCE</h2>
          <p className="text-red-400/80 max-w-md text-center mb-6 font-['Exo_2']">{error}</p>
          <button onClick={() => fetchAscensionData(true)} className="px-6 py-3 bg-gradient-to-r from-red-900/80 to-red-600/80 border border-red-500/50 rounded-lg text-white font-bold tracking-wider hover:from-red-800 hover:to-red-500 transition-all shadow-[0_0_15px_rgba(248,113,113,0.3)] hover:shadow-[0_0_25px_rgba(248,113,113,0.6)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            RECALIBRATE
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full space-y-6 pb-20">
        
        {/* Ascension Header Result */}
        <motion.div variants={itemVariants} className="relative w-full bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center md:items-start">
            <h2 className="text-sm font-bold tracking-[0.3em] text-purple-400 mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>EVALUATION SYSTEM</h2>
            <h1 className={`text-4xl md:text-5xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${ascended ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200' : 'text-white'}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {ascended ? 'RANK ASCENDED' : 'EVALUATION COMPLETE'}
            </h1>
            <p className="text-sm text-gray-400 font-['Exo_2'] mt-2 max-w-md text-center md:text-left">
              {ascended 
                ? `Congratulations Hunter. You have proven yourself worthy. Your clearance level has been updated to Rank ${newRank}.`
                : 'Your current hunter score does not meet the threshold for the next rank. Continue completing missions and leveling up your stats.'}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-center bg-gray-950/80 border border-purple-500/40 p-4 rounded-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]">
            <div className="text-center mr-6 pr-6 border-r border-purple-500/30">
              <span className="text-[10px] uppercase tracking-widest text-purple-400 block mb-1">Current Rank</span>
              <span className="text-3xl font-black text-white drop-shadow-md" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{report?.currentRank}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-purple-400 block mb-1">Hunter Score</span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {report?.hunterScore}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Triple Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Gauge Column */}
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] relative">
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            <h3 className="text-sm font-bold tracking-widest font-['Rajdhani'] text-purple-300 flex items-center gap-2 mb-2 border-b border-purple-500/20 pb-2">
              <Activity className="w-4 h-4 text-purple-400" /> THRESHOLD GAUGE
            </h3>
            <div ref={gaugeRef} className="h-44 w-full -mt-4"></div>
            <p className="text-center text-[11px] text-purple-400/60 -mt-2 font-['Exo_2'] tracking-wide">TARGET: 1000 HUNTER SCORE TO ASCEND</p>
          </motion.div>

          {/* Metrics Column */}
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] flex flex-col relative">
            <h3 className="text-sm font-bold tracking-widest font-['Rajdhani'] text-purple-300 flex items-center justify-between mb-4 border-b border-purple-500/20 pb-2">
              <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-400" /> CORE METRICS</span>
              <button onClick={() => fetchAscensionData(true)} disabled={refreshing} className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all disabled:opacity-50" title="Refresh Data">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </h3>
            <div className="grid grid-cols-2 gap-3 flex-grow">
              <MetricCard label="XP" value={breakdown?.xp} icon={Zap} />
              <MetricCard label="Stat Lvls" value={breakdown?.totalStatLevels} icon={ChevronUp} />
              <MetricCard label="Completed" value={`${breakdown?.completedMissions}/${breakdown?.totalMissions}`} icon={Target} />
              <MetricCard label="Avg Streak" value={breakdown?.avgStreak} icon={TrendingUp} />
            </div>
          </motion.div>

          {/* Rewards Column */}
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            <h3 className="text-sm font-bold tracking-widest font-['Rajdhani'] text-amber-300 flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-2">
              <Crown className="w-4 h-4 text-amber-400" /> REWARDS ACQUIRED
            </h3>
            {ascended && reward ? (
              <div className="space-y-4 relative z-10">
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-400 p-2 rounded-r">
                   <p className="text-[10px] uppercase text-amber-500/80 font-bold mb-0.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>TITLE UNLOCKED</p>
                   <p className="text-amber-200 font-bold text-sm tracking-wide shadow-sm">{reward.title}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-900/60 rounded flex items-center p-2 border border-purple-500/20">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center mr-2">
                      <span className="text-yellow-400 font-bold text-xs">$</span>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-gray-400">Coins</p>
                      <p className="text-white font-bold text-sm">+{reward.coins}</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-900/60 rounded flex items-center p-2 border border-purple-500/20">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                      <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-gray-400">XP</p>
                      <p className="text-white font-bold text-sm">+{reward.xp}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60 relative z-10 pb-4">
                <Crown className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-xs text-gray-400 text-center font-['Exo_2'] italic">Ascend to the next rank<br/>to unlock exclusive rewards.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <h3 className="text-sm font-bold tracking-widest font-['Rajdhani'] text-purple-300 flex items-center gap-2 border-b border-purple-500/20 pb-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> CONTRIBUTION WEIGHTS
            </h3>
            <div ref={barRef} className="h-60 w-full mt-2"></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <h3 className="text-sm font-bold tracking-widest font-['Rajdhani'] text-purple-300 flex items-center gap-2 border-b border-purple-500/20 pb-2 flex-grow">
              <Award className="w-4 h-4 text-purple-400" /> SCORE COMPOSITION
            </h3>
            <div className="flex items-center">
              <div ref={pieRef} className="h-60 w-2/3"></div>
              <div className="w-1/3 flex flex-col justify-center gap-2">
                 {chartData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex flex-col bg-gray-950/50 p-2 rounded border border-purple-500/10">
                      <span className="text-[9px] uppercase text-gray-400 font-bold truncate">{d.name}</span>
                      <span className="text-sm text-white font-bold">{d.value}</span>
                    </div>
                 ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mission Info Panel */}
        <motion.div variants={itemVariants} className="mt-8 bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 relative">
          <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
           <div className="p-1">
            <MissionInfoPanel sections={['rank-ascension']} title="TRIAL PARAMETERS" />
           </div>
        </motion.div>

      </motion.div>
    );
  };

  return (
    <AuthLayout>
      <div 
        className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 font-['Exo_2'] selection:bg-[#a855f7]/30 selection:text-white relative overflow-hidden pb-10 pt-6 md:pt-10"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        <div className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 animate-pulse" style={{ background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.15), transparent 80%)' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:60px_60px] pointer-events-none z-0" />
        
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto w-full relative z-10 p-4 sm:p-6 lg:px-8 mt-2">
          
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-purple-400 hover:text-pink-400 transition-colors mb-6 drop-shadow-md">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-bold tracking-widest text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>RETURN TO BASE</span>
          </button>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-purple-400/50">
                <BadgeCheck className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] uppercase" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                 Ascension Trial
               </h1>
               <p className="text-purple-300/80 font-bold tracking-wider text-xs" style={{ fontFamily: "'Rajdhani', sans-serif" }}>SYSTEM EVALUATION OF COMBAT READINESS</p>
             </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>

        </div>
      </div>
    </AuthLayout>
  );
};

export default AscensionTrial;
