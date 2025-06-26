import React from 'react'
import { Link } from 'react-router-dom';

const MissionCard = ({ tracker, index }) => {
  const progressPercentage = Math.floor((tracker.daycount / tracker.duration) * 100);

  return (
    <Link
      to={`/missions/${tracker.id}`}
      className="animate-fadeInUp"
      style={{ animationDelay: `${index * 0.1}s`, fontFamily: `'Poppins', sans-serif` }}
    >
     

     <div className="relative w-72 h-96 rounded-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:rotate-1 group">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://i.pinimg.com/736x/f6/86/e6/f686e63dda13314108d03863ddfd9f00.jpg')`,
          }}
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/40 to-blue-900/60" />

        {/* Inner Shadow Effect */}
        <div
          className="absolute inset-0 shadow-inner-lg"
          style={{
            boxShadow:
              "inset 0 0 60px rgba(0,0,0,0.7), inset 0 0 20px rgba(147, 51, 234, 0.3)",
          }}
        />

        {/* Glowing Orb */}
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse shadow-lg shadow-cyan-500/50" />

        {/* Card Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          {/* Header Section */}
          <div>
            {/* Mission Title */}
            <h2 className="text-xl font-black tracking-wider mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-lg">
             { tracker.title}
            </h2>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-4 text-xs font-bold">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">👑</span>
                <span className="text-yellow-300 drop-shadow-md">RANK: {tracker.rank}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-400">🔥</span>
                <span className="text-orange-300 drop-shadow-md">{tracker.streak} DAYS</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-cyan-400">⏱️</span>
                <span className="text-cyan-300 drop-shadow-md">{tracker.duration} DAYS</span>
              </div>
            </div>
          </div>
          <div className=" space-y-2">
            {/* Progress Section */}
            <div className="mb-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-300">
                  PROGRESS
                </span>
                <span className="text-xs font-bold text-cyan-400">
                  DAY 1/5 • {progressPercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-cyan-500/50"
                  style={{ width: `${progressPercentage}%` }}
                />
                {/* Shimmer Effect */}
                <div
                  className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                    transform: "translateX(-100%)",
                    animation: "shimmer 2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            {/* Bottom Section - Rewards & Penalties */}
            <div className="flex justify-between gap-4">
              {/* Rewards */}
              <div className="flex-1">
                <div className="text-[10px] font-black text-emerald-400 mb-1 tracking-widest">
                  ⚡ REWARDS
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="text-emerald-300">XP: {tracker.reward?.xp || 0}</div>
                  <div className="text-emerald-300">COINS: {tracker.reward?.coins || 0}</div>
                </div>
              </div>

              {/* Penalties */}
              <div className="flex-1">
                <div className="text-[10px] font-black text-red-400 mb-1 tracking-widest">
                  💀 PENALTIES
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="text-red-300">SKIP: {tracker.penalty?.skip?.coins || 0}</div>
                  <div className="text-red-300">FAIL: {tracker.penalty?.missionFail?.coins || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holographic Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
          }}
        />

        {/* Edge Glow */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-500/30 group-hover:border-cyan-400/60 transition-colors duration-300" />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        .shadow-inner-lg {
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.7),
            inset 0 0 20px rgba(147, 51, 234, 0.3);
        }
      `}</style>
  </Link>
)};

export default MissionCard;
