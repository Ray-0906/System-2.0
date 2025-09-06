import { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axios';
import { ArrowLeft, TrendingUp, BadgeCheck, Award, Activity, Zap, Target, BarChart3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import AuthLayout from '../components/AuthLayout';
import MissionInfoPanel from '../components/MissionInfoPanel';
import SoloLoading from '../components/Loading';
import * as echarts from 'echarts';

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
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAscensionData = useCallback(async (isRefresh=false) => {
    if(isRefresh){ setRefreshing(true);} else { setLoading(true);}  
    setError(null);
    try {
      const res = await axiosInstance.get('/user/rankAscension');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch ascension data');
    } finally {
      if(isRefresh){ setRefreshing(false);} else { setLoading(false);}  
    }
  }, []);

  useEffect(() => { fetchAscensionData(); }, [fetchAscensionData]);

  const { ascended, newRank, reward, report } = data || {};
  const breakdown = report?.components || {};
  const hunterScoreComponents = breakdown.hunterScoreComponents || {};
  const chartData = useMemo(() => Object.entries(hunterScoreComponents).map(([k,v]) => ({ name: k.replace('Score',''), value: v })), [hunterScoreComponents]);

  // Pie chart
  useEffect(() => {
    if(!chartData.length || loading || error) return;
    const el = document.getElementById('hs-pie'); if(!el) return;
    const inst = echarts.getInstanceByDom(el) || echarts.init(el);
    inst.setOption({
      darkMode:true,
      backgroundColor:'transparent',
      tooltip:{ trigger:'item' },
      legend:{ bottom:0, textStyle:{ color:'#c4b5fd', fontSize:11 } },
      series:[{ type:'pie', radius:['35%','70%'], roseType:'radius', label:{ color:'#e9d5ff', formatter:'{b}\n{c}' }, itemStyle:{ borderColor:'#0f0f16', borderWidth:2, shadowBlur:12, shadowColor:'rgba(139,92,246,0.4)' }, data: chartData }]
    });
    const resize = () => inst.resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [chartData, loading, error]);

  // Gauge
  useEffect(() => {
    if(!report?.hunterScore || loading || error) return;
    const el = document.getElementById('hs-gauge'); if(!el) return;
    const inst = echarts.getInstanceByDom(el) || echarts.init(el);
    const target = 1000; const percent = Math.min(100, (report.hunterScore/target)*100);
    inst.setOption({ series:[{ type:'gauge', startAngle:210, endAngle:-30, center:['50%','55%'], min:0, max:100, progress:{ show:true, width:10, itemStyle:{ color:'#8b5cf6'} }, axisLine:{ lineStyle:{ width:10, color:[[1,'#312e81']] } }, pointer:{ show:false }, axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, detail:{ valueAnimation:true, fontSize:22, color:'#fff', formatter:()=>`${report.hunterScore}` }, data:[{ value:percent }] }] });
    const resize = () => inst.resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [report?.hunterScore, loading, error]);

  // Bars
  useEffect(() => {
    if(!breakdown?.xp || loading || error) return;
    const el = document.getElementById('hs-bars'); if(!el) return;
    const inst = echarts.getInstanceByDom(el) || echarts.init(el);
    const items = [ {label:'XP', val:breakdown.xp}, {label:'StatLvls', val:breakdown.totalStatLevels}, {label:'Missions', val:breakdown.completedMissions}, {label:'AvgStreak', val:breakdown.avgStreak} ];
    inst.setOption({ grid:{ left:60, right:20, top:10, bottom:20 }, xAxis:{ type:'value', axisLine:{ lineStyle:{ color:'#6d28d9'}}, splitLine:{ show:false } }, yAxis:{ type:'category', data:items.map(i=>i.label), axisLine:{ lineStyle:{ color:'#6d28d9'}}, axisLabel:{ color:'#c4b5fd'} }, tooltip:{ trigger:'item' }, series:[{ type:'bar', data:items.map(i=>({ value:i.val, itemStyle:{ color:new echarts.graphic.LinearGradient(0,0,1,1,[{offset:0,color:'#8b5cf6'},{offset:1,color:'#ec4899'}]) }})), barWidth:18, label:{ show:true, position:'right', color:'#fff'} }] });
    const resize = () => inst.resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [breakdown, loading, error]);

  // Main body selection
  let mainBody;
  if (loading) {
    mainBody = <div className="py-24"><SoloLoading/></div>;
  } else if (error) {
    mainBody = (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-xl text-red-400">Error: {error}</p>
          <button onClick={()=>fetchAscensionData(true)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-md hover:from-purple-500 hover:to-pink-400 transition-all hover-glow">Retry</button>
        </div>
      </div>
    );
  } else {
    mainBody = (
      <>
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`${theme.colors.card} rounded-xl p-5 ${theme.colors.border} shadow-lg ${theme.colors.shadow} relative overflow-hidden`}> 
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.5),transparent_60%)]" />
            <h2 className="text-sm uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2"><BadgeCheck className="w-4 h-4"/>Rank Evaluation</h2>
            <p className="text-lg">Current Rank: <span className="font-bold text-purple-200">{report?.currentRank}</span></p>
            <p className={`mt-2 text-sm ${ascended ? 'text-green-400' : 'text-red-400'}`}>{ascended ? `Ascended to ${newRank}-Rank` : 'No ascension this cycle'}</p>
            <div className="mt-4 h-40" id="hs-gauge" aria-label="Hunter Score Gauge" />
          </div>
          <div className={`${theme.colors.card} rounded-xl p-5 ${theme.colors.border} shadow-lg ${theme.colors.shadow} flex flex-col`}> 
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm uppercase tracking-widest text-purple-400 flex items-center gap-2"><Activity className="w-4 h-4"/> Core Metrics</h2>
              <button onClick={()=>fetchAscensionData(true)} disabled={refreshing} className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-50"><RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`}/>{refreshing?'':'Refresh'}</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
              <MetricCard label="XP" value={breakdown?.xp} icon={<Zap className="w-3 h-3"/>} />
              <MetricCard label="Stat Lvls" value={breakdown?.totalStatLevels} icon={<TrendingUp className="w-3 h-3"/>} />
              <MetricCard label="Completed" value={`${breakdown?.completedMissions}/${breakdown?.totalMissions}`} icon={<Target className="w-3 h-3"/>} />
              <MetricCard label="Avg Streak" value={breakdown?.avgStreak} icon={<BarChart3 className="w-3 h-3"/>} />
            </div>
            <p className="mt-auto pt-3 text-[11px] text-purple-400/70">Gauge target milestone: 1000 Hunter Score</p>
          </div>
          <div className={`${theme.colors.card} rounded-xl p-5 ${theme.colors.border} shadow-lg ${theme.colors.shadow}`}> 
            <h2 className="text-sm uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2"><Award className="w-4 h-4"/> Rewards</h2>
            {ascended && reward ? (
              <ul className="space-y-1 text-sm">
                <li>🎖️ <strong>{reward.title}</strong></li>
                <li>💰 {reward.coins} Coins</li>
                <li>⚡ {reward.xp} XP</li>
              </ul>
            ) : <p className="text-purple-300 text-xs">Ascend to unlock new rewards.</p>}
            <div className="mt-4 h-36" id="hs-bars" aria-label="Contribution Bars" />
          </div>
        </div>
        <div className={`${theme.colors.card} rounded-xl p-6 ${theme.colors.border} shadow-lg mt-8`}> 
          <h2 className="text-sm uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Hunter Score Composition</h2>
          <div className="h-80" id="hs-pie" aria-label="Hunter Score Composition Pie" />
          <p className="mt-4 text-center text-purple-300 text-xs">Total Hunter Score: <span className="text-white font-semibold">{report?.hunterScore}</span></p>
        </div>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <AuthLayout>
        <style>{styles}</style>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 px-8 py-10 text-white relative overflow-hidden" style={{ fontFamily: theme.fonts.primary }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-32 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full" />
            <div className="absolute bottom-24 left-20 w-72 h-72 bg-pink-600/20 blur-3xl rounded-full" />
          </div>
          <div className="max-w-screen-lg mx-auto space-y-8">
            <button onClick={() => navigate(-1)} className={`${theme.colors.accent} hover:text-purple-300 flex items-center mb-4 transition-colors duration-300 hover-glow`} aria-label="Go back">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
            <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"><BadgeCheck className="w-7 h-7 text-purple-400" /> Ascension Trial Results</h1>
            {mainBody}
            <div className="mt-10"><MissionInfoPanel sections={['rank-ascension','streak-upgrade','rewards','penalties']} title="Ascension Factors & Rules" /></div>
          </div>
        </div>
      </AuthLayout>
    </ErrorBoundary>
  );
};

// Small metric badge component
const MetricCard = ({ label, value, icon }) => (
  <div className="bg-gray-900/60 border border-purple-500/30 rounded-md p-2 flex flex-col gap-1 hover:shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-300">
    <span className="text-[10px] uppercase tracking-wider text-purple-400 flex items-center gap-1">{icon}{label}</span>
    <span className="text-sm font-semibold text-white">{value ?? '-'}</span>
  </div>
);

export default AscensionTrial;