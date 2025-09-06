import { useQuery, useMutation } from '@apollo/client';
import { useState, useMemo } from 'react';
import MissionInfoPanel from '../components/MissionInfoPanel';
import AuthLayout from '../components/AuthLayout';
import { GET_SIDEQUESTS, CREATE_SIDEQUEST, COMPLETE_SIDEQUEST, GET_USER } from '../graphql/query';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';

const difficultyColors = {
  trivial: 'bg-gray-600/30 text-gray-200 border-gray-400/40',
  easy: 'bg-emerald-600/30 text-emerald-200 border-emerald-400/40',
  medium: 'bg-amber-600/30 text-amber-200 border-amber-400/40',
  hard: 'bg-rose-700/30 text-rose-200 border-rose-400/40'
};

const statBadges = {
  strength: 'text-red-300',
  intelligence: 'text-sky-300',
  agility: 'text-green-300',
  endurance: 'text-yellow-300',
  charisma: 'text-pink-300'
};

function SidequestCard({ sq, onComplete }) {
  const diffCls = difficultyColors[sq.evaluated?.difficulty] || difficultyColors.trivial;
  return (
    <div className="relative rounded-xl p-4 bg-gradient-to-br from-[#141414] via-[#0f0f16] to-[#121221] border border-white/10 shadow-md hover:shadow-purple-700/20 transition group w-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sm text-white tracking-wide">{sq.title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffCls}`}>{sq.evaluated?.difficulty?.toUpperCase()}</span>
      </div>
      {sq.description && <p className="text-xs text-purple-200/80 mb-3 leading-snug line-clamp-3">{sq.description}</p>}
      <div className="flex items-center gap-4 text-[11px] mb-3">
        <span className="flex items-center gap-1 text-amber-300 font-medium">⚡ {sq.evaluated?.xp}</span>
        <span className="flex items-center gap-1 text-yellow-300 font-medium">🪙 {sq.evaluated?.coins}</span>
        <span className={`flex items-center gap-1 font-medium ${statBadges[sq.evaluated?.stat]}`}>{sq.evaluated?.stat}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-purple-300/60">{new Date(sq.createdAt).toLocaleDateString()}</span>
        {sq.status === 'pending' ? (
          <button onClick={() => onComplete(sq.id)} className="text-[11px] px-3 py-1 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:from-purple-500 hover:to-pink-400 transition shadow">
            Complete
          </button>
        ) : (
          <span className="text-emerald-400 text-[11px] font-semibold">Completed ✓</span>
        )}
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export default function Sidequests() {
  const { data, loading, refetch } = useQuery(GET_SIDEQUESTS, { variables: { status: 'pending' }, fetchPolicy: 'cache-and-network' });
  const [ refetchUser ] = useMutation(COMPLETE_SIDEQUEST); // placeholder to keep structure (we'll refetch with useQuery below if needed)
  const [createSidequest] = useMutation(CREATE_SIDEQUEST);
  const [completeSidequest] = useMutation(COMPLETE_SIDEQUEST);
  const push = useNotificationStore(s => s.push);
  const user = useUserStore(s => s.user);
  const updateXP = useUserStore(s => s.updateXP);
  const updateCoin = useUserStore(s => s.updateCoin);
  const updateLevel = useUserStore(s => s.updateLevel);
  const updateStats = useUserStore(s => s.updateStats);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', hintEffort: '' });
  const [filter, setFilter] = useState('all'); // local difficulty filter still applies on already pending list

  const sidequests = data?.getSidequests || [];
  const filtered = useMemo(() => sidequests.filter(sq => filter === 'all' || sq.evaluated?.difficulty === filter), [sidequests, filter]);
  const completedThisWeek = useMemo(() => sidequests.filter(sq => sq.status === 'completed' && (Date.now() - new Date(sq.completedAt).getTime()) < 7*24*3600*1000).length, [sidequests]);

  async function handleCreate(e) {
    e.preventDefault();
    if(!form.title.trim()) return;
    await createSidequest({ variables: { input: { ...form, deadline: form.deadline || null } }, onCompleted: () => { setModalOpen(false); setForm({ title:'', description:'', deadline:'', hintEffort:'' }); refetch(); } });
  }

  async function handleComplete(id) {
    await completeSidequest({ variables: { id }, onCompleted: (res) => {
      refetch();
      if(sq){
        // XP notification
        push({ type: 'xp', delta: sq.evaluated?.xp || 0, newValue: (user?.xp||0) + (sq.evaluated?.xp||0) });
        // Coins notification
        push({ type: 'coins', delta: sq.evaluated?.coins || 0, newValue: (user?.coins||0) + (sq.evaluated?.coins||0) });
        // Stat notification
        push({ type: 'stat', key: (sq.evaluated?.stat || 'stat').toUpperCase(), delta: gain, newValue: (user?.stats?.[sq.evaluated?.stat]?.value || 0) + gain });
      }
      // Optimistic local augmentation if we have evaluated values in cache
      const sq = sidequests.find(s => s.id === id);
      const incMap = { trivial:0, easy:1, medium:2, hard:3 };
      if(sq && user){
        const gain = incMap[sq.evaluated?.difficulty] ?? 1;
        updateXP((user.xp||0) + (sq.evaluated?.xp||0));
        updateCoin((user.coins||0) + (sq.evaluated?.coins||0));
        const statKey = sq.evaluated?.stat;
        if(statKey && user.stats?.[statKey]){
          const current = user.stats[statKey];
          updateStats(statKey, current.value + gain, current.level);
        }
      }
      // Optionally refetch pending list to remove completed sidequest
      refetch();
    }});
  }

  return (
    <AuthLayout>
  <div className="min-h-screen px-6 py-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-32 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full" />
          <div className="absolute bottom-24 left-20 w-72 h-72 bg-pink-600/20 blur-3xl rounded-full" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-500 text-transparent bg-clip-text drop-shadow">SIDEQUESTS</h1>
              <p className="text-purple-300 mt-2 text-sm max-w-xl">Log quick errands and let the system evaluate them for small rewards. No pressure, just momentum.</p>
              <div className="mt-3 text-[12px] text-purple-200/70">Weekly Progress: <span className="text-emerald-300 font-semibold">{completedThisWeek}</span> completed</div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-gray-800/70 border border-white/10 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="all">All Difficulties</option>
                <option value="trivial">Trivial</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button onClick={()=>setModalOpen(true)} className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-sm font-semibold hover:from-purple-500 hover:to-pink-400 shadow">
                + Add Sidequest
              </button>
              <button onClick={()=>refetch()} className="px-4 py-2 rounded-md bg-gray-800/70 text-sm font-semibold border border-white/10 hover:bg-gray-700/70">Refresh</button>
            </div>
          </header>

          {loading && <div className="text-purple-300 text-sm mb-4">Loading...</div>}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(sq => (
              <SidequestCard key={sq.id} sq={sq} onComplete={handleComplete} />
            ))}
            {filtered.length === 0 && !loading && (
              <div className="col-span-full text-center text-purple-300/70 text-sm py-10">No sidequests found.</div>
            )}
          </div>

          <div className="mt-12">
            <MissionInfoPanel
              title="Sidequest System Explained"
              sections={['core-loop','rewards','penalties','tips']}
              defaultOpen={false}
            />
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#141421] border border-white/10 rounded-xl p-6 relative shadow-xl">
              <h2 className="text-xl font-bold mb-4 tracking-wide">Create Sidequest</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 tracking-wider text-purple-300">TITLE</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Buy groceries" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 tracking-wider text-purple-300">DESCRIPTION</label>
                  <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Optional context" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 tracking-wider text-purple-300">DEADLINE</label>
                    <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 tracking-wider text-purple-300">EFFORT HINT</label>
                    <input value={form.hintEffort} onChange={e=>setForm(f=>({...f,hintEffort:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. 30 min" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 text-sm rounded-md bg-gray-700/60 hover:bg-gray-600/60">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm rounded-md bg-gradient-to-r from-purple-600 to-pink-500 font-semibold hover:from-purple-500 hover:to-pink-400">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
