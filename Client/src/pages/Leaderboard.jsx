import { useQuery } from '@apollo/client';
import { GET_LEADERBOARD } from '../graphql/query';
import { useMemo } from 'react';
import { Trophy, Sword, Flame, Coins } from 'lucide-react';

const sortLabel = {
  xp: 'XP',
  level: 'Level',
  coins: 'Coins',
  totalMission: 'Missions'
};

export default function Leaderboard() {
  const { data, loading, error, refetch } = useQuery(GET_LEADERBOARD, {
    variables: { limit: 20, sortBy: 'xp' },
    fetchPolicy: 'network-only'
  });

  const users = data?.leaderboard || [];

  const rows = useMemo(() => users.map((u, idx) => ({
    ...u,
    place: idx + 1
  })), [users]);

  const handleSort = (field) => {
    refetch({ limit: 20, sortBy: field });
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 pb-24 relative overflow-hidden font-['Exo_2']"
      onMouseMove={(e) => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
      `}</style>
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
        {/* Header Section */}
        <div className="mb-12 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-[#3b82f6] animate-ping rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            <h3 className="text-[#3b82f6] text-xs font-black tracking-[0.4em] font-['Rajdhani'] uppercase">SYSTEM INTERFACE // GLOBAL RANKS</h3>
          </div>
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase">
            LEADERBOARD
          </h1>
        </div>

        <div className="bg-[#090b10] border border-[#1e2330] p-6 relative overflow-hidden font-['Rajdhani']">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a855f7]/30 to-transparent"></div>
        <div className="flex flex-wrap gap-3 justify-center mb-8 relative z-10">
          <span className="px-4 py-1 text-gray-500 font-bold tracking-[0.2em] text-xs uppercase flex items-center">SORT BY:</span>
          {Object.keys(sortLabel).map(k => (
            <button key={k} onClick={() => handleSort(k)} className="px-4 py-1 border border-white/10 text-gray-400 hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 hover:border-[#3b82f6]/50 font-bold tracking-widest text-xs uppercase transition-all" >
              {sortLabel[k]}
            </button>
          ))}
        </div>
        {loading && <div className="text-center py-20 text-[#3b82f6] animate-pulse tracking-[0.3em] font-bold text-sm">SYNCHRONIZING HUNTER RANKS...</div>}
        {error && <div className="text-center py-20 text-red-500 tracking-[0.3em] font-bold text-sm">SYSTEM ERROR: UNABLE TO FETCH DATA</div>}
        
        {!loading && !error && (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs tracking-[0.2em] uppercase">
                  <th className="py-4 pl-4 font-bold">#</th>
                  <th className="py-4 px-2 font-bold">Hunter ID</th>
                  <th className="py-4 px-2 font-bold cursor-pointer hover:text-[#3b82f6] transition-colors" onClick={() => handleSort('rank')}>Rank</th>
                  <th className="py-4 px-2 font-bold cursor-pointer hover:text-[#3b82f6] transition-colors" onClick={() => handleSort('level')}>Lvl</th>
                  <th className="py-4 px-2 font-bold cursor-pointer hover:text-[#3b82f6] transition-colors" onClick={() => handleSort('xp')}>XP</th>
                  <th className="py-4 px-2 font-bold cursor-pointer hover:text-[#3b82f6] transition-colors" onClick={() => handleSort('coins')}>Coins</th>
                  <th className="py-4 px-2 font-bold cursor-pointer hover:text-[#3b82f6] transition-colors" onClick={() => handleSort('totalMission')}>Missions</th>
                  <th className="py-4 pr-4 font-bold">Current Title</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const getRankColor = (rank) => {
                    const map = { S: 'text-[#ffb000]', A: 'text-[#ff3366]', B: 'text-[#a855f7]', C: 'text-[#06b6d4]', D: 'text-[#3b82f6]', E: 'text-[#94a3b8]' };
                    return map[rank] || 'text-[#94a3b8]';
                  };
                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 pl-4 font-black text-gray-500 group-hover:text-gray-300">{r.place < 10 ? `0${r.place}` : r.place}</td>
                      <td className="py-4 px-2 font-bold text-gray-200 tracking-widest">{r.username || 'UNKNOWN_HUNTER'}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 bg-[#121319] border ${getRankColor(r.rank).replace('text-', 'border-')} ${getRankColor(r.rank)} text-[10px] font-black tracking-widest`}>
                          {r.rank}-CLASS
                        </span>
                      </td>
                      <td className="py-4 px-2 font-bold text-gray-300">{r.level}</td>
                      <td className="py-4 px-2 font-medium text-gray-400">{r.xp.toLocaleString()}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1.5 text-yellow-500/80 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 w-fit">
                          <Coins className="w-3 h-3" /> {r.coins.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-2 font-bold text-gray-300">{r.totalMission}</td>
                      <td className="py-4 pr-4">
                        <span className="text-[#a855f7] text-xs font-bold tracking-widest bg-[#a855f7]/10 px-2 py-1 border border-[#a855f7]/30 max-w-[150px] truncate block text-center">
                          {r.titles?.[0] || 'NO_TITLE_EQUIPPED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-500 tracking-[0.3em] font-bold text-sm">NO HUNTERS FOUND IN DATABASE</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
