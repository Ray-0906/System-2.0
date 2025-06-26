import React from 'react';
import { cn } from '../utils/cn';

const SkillCard = ({ skill, userStats = {}, unlockedSkills = [], onUnlock }) => {
  const isUnlocked = unlockedSkills.includes(skill.id);
  
  // Progress calculation
  const totalRequired = skill.statRequired.length;
  const fulfilled = skill.statRequired.filter(req => {
    return (userStats?.[req.stat]?.level || 0) >= req.value;
  }).length;

  const progressPercent = Math.round((fulfilled / totalRequired) * 100);
  const unlockable = !isUnlocked && progressPercent === 100;

  // Determine button state
  let buttonText = 'Locked';
  let buttonClass = 'bg-gray-700 text-gray-400 cursor-not-allowed';
  let buttonDisabled = true;

  if (isUnlocked) {
    buttonText = 'Unlocked';
    buttonClass = 'bg-gray-700 text-gray-500 cursor-default';
  } else if (unlockable) {
    buttonText = 'Obtain';
    buttonClass = 'bg-blue-700 hover:bg-blue-800 text-white';
    buttonDisabled = false;
  }

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#1a1e2a] to-[#0f141f] rounded-lg p-4 text-white shadow-lg shadow-black/40 border-2 border-gray-600',
        'transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]',
        isUnlocked && 'ring-2 ring-opacity-50 ring-offset-2 ring-offset-[#0f141f] ring-gray-600'
      )}
    >
      {/* Card Border Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gray-600" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-gray-600" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-gray-600" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gray-600" />

      <img
        src={skill.icon}
        alt={skill.name}
        className="w-16 h-16 mx-auto rounded-md mb-3 border border-gray-600"
      />
      <h3 className="text-lg font-bold text-center uppercase tracking-wider mb-1">{skill.name}</h3>
      <p className="text-sm text-gray-400 text-center mb-2">{skill.description}</p>

      <div className="mb-2 text-xs text-gray-300 space-y-1">
        <p><span className="font-semibold">Rank:</span> {skill.rank}</p>
        <p><span className="font-semibold">Min Level:</span> {skill.minLevel}</p>
        {skill.statRequired.map(req => (
          <p key={req.stat}>
            <span className="capitalize">{req.stat}:</span>{" "}
            <span className={userStats?.[req.stat]?.level >= req.value ? "text-green-500" : "text-red-500"}>
              {userStats?.[req.stat]?.level || 0}/{req.value}
            </span>
          </p>
        ))}
      </div>

      <div className="mt-3 mb-2">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-700 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-center mt-1 text-gray-300">
          {isUnlocked ? "Unlocked" : unlockable ? "Ready to Obtain" : "Locked"}
        </p>
      </div>

      <button
        disabled={buttonDisabled}
        onClick={() => onUnlock && onUnlock(skill.id)}
        className={cn(
          'w-full py-2 mt-2 rounded text-sm font-semibold uppercase transition',
          buttonClass
        )}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default SkillCard;