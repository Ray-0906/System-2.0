import { useQuery } from '@apollo/client';
import { useState, useMemo } from 'react';
import MissionInfoPanel from '../components/MissionInfoPanel';
import AuthLayout from '../components/AuthLayout';
import { GET_SIDEQUESTS } from '../graphql/query';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';
import axiosInstance from '../utils/axios';

// Theme + Styles
const theme = {
  fonts: { primary: "'Rajdhani', 'Orbitron', monospace" },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
`;

// Rarity/Difficulty Accent Mapping
const difficultyAccent = {
  hard: "from-red-950/40 to-black border-red-500/30 hover:border-red-400/60",
  medium: "from-amber-950/40 to-black border-amber-500/30 hover:border-amber-400/60",
  easy: "from-green-950/40 to-black border-green-500/30 hover:border-green-400/60",
  trivial: "from-gray-900/40 to-black border-gray-500/30 hover:border-gray-400/50",
};

function SidequestCard({ sq, onComplete }) {
  const diffCfg = {
    trivial: { color: 'text-gray-400', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.1)] hover:shadow-[0_0_30px_rgba(156,163,175,0.2)]', dot: 'bg-gray-400 shadow-[0_0_5px_rgba(156,163,175,0.8)]' },
    easy: { color: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]', dot: 'bg-green-400 shadow-[0_0_5px_rgba(34,197,94,0.8)]' },
    medium: { color: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]', dot: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' },
    hard: { color: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]', dot: 'bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)]' },
  };
  
  const diffKey = sq.evaluated?.difficulty || 'trivial';
  const rc = diffCfg[diffKey];

  return (
    <div className={`group relative rounded-2xl overflow-hidden border backdrop-blur-xl bg-gradient-to-br transition-all duration-500 flex flex-col justify-between ${difficultyAccent[diffKey]} ${rc.glow}`} style={{ fontFamily: theme.fonts.primary }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${rc.color}`}>{diffKey}</span>
                <span className="text-[10px] text-white/30">·</span>
                <span className="text-[9px] font-black tracking-widest text-[#a855f7] uppercase">{new Date(sq.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm font-black tracking-widest uppercase text-white leading-tight font-['Exo_2'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{sq.title}</h3>
            </div>
          </div>
          {sq.description && <p className="text-[11px] text-white/40 mt-3 leading-relaxed font-semibold tracking-wide line-clamp-2 h-[34px]">{sq.description}</p>}
        </div>

        {/* Stats */}
        <div className="px-5 pb-4 space-y-3 flex-1 flex flex-col justify-end">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded shadow-inner">
              <span className="text-[10px] font-black tracking-widest text-yellow-400">XP</span>
              <span className="text-[10px] font-black text-white">+{sq.evaluated?.xp || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded shadow-inner">
              <span className="text-[10px] font-black tracking-widest text-amber-400">COINS</span>
              <span className="text-[10px] font-black text-white">+{sq.evaluated?.coins || 0}</span>
            </div>
            {sq.evaluated?.stat && (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded shadow-inner">
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">{sq.evaluated.stat.substring(0,3)}</span>
                <span className="text-[10px] font-black text-white">+1</span>
              </div>
            )}
          </div>
        </div>

        {/* Button */}
        <div className="p-5 pt-3 border-t border-white/5 bg-black/40 flex flex-col gap-3 mt-auto">
          {sq.status === 'pending' ? (
            <button
              onClick={() => onComplete(sq.id)}
              className="w-full py-2.5 rounded-lg text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-[1.02]"
            >
              COMPLETE QUEST
            </button>
          ) : (
            <button disabled className="w-full py-2.5 rounded-lg text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300 bg-green-500/10 text-green-400 border border-green-500/30 cursor-default">
              ✓ COMPLETED
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidequests() {
  const { data, loading, refetch } = useQuery(GET_SIDEQUESTS, { variables: { status: 'pending' }, fetchPolicy: 'cache-and-network' });
  const push = useNotificationStore(s => s.push);
  const user = useUserStore(s => s.user);
  const updateXP = useUserStore(s => s.updateXP);
  const updateCoin = useUserStore(s => s.updateCoin);
  const updateStats = useUserStore(s => s.updateStats);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', hintEffort: '' });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const sidequests = data?.getSidequests || [];
  const filtered = useMemo(() => sidequests.filter(sq => filter === 'all' || sq.evaluated?.difficulty === filter), [sidequests, filter]);
  const completedThisWeek = useMemo(() => sidequests.filter(sq => sq.status === 'completed' && (Date.now() - new Date(sq.completedAt).getTime()) < 7*24*3600*1000).length, [sidequests]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  async function handleCreate(e) {
    e.preventDefault();
    if(!form.title.trim()) return;
    try {
      await axiosInstance.post('/sidequest', { ...form, deadline: form.deadline || null });
      setModalOpen(false);
      setForm({ title:'', description:'', deadline:'', hintEffort:'' });
      refetch();
    } catch(err) {
      console.error('Create sidequest error:', err);
    }
  }

  async function handleComplete(id) {
    try {
      await axiosInstance.post(`/sidequest/${id}/complete`);
      refetch();
      const sq = sidequests.find(s => s.id === id);
      const incMap = { trivial:0, easy:1, medium:2, hard:3 };
      if(sq && user){
        const gain = incMap[sq.evaluated?.difficulty] ?? 1;
        push({ type: 'xp', delta: sq.evaluated?.xp || 0, newValue: (user?.xp||0) + (sq.evaluated?.xp||0) });
        push({ type: 'coins', delta: sq.evaluated?.coins || 0, newValue: (user?.coins||0) + (sq.evaluated?.coins||0) });
        push({ type: 'stat', key: (sq.evaluated?.stat || 'stat').toUpperCase(), delta: gain, newValue: (user?.stats?.[sq.evaluated?.stat]?.value || 0) + gain });
        updateXP((user.xp||0) + (sq.evaluated?.xp||0));
        updateCoin((user.coins||0) + (sq.evaluated?.coins||0));
        const statKey = sq.evaluated?.stat;
        if(statKey && user.stats?.[statKey]){
          const current = user.stats[statKey];
          updateStats(statKey, current.value + gain, current.level);
        }
      }
    } catch(err) {
      console.error('Complete sidequest error:', err);
    }
  }

  return (
    <AuthLayout>
      <style>{styles}</style>
      <div 
        className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 pb-24 relative overflow-hidden font-['Exo_2']"
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
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            <header className="mb-12 border-b border-white/5 pb-6 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-[#a855f7] animate-ping rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                  <h3 className="text-[#a855f7] text-xs font-black tracking-[0.4em] font-['Rajdhani']">SYSTEM INTERFACE // LOG</h3>
                </div>
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  SIDEQUESTS
                </h1>
              </div>
              <div className="hidden md:flex flex-col items-end">
                <div className="text-4xl font-black font-['Rajdhani'] text-white/10">{completedThisWeek}</div>
                <div className="text-[10px] text-white/30 tracking-widest uppercase">WEEKLY COMPLETED</div>
              </div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 rounded-xl mb-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 w-full sm:w-auto sm:border-none sm:pb-0">
                {['all', 'trivial', 'easy', 'medium', 'hard'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => { setFilter(diff); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-[11px] font-black tracking-[0.1em] uppercase transition-all duration-300 whitespace-nowrap ${filter === diff ? 'bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/40 text-white/40 border border-white/5 hover:bg-white/5 hover:text-white'}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={()=>refetch()} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-white/10 text-[11px] font-black tracking-[0.1em] uppercase transition-all">
                  Refresh
                </button>
                <button onClick={()=>setModalOpen(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-[11px] font-black tracking-[0.1em] uppercase transition-all hover:scale-105">
                  + Add Sidequest
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-black/20 backdrop-blur-sm">
                <div className="text-4xl mb-4 opacity-50">📋</div>
                <h3 className="text-lg font-bold text-white/70 mb-2">No sidequests found</h3>
                <p className="text-sm text-white/40">Try creating a new one or changing your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map(sq => (
                  <SidequestCard key={sq.id} sq={sq} onComplete={handleComplete} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex justify-center items-center gap-6 pt-10 pb-4">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className={`px-5 py-2.5 rounded-lg text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${page === 1 ? 'bg-black/40 text-white/20 cursor-not-allowed border border-white/5' : 'bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/40 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'}`}
                >
                  « PREV
                </button>
                <div className="flex items-center gap-3">
                  {[...Array(totalPages)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${(i+1) === page ? 'bg-[#a855f7] scale-150 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-white/20'}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className={`px-5 py-2.5 rounded-lg text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${page === totalPages ? 'bg-black/40 text-white/20 cursor-not-allowed border border-white/5' : 'bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7]/40 hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'}`}
                >
                  NEXT »
                </button>
              </div>
            )}
            
            <div className="mt-12">
              <MissionInfoPanel
                title="Sidequest System Explained"
                sections={['core-loop','rewards','penalties','tips']}
                defaultOpen={false}
              />
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#0a0a0f] border border-purple-500/30 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(168,85,247,0.15)]">
              <h2 className="text-2xl font-black tracking-widest text-[#a855f7] mb-6 uppercase">New Sidequest</h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black mb-2 tracking-[0.2em] text-white/50 uppercase">TITLE</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-semibold" placeholder="e.g., Clean workspace" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black mb-2 tracking-[0.2em] text-white/50 uppercase">DESCRIPTION</label>
                  <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm h-24 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white/80" placeholder="Optional context..." />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black mb-2 tracking-[0.2em] text-white/50 uppercase">DEADLINE</label>
                    <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black mb-2 tracking-[0.2em] text-white/50 uppercase">EFFORT HINT</label>
                    <input value={form.hintEffort} onChange={e=>setForm(f=>({...f,hintEffort:e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all" placeholder="e.g. 30 min" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-white/5">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-6 py-2.5 text-[11px] font-black tracking-widest uppercase rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/70">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 text-[11px] font-black tracking-widest uppercase rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
