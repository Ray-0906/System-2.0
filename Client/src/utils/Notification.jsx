import { useEffect } from 'react';
import { Star, Award, BarChart2, CheckCircle, Skull } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

// Solo Leveling-inspired theme
const theme = {
  fonts: {
    primary: "'Orbitron', sans-serif",
  },
  colors: {
    penalty: 'bg-gradient-to-r from-red-600/90 to-pink-600/90',
    xp: 'bg-gradient-to-r from-indigo-600/90 to-blue-600/90',
    level: 'bg-gradient-to-r from-yellow-600/90 to-amber-600/90',
    coins: 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90',
    stat: 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90',
    missionSuccess: 'bg-gradient-to-r from-green-600/90 to-emerald-600/90',
    missionError: 'bg-gradient-to-r from-red-600/90 to-pink-600/90',
    default: 'bg-gradient-to-r from-gray-800 to-gray-900',
    border: 'border-indigo-400/50',
    shadow: 'shadow-indigo-500/50',
    text: 'text-white',
    iconPenalty: 'text-red-300',
    iconXP: 'text-yellow-300',
    iconLevel: 'text-white',
    iconCoins: 'text-blue-300',
    iconStat: 'text-purple-300',
    iconMission: 'text-green-300',
  },
  animations: {
    fadeInUp: 'animate-fade-in-up',
  },
};

// Animation keyframes
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
`;

export default function NotificationPopup() {
  const queue = useNotificationStore((s) => s.queue);
  const shift = useNotificationStore((s) => s.shift);

  useEffect(() => {
    if (!queue.length) return;

    const notif = queue[0];
    const isPenalty =
      notif.isPenalty ||
      (notif.delta < 0 && notif.type !== 'mission') ||
      (notif.type === 'mission' && notif.key === 'error');

    try {
      const audio = new Audio(isPenalty ? '/sounds/penalty.mp3' : '/sounds/reward.mp3');
      audio.play().catch((error) => {
        console.warn('Audio playback failed:', error);
      });
    } catch (error) {
      console.warn('Failed to load audio file:', error);
    }

    const timer = setTimeout(() => shift(), 2500);
    return () => clearTimeout(timer);
  }, [queue, shift]);

  if (!queue.length) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="fixed top-6 right-2 flex flex-col gap-2 z-50">
        {queue.map((notif, index) => {
          if (!notif || !notif.type) {
            console.warn('Invalid or missing notification:', notif);
            return null;
          }

          let message = '';
          let icon = null;
          let bgStyle = theme.colors.default;
          const isPenalty = notif.isPenalty || (notif.delta < 0 && notif.type !== 'mission');

          switch (notif.type) {
            case 'xp':
              message = `${notif.delta > 0 ? '+' : ''}${notif.delta} XP → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? (
                <Skull className={`w-5 h-5 mr-2 ${theme.colors.iconPenalty} drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]`} />
              ) : (
                <Star className={`w-5 h-5 mr-2 ${theme.colors.iconXP} drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]`} />
              );
              bgStyle = isPenalty ? theme.colors.penalty : theme.colors.xp;
              break;
            case 'level':
              message = `Level ${isPenalty ? 'Down' : 'Up'}! → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? (
                <Skull className={`w-5 h-5 mr-2 ${theme.colors.iconPenalty} drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]`} />
              ) : (
                <Award className={`w-5 h-5 mr-2 ${theme.colors.iconLevel} drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]`} />
              );
              bgStyle = isPenalty ? theme.colors.penalty : theme.colors.level;
              break;
            case 'coins':
              message = `${notif.delta > 0 ? '+' : ''}${notif.delta} Coins → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? (
                <Skull className={`w-5 h-5 mr-2 ${theme.colors.iconPenalty} drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]`} />
              ) : (
                <Award className={`w-5 h-5 mr-2 ${theme.colors.iconCoins} drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]`} />
              );
              bgStyle = isPenalty ? theme.colors.penalty : theme.colors.coins;
              break;
            case 'stat':
              message = `${notif.key || 'Stat'} ${notif.delta !== 0 ? (notif.delta > 0 ? `+${notif.delta}` : notif.delta) : ''} → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? (
                <Skull className={`w-5 h-5 mr-2 ${theme.colors.iconPenalty} drop-shadow-[0_0_4px_rgba(239,68,0.6)]`} />
              ) : (
                <BarChart2 className={`w-5 h-5 mr-2 ${theme.colors.iconStat} drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]`} />
              );
              bgStyle = isPenalty ? theme.colors.penalty : theme.colors.stat;
              break;
            case 'mission':
              message =
                notif.key === 'accepted'
                  ? `Mission Accepted: ${notif.newValue}`
                  : notif.key === 'generated'
                  ? `Mission Generated: ${notif.newValue}`
                  : `Mission Error: ${notif.newValue}`;
              icon = notif.key === 'error' ? (
                <Skull className={`w-5 h-5 mr-2 ${theme.colors.iconPenalty} drop-shadow-[0_0_4px_rgba(239,68,0.6)]`} />
              ) : (
                <CheckCircle className={`w-5 h-5 mr-2 ${theme.colors.iconMission} drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]`} />
              );
              bgStyle = notif.key === 'error' ? theme.colors.missionError : theme.colors.missionSuccess;
              break;
            default:
              message = 'Unknown notification';
              icon = <Skull className="w-5 h-5 mr-2 text-gray-300" />;
          }

          return (
            <div
              key={index}
              className={`w-[300px] ${bgStyle} ${theme.colors.text} px-4 py-2 rounded-md ${theme.colors.shadow} ${theme.colors.border} ${theme.animations.fadeInUp}`}
              style={{
                fontFamily: theme.fonts.primary,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {icon}
              <span className="text-sm">{message}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
