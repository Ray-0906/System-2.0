import React, { useState } from 'react';

/**
 * MissionInfoPanel
 * Collapsible rules / guidance panel explaining the mission system.
 * Props:
 *  context: string ("active" | "details" | "create" | "custom" | "ascension") to tailor emphasis
 */
const sectionsBase = [
  {
    id: 'core-loop',
    title: 'Core Mission Loop',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Your mission contains a small set of daily quests (tasks).</li>
        <li>Complete ALL listed quests for the day to preserve your streak.</li>
        <li>New quests (or upgraded ones) appear after midnight (local time) or when you upgrade.</li>
      </ul>
    )
  },
  {
    id: 'streak-upgrade',
    title: 'Streak & Upgrades',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Your streak increases only when every quest for the day is completed.</li>
        <li>Missing even one quest breaks daily completion and risks penalties (see Penalties).</li>
        <li>After reaching a streak threshold (e.g. 5 days) you can Upgrade to generate harder, higher‑reward quests.</li>
        <li>Upgrading never resets streak; it just refreshes quests at a higher difficulty tier.</li>
      </ul>
    )
  },
  {
    id: 'rewards',
    title: 'Rewards',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Each quest grants XP + a stat increase tied to its focus (e.g. Strength, Intelligence).</li>
        <li>Completing the entire day preserves streak momentum → larger long‑term XP/stat growth.</li>
        <li>Mission rank influences total reward ranges (higher rank = bigger ceilings).</li>
        <li>Some missions include a special reward (artifact, title, or bonus coins) on completion.</li>
      </ul>
    )
  },
  {
    id: 'penalties',
    title: 'Penalties',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li><strong>Skip</strong>: Intentionally end a day early – lose the listed coins / stat points, streak stays but no gain.</li>
        <li><strong>Fail</strong>: Let the day expire with remaining quests – heavier coin & stat penalties and streak impact.</li>
        <li>Repeated failures reduce efficiency toward rank ascension.</li>
      </ul>
    )
  },
  {
    id: 'calendar-reset',
    title: 'Daily Reset & Calendar',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>The countdown you see is time left until local midnight.</li>
        <li>A blue tick on the calendar indicates a fully completed day (all quests done).</li>
        <li>Finish early? You can still review quests; rewards are already locked in.</li>
      </ul>
    )
  },
  {
    id: 'ai-vs-custom',
    title: 'AI vs Custom Missions',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li><strong>AI Missions</strong>: Describe a goal – system generates structured quests + tuned penalties/rewards.</li>
        <li><strong>Custom Missions</strong>: You define tasks manually. The system still calculates rewards & penalties.</li>
        <li>Pick AI for inspiration / pacing; pick Custom for precise habit tracking.</li>
      </ul>
    )
  },
  {
    id: 'rank-ascension',
    title: 'Rank & Ascension Influence',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Consistent streaks + completed missions feed Hunter Score used in Ascension Trials.</li>
        <li>Higher ranks unlock better base reward scaling and cosmetic effects.</li>
        <li>Failing frequently lowers contribution toward ascension progress.</li>
      </ul>
    )
  },
  {
    id: 'tips',
    title: 'Strategic Tips',
    body: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Lock in a short early streak (3–5 days) before increasing mission difficulty.</li>
        <li>Group similar stat quests on the same day to amplify focused leveling.</li>
        <li>Use custom missions to reinforce weak stats deliberately.</li>
        <li>Don’t hoard upgrades—take them when quests feel trivial.</li>
      </ul>
    )
  }
];

const contextPruning = {
  active: ['core-loop','streak-upgrade','rewards','penalties','rank-ascension','tips'],
  details: ['core-loop','calendar-reset','streak-upgrade','rewards','penalties','tips'],
  create: ['ai-vs-custom','core-loop','rewards','penalties','streak-upgrade','tips'],
  custom: ['ai-vs-custom','core-loop','rewards','penalties','streak-upgrade','tips'],
  ascension: ['rank-ascension','streak-upgrade','rewards','penalties','tips']
};

export default function MissionInfoPanel({ context = 'active', defaultOpen = false, sections, variant = 'full', title }) {
  const [open, setOpen] = useState(defaultOpen);
  const relevantIds = sections ? sections : (contextPruning[context] || contextPruning.active);
  const filtered = sectionsBase.filter(s => relevantIds.includes(s.id));

  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-purple-500/30 bg-black/40 backdrop-blur-sm p-4 space-y-3 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
        <h3 className="text-xs font-semibold tracking-wider text-purple-200 uppercase">{title || 'Quick Mission Rules'}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(sec => (
            <div key={sec.id} className="bg-gray-900/50 rounded-md border border-purple-500/20 p-3">
              <p className="text-[11px] font-bold tracking-wide text-pink-300 mb-1 uppercase">{sec.title}</p>
              <div className="text-[11px] leading-relaxed text-purple-200 space-y-1">
                {sec.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-500/40 bg-black/40 backdrop-blur-sm shadow-[0_0_18px_rgba(139,92,246,0.15)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left group"
      >
        <span className="text-sm font-semibold tracking-wider bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title || 'Mission Rules & Guidance'}
        </span>
        <span className="text-purple-300 text-xs group-hover:text-pink-300 transition-colors">{open ? 'HIDE' : 'SHOW'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 text-purple-200">
          {filtered.map(sec => (
            <details key={sec.id} className="group border border-purple-500/20 rounded-md overflow-hidden bg-gray-900/40" open>
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold tracking-wide flex items-center justify-between bg-gradient-to-r from-gray-900/60 to-gray-800/40">
                <span className="text-purple-300 group-open:text-pink-300 transition-colors">{sec.title}</span>
                <span className="text-purple-400 text-[10px] group-open:rotate-90 transition-transform">›</span>
              </summary>
              <div className="p-3 text-purple-200/90 leading-relaxed">
                {sec.body}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
