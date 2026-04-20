import React from "react";
import { useNavigate } from "react-router-dom";

const CtaFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative bg-[#030305] border-t border-[#1f2937] overflow-hidden font-['Rajdhani'] selection:bg-[#a855f7]/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#050608]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.05]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-gradient-to-r from-[#a855f7]/5 to-[#3b82f6]/5 blur-[80px] rounded-[100%]"></div>
      </div>

      <div className="container relative z-10 px-4 py-24 mx-auto max-w-4xl text-center flex flex-col items-center">
        
        {/* Terminal Header */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 border border-[#ef4444]/30 bg-[#ef4444]/5">
          <div className="w-1.5 h-1.5 bg-[#ef4444] animate-pulse shadow-[0_0_5px_#ef4444]"></div>
          <span className="text-[#ef4444] text-[10px] font-black tracking-[0.4em] uppercase">
            SYS_DIR: TERMINATION_SEQUENCE
          </span>
        </div>

        {/* Huge Title */}
        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8 font-['Exo_2'] italic drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          Ready To <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#3b82f6]">Awaken?</span>
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm md:text-base max-w-2xl mb-12 border-y border-[#1f2937] py-4 bg-[#0a0b10]/50 backdrop-blur-sm">
          Stop watching others level up. Integrate with the System. Log your tasks, clear your daily quests, and claim your rewards.
        </p>

        {/* Call to Action Button */}
        <button
          onClick={() => navigate("/signup")}
          className="group relative min-w-[280px] px-8 py-5 bg-[#121319] hover:bg-[#1a1b24] outline-none border border-[#a855f7]/50 hover:border-[#a855f7] transition-all duration-500 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
        >
          {/* Animated fill effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7] to-[#3b82f6] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.2)_50%,transparent_75%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          
          <span className="relative z-10 flex items-center justify-center gap-4 text-white font-black tracking-[0.3em] uppercase text-sm">
            INITIATE LINK
            <i className="fas fa-chevron-right text-[#a855f7] group-hover:translate-x-1 transition-transform"></i>
          </span>
        </button>

        {/* Scanlines bottom */}
        <div className="mt-16 w-full flex flex-col items-center gap-1 opacity-20 pointer-events-none">
          <div className="w-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent"></div>
          <div className="w-1/6 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent"></div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="border-t border-[#1f2937]/50 bg-[#050608]">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-[0.2em] text-gray-600 uppercase">
          <div><i className="fas fa-shield-alt text-[#1f2937] mr-2"></i> System 2.0 PROTOCOL © 2026</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-gray-400 cursor-pointer transition-colors">STATUS: ONLINE</span>
            <span className="text-[#a855f7] flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-ping"></div>
              v2.4.9
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CtaFooter;
