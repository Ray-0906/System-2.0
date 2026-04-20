import React, { useRef, useEffect, useState } from "react";

const Features = () => {
  const [activeTab, setActiveCard] = useState(0);

  const features = [
    {
      icon: "fa-layer-group",
      title: "Mission Generation",
      type: "SYS.MDL.01",
      description: "Create custom missions or enter a goal — the AI engine synthesizes dynamic quest lines instantly.",
      color: "#a855f7"
    },
    {
      icon: "fa-brain",
      title: "Adaptive Quests",
      type: "SYS.MDL.02",
      description: "Quests evolve dynamically. The system tracks your consistency, identifying failure points to calibrate difficulty.",
      color: "#3b82f6"
    },
    {
      icon: "fa-chart-line",
      title: "Stat Tracking",
      type: "SYS.MDL.03",
      description: "Your real-world actions translate directly into RPG attributes. Enhance Strength, Intelligence, and Agility.",
      color: "#ec4899"
    },
    {
      icon: "fa-crown",
      title: "Rank Ascension",
      type: "SYS.MDL.04",
      description: "Pass AI-powered ascension trials. Prove your worth to rise from E-Rank novice to S-Rank sovereign.",
      color: "#eab308"
    },
    {
      icon: "fa-cube",
      title: "Artifact Retrieval",
      type: "SYS.MDL.05",
      description: "Gain access to passive modifiers and system-breaking skills matching your physical and mental progression.",
      color: "#10b981"
    },
    {
      icon: "fa-medal",
      title: "Achievements",
      type: "SYS.MDL.06",
      description: "Log monumental milestones and unlock unique titles that alter your resonance with the System.",
      color: "#f97316"
    }
  ];

  return (
    <section className="py-24 bg-[#030305] relative overflow-hidden font-['Rajdhani'] selection:bg-[#a855f7]/30">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a855f7]/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-[#a855f7]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container relative z-10 px-4 mx-auto max-w-6xl">
        {/* Header HUD Element */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1f2937] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-[#3b82f6]/30 bg-[#3b82f6]/5">
              <div className="w-1.5 h-1.5 bg-[#3b82f6] animate-pulse shadow-[0_0_5px_#3b82f6]"></div>
              <span className="text-[#3b82f6] text-[10px] font-black tracking-[0.3em] uppercase">SYS_DIR: ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider font-['Exo_2'] italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#3b82f6]">Modules</span>
            </h2>
          </div>
          
          <div className="text-right hidden md:block">
             <div className="text-xs font-bold text-gray-500 tracking-[0.2em] mb-1">SYSTEM INTEGRITY</div>
             <div className="text-xl font-black text-[#a855f7] font-['Exo_2']">100.0%</div>
             <div className="w-32 h-[2px] bg-[#1f2937] mt-2 relative">
               <div className="absolute top-0 left-0 h-full bg-[#a855f7] w-full shadow-[0_0_5px_#a855f7]"></div>
             </div>
          </div>
        </div>

        {/* Dynamic Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
             <div 
               key={idx}
               onMouseEnter={() => setActiveCard(idx)}
               className="group relative bg-[#0a0b10] border border-[#1f2937] hover:border-[#a855f7]/50 p-6 transition-all duration-500 overflow-hidden"
               style={{ 
                 clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)"
               }}
             >
               {/* Hover Scanline */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#a855f7]/10 to-transparent -translate-y-full group-hover:animate-[scanline-vertical_2s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100"></div>

               {/* Top left corner accent */}
               <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1f2937] group-hover:bg-[#a855f7] transition-colors"></div>
                 <div className="absolute top-0 left-0 w-[2px] h-full bg-[#1f2937] group-hover:bg-[#a855f7] transition-colors"></div>
               </div>

               <div className="flex justify-between items-start mb-8 relative z-10">
                 <div 
                   className="w-12 h-12 flex items-center justify-center bg-[#121319] border border-[#1f2937] transition-all duration-500 group-hover:scale-110 shadow-lg"
                   style={{ boxShadow: activeTab === idx ? `0 0 15px ${feature.color}40` : 'none', borderColor: activeTab === idx ? `${feature.color}60` : '#1f2937' }}
                 >
                   <i className={`fas ${feature.icon} text-xl`} style={{ color: activeTab === idx ? feature.color : '#6b7280' }}></i>
                 </div>
                 <div className="text-[10px] font-black tracking-widest text-[#1f2937] group-hover:text-gray-500 transition-colors uppercase">
                   {feature.type}
                 </div>
               </div>

               <div className="relative z-10">
                 <h3 className="text-xl font-bold text-gray-200 group-hover:text-white uppercase tracking-wider mb-3 transition-colors">
                   {feature.title}
                 </h3>
                 <p className="text-sm font-medium text-gray-500 group-hover:text-gray-400 uppercase tracking-wide leading-relaxed">
                   {feature.description}
                 </p>
               </div>

               {/* Bottom right cut accent */}
               <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#1f2937] group-hover:bg-[#a855f7] transition-colors" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}></div>
             </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes scanline-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  );
};

export default Features;
