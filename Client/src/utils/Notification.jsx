import { useEffect } from 'react';
import { Star, Award, BarChart2, CheckCircle, Skull, Zap } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

// Animation keyframes
const styles = `
  @keyframes fadeInUpTech {
    from { opacity: 0; transform: translateY(10px) translateX(20px); filter: blur(4px); }
    to { opacity: 1; transform: translateY(0) translateX(0); filter: blur(0); }
  }
  .animate-fade-in-up-tech {
    animation: fadeInUpTech 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(200%); }
  }
  .animate-scanline {
    animation: scanline 2s linear infinite;
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

    const timer = setTimeout(() => shift(), 3000);
    return () => clearTimeout(timer);
  }, [queue, shift]);

  if (!queue.length) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="fixed top-20 right-6 flex flex-col gap-3 z-50 pointer-events-none">
        {queue.map((notif, index) => {
          if (!notif || !notif.type) {
            console.warn('Invalid or missing notification:', notif);
            return null;
          }

          let message = '';
          let icon = null;
          let bgColor = 'bg-gray-500';
          let textColor = 'text-gray-500';
          let notifTypeLabel = 'SYS.MSG';
          const isPenalty = notif.isPenalty || (notif.delta < 0 && notif.type !== 'mission');

          switch (notif.type) {
            case 'xp':
              message = `${notif.delta > 0 ? '+' : ''}${notif.delta} XP → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? <Skull className="w-4 h-4" /> : <Star className="w-4 h-4" />;
              bgColor = isPenalty ? 'bg-red-500' : 'bg-[#a855f7]';
              textColor = isPenalty ? 'text-red-500' : 'text-[#a855f7]';
              notifTypeLabel = isPenalty ? 'EXP.PENALTY' : 'EXP.GAINED';
              break;

            case 'level':
              message = `LEVEL ${isPenalty ? 'DOWN' : 'UP'}! → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? <Skull className="w-4 h-4" /> : <Award className="w-4 h-4" />;
              bgColor = isPenalty ? 'bg-red-500' : 'bg-yellow-500';
              textColor = isPenalty ? 'text-red-500' : 'text-yellow-500';
              notifTypeLabel = isPenalty ? 'SYS.DEGRADE' : 'SYS.UPGRADE';
              break;

            case 'coins':
              message = `${notif.delta > 0 ? '+' : ''}${notif.delta} COINS → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? <Skull className="w-4 h-4" /> : <Award className="w-4 h-4" />;
              bgColor = isPenalty ? 'bg-red-500' : 'bg-[#3b82f6]';
              textColor = isPenalty ? 'text-red-500' : 'text-[#3b82f6]';
              notifTypeLabel = isPenalty ? 'FUNDS.LOST' : 'FUNDS.ACQUIRED';
              break;

            case 'stat':
              message = `${notif.key || 'STAT'} ${notif.delta !== 0 ? (notif.delta > 0 ? `+${notif.delta}` : notif.delta) : ''} → ${notif.newValue || 'N/A'}`;
              icon = isPenalty ? <Skull className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />;
              bgColor = isPenalty ? 'bg-red-500' : 'bg-[#ec4899]';
              textColor = isPenalty ? 'text-red-500' : 'text-[#ec4899]';
              notifTypeLabel = isPenalty ? 'STAT.DECREASE' : 'STAT.INCREASE';
              break;

            case 'mission':
              if (notif.key === 'deleted' || notif.key === 'error') {
                message = notif.key === 'deleted' ? `MISSION PURGED: ${notif.newValue}` : `MISSION ERR: ${notif.newValue}`;
                icon = <Skull className="w-4 h-4" />;
                bgColor = 'bg-red-500';
                textColor = 'text-red-500';
                notifTypeLabel = 'MISSION.FAIL';
              } else {
                message = notif.key === 'accepted' ? `MISSION ACCEPTED: ${notif.newValue}` : 
                          notif.key === 'generated' ? `NEW TARGET: ${notif.newValue}` : 
                          `MISSION UPDATED: ${notif.newValue}`;
                icon = <CheckCircle className="w-4 h-4" />;
                bgColor = 'bg-[#10b981]';
                textColor = 'text-[#10b981]';
                notifTypeLabel = 'MISSION.UPDATE';
              }
              break;

            default:
              message = 'UNKNOWN NOTIFICATION';
              icon = <Zap className="w-4 h-4" />;
              bgColor = 'bg-gray-500';
              textColor = 'text-gray-500';
              notifTypeLabel = 'SYS.MSG';
          }

          return (
            <div
              key={index}
              className="flex items-stretch w-[320px] bg-[#050608]/95 backdrop-blur-xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-fade-in-up-tech group overflow-hidden pointer-events-auto"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                animationDelay: `${index * 0.05}s`,
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
              }}
            >
              {/* Left Accent Bar */}
              <div className={`w-1.5 shrink-0 ${bgColor} relative overflow-hidden`}>
                 <div className="absolute inset-0 bg-white/20 animate-scanline"></div>
              </div>
              
              <div className="p-3 flex items-center gap-3 w-full relative">
                {/* Background scanning grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:0.5rem_0.5rem] opacity-[0.03] pointer-events-none z-0"></div>
                
                <div className={`w-8 h-8 shrink-0 flex items-center justify-center bg-[#121319] border border-white/5 relative z-10 ${textColor}`}>
                  {icon}
                  <div className={`absolute inset-0 ${bgColor} opacity-10 blur-sm`}></div>
                </div>
                
                <div className="flex flex-col relative z-10 flex-1 min-w-0 pr-2">
                  <div className={`text-[9px] font-black tracking-[0.2em] uppercase mb-0.5 opacity-80 ${textColor}`}>
                     {notifTypeLabel}
                  </div>
                  <span className="text-[13px] font-bold tracking-wide text-gray-200 truncate block">
                     {message}
                  </span>
                </div>
                
                {/* Corner Decoration */}
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${bgColor} animate-pulse`}></div>
                <div className="absolute bottom-1 right-1 w-[4px] h-[4px] border-b border-r border-white/20"></div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
