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
    <div className="min-h-screen p-6 text-white" style={{ fontFamily: "'Rajdhani','Orbitron',monospace" }}>
      <h1 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 drop-shadow">LEADERBOARD</h1>
      <div className="max-w-5xl mx-auto bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/30 shadow-lg p-4 md:p-6">
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {Object.keys(sortLabel).map(k => (
            <button key={k} onClick={() => handleSort(k)} className="px-4 py-1 rounded-full text-sm bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 transition" >Sort: {sortLabel[k]}</button>
          ))}
        </div>
        {loading && <div className="text-center py-10 text-purple-300">Loading leaderboard...</div>}
        {error && <div className="text-center py-10 text-red-400">Error loading leaderboard</div>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="text-left text-purple-300 border-b border-purple-500/30">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Hunter</th>
                  <th className="py-2 pr-2 cursor-pointer" onClick={() => handleSort('rank')}>Rank</th>
                  <th className="py-2 pr-2 cursor-pointer" onClick={() => handleSort('level')}>Lvl</th>
                  <th className="py-2 pr-2 cursor-pointer" onClick={() => handleSort('xp')}>XP</th>
                  <th className="py-2 pr-2 cursor-pointer" onClick={() => handleSort('coins')}>Coins</th>
                  <th className="py-2 pr-2 cursor-pointer" onClick={() => handleSort('totalMission')}>Missions</th>
                  <th className="py-2 pr-2">Title</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-purple-500/10 hover:bg-purple-500/10 transition">
                    <td className="py-2 pr-2 font-bold text-purple-300">{r.place}</td>
                    <td className="py-2 pr-2 flex items-center gap-2">
                      <span className="font-semibold">{r.username || 'Unknown'}</span>
                    </td>
                    <td className="py-2 pr-2">{r.rank}</td>
                    <td className="py-2 pr-2">{r.level}</td>
                    <td className="py-2 pr-2">{r.xp}</td>
                    <td className="py-2 pr-2 flex items-center gap-1"><Coins size={14} className="text-yellow-300" />{r.coins}</td>
                    <td className="py-2 pr-2">{r.totalMission}</td>
                    <td className="py-2 pr-2 text-yellow-400 truncate max-w-[150px]">{r.titles?.[0] || '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-purple-300">No hunters found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
