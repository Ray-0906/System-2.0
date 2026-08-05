import { useEffect } from 'react';
import { Star, Award, BarChart2, CheckCircle, Skull, Zap } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

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

// ── Notification Config Map ──
// Replaces the 125-line switch. Each type maps to its display properties.
const NOTIF_CONFIG = {
  xp: {
    format: (n) => `${n.delta > 0 ? '+' : ''}${n.delta} XP → ${n.newValue ?? 'N/A'}`,
    icon: Star,
    penaltyIcon: Skull,
    color: '#a855f7',
    label: 'EXP.GAINED',
    penaltyLabel: 'EXP.PENALTY',
  },
  level: {
    format: (n) => `LEVEL ${n.isPenalty ? 'DOWN' : 'UP'}! → ${n.newValue ?? 'N/A'}`,
    icon: Award,
    penaltyIcon: Skull,
    color: '#eab308',
    label: 'SYS.UPGRADE',
    penaltyLabel: 'SYS.DEGRADE',
  },
  coins: {
    format: (n) => `${n.delta > 0 ? '+' : ''}${n.delta} COINS → ${n.newValue ?? 'N/A'}`,
    icon: Award,
    penaltyIcon: Skull,
    color: '#3b82f6',
    label: 'FUNDS.ACQUIRED',
    penaltyLabel: 'FUNDS.LOST',
  },
  stat: {
    format: (n) => `${n.key || 'STAT'} ${n.delta !== 0 ? (n.delta > 0 ? `+${n.delta}` : n.delta) : ''} → ${n.newValue ?? 'N/A'}`,
    icon: BarChart2,
    penaltyIcon: Skull,
    color: '#ec4899',
    label: 'STAT.INCREASE',
    penaltyLabel: 'STAT.DECREASE',
  },
  mission: {
    format: (n) => {
      const labels = { accepted: 'MISSION ACCEPTED', generated: 'NEW TARGET', deleted: 'MISSION PURGED', error: 'MISSION ERR' };
      return `${labels[n.key] || 'MISSION UPDATED'}: ${n.newValue}`;
    },
    icon: CheckCircle,
    // mission errors/deletes use Skull, others use CheckCircle
    color: '#10b981',
    label: 'MISSION.UPDATE',
    // overrides for negative mission events
    negativeKeys: new Set(['deleted', 'error']),
    negativeColor: 'red',
    negativeLabel: 'MISSION.FAIL',
  },
};

const PENALTY_COLOR = '#ef4444';

function resolveNotif(notif) {
  const config = NOTIF_CONFIG[notif.type];
  if (!config) {
    return { message: 'UNKNOWN NOTIFICATION', Icon: Zap, bgColor: '#6b7280', label: 'SYS.MSG' };
  }

  const isMissionNeg = notif.type === 'mission' && config.negativeKeys?.has(notif.key);
  const isPenalty = notif.isPenalty || isMissionNeg || (notif.delta < 0 && notif.type !== 'mission');

  return {
    message: config.format(notif),
    Icon: isPenalty ? (config.penaltyIcon || Skull) : config.icon,
    bgColor: isPenalty ? PENALTY_COLOR : (isMissionNeg ? PENALTY_COLOR : config.color),
    label: isPenalty ? config.penaltyLabel : (isMissionNeg ? config.negativeLabel : config.label),
  };
}

export default function NotificationPopup() {
  const queue = useNotificationStore((s) => s.queue);
  const shift = useNotificationStore((s) => s.shift);

  useEffect(() => {
    if (!queue.length) return;

    const notif = queue[0];
    const { bgColor } = resolveNotif(notif);
    const isPenalty = bgColor === PENALTY_COLOR;

    try {
      const audio = new Audio(isPenalty ? '/sounds/penalty.mp3' : '/sounds/reward.mp3');
      audio.play().catch(() => {});
    } catch (_) { /* no audio file */ }

    const timer = setTimeout(() => shift(), 3000);
    return () => clearTimeout(timer);
  }, [queue, shift]);

  if (!queue.length) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="fixed top-20 right-6 flex flex-col gap-3 z-50 pointer-events-none">
        {queue.map((notif, index) => {
          if (!notif?.type) return null;

          const { message, Icon, bgColor, label } = resolveNotif(notif);

          return (
            <div
              key={index}
              className="flex items-stretch w-[320px] bg-[#050608]/95 backdrop-blur-xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-fade-in-up-tech pointer-events-auto overflow-hidden"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                animationDelay: `${index * 0.05}s`,
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              {/* Left Accent Bar */}
              <div className="w-1.5 shrink-0 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
                <div className="absolute inset-0 bg-white/20 animate-scanline" />
              </div>

              <div className="p-3 flex items-center gap-3 w-full relative">
                <div
                  className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#121319] border border-white/5 relative z-10"
                  style={{ color: bgColor }}
                >
                  <Icon className="w-4 h-4" />
                  <div className="absolute inset-0 opacity-10 blur-sm" style={{ backgroundColor: bgColor }} />
                </div>

                <div className="flex flex-col relative z-10 flex-1 min-w-0 pr-2">
                  <div className="text-[9px] font-black tracking-[0.2em] uppercase mb-0.5 opacity-80" style={{ color: bgColor }}>
                    {label}
                  </div>
                  <span className="text-[13px] font-bold tracking-wide text-gray-200 truncate block">
                    {message}
                  </span>
                </div>

                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: bgColor }} />
                <div className="absolute bottom-1 right-1 w-[4px] h-[4px] border-b border-r border-white/20" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
