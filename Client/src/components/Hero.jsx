import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030305] font-['Rajdhani'] selection:bg-[#a855f7]/30">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#050608]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.15]"></div>
        {/* Glow behind center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#a855f7]/10 to-[#3b82f6]/10 blur-[100px] rounded-full flex-shrink-0 pointer-events-none"></div>
      </div>

      {/* Main Content - Centered */}
      <div className="container relative z-10 px-4 flex flex-col items-center text-center mt-[-5vh]">
        
        {/* Top SYS Tag */}
        <div className="mb-8 inline-flex items-center gap-3 px-6 py-2 rounded-sm border border-[#a855f7]/30 bg-[#a855f7]/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-md">
          <div className="w-2 h-2 bg-[#a855f7] rounded-sm animate-pulse shadow-[0_0_8px_#a855f7]"></div>
          <span className="text-[#a855f7] text-xs font-black tracking-[0.4em] uppercase">
            SYS_DIR: AWAKENING
          </span>
          <div className="w-2 h-2 bg-[#3b82f6] rounded-sm animate-pulse shadow-[0_0_8px_#3b82f6]" style={{ animationDelay: "0.5s" }}></div>
        </div>

        {/* Global Tech Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black mb-8 tracking-tighter uppercase font-['Exo_2'] italic text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] flex flex-col lg:block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 lg:mr-5 pr-4 py-2">LEVEL UP</span>
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#a855f7] filter drop-shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:drop-shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all duration-500 pr-4 py-2">
              YOUR REALITY
            </span>
        </h1>

        {/* Subtitle Definition */}
        <p className="max-w-3xl text-sm sm:text-base text-gray-400 leading-loose font-bold tracking-[0.2em] uppercase mb-12 border-y border-[#1f2937]/50 py-6 bg-black/20 backdrop-blur-sm">
           Gamify your life. Acquire <span className="text-gray-200 font-black">rare capabilities</span>, map out stat builds, and ascend ranks through real-world actions. Welcome to the <span className="text-[#a855f7] font-black drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">System</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto relative group">
          {/* Corner accents for button area */}
          <div className="absolute -inset-6 border border-[#a855f7]/0 group-hover:border-[#a855f7]/20 transition-colors duration-500 hidden sm:block pointer-events-none">
            <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#a855f7]"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#a855f7]"></div>
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto min-w-[240px] px-10 py-5 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] hover:from-[#9333ea] hover:to-[#7c3aed] text-white text-sm font-black tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5 relative overflow-hidden"
            style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)] -translate-x-[150%] transition-transform duration-700 group-hover:translate-x-[150%]" />
            <span className="relative z-10 flex items-center justify-center gap-3">
                Initializing <Zap className="text-[#e9d5ff] ml-2 w-4 h-4" />
            </span>
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto min-w-[240px] px-10 py-5 bg-[#0a0a0f] text-gray-300 border border-[#1f2937] hover:border-[#3b82f6]/60 hover:bg-[#3b82f6]/10 text-sm font-black tracking-[0.25em] uppercase transition-all duration-300 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
          >
            <span className="relative z-10">Access Terminal</span>
          </button>
        </div>
      </div>

      {/* Decorative Tech Elements - Bottom Corners */}
      <div className="absolute bottom-10 left-10 hidden md:flex flex-col gap-2 pointer-events-none opacity-50">
        <div className="text-[10px] font-black tracking-[0.3em] text-[#a855f7] uppercase">SYS.v2.4</div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-1.5 bg-[#1f2937]"></div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-10 right-10 hidden md:flex flex-col gap-2 pointer-events-none opacity-50 text-right items-end">
         <div className="text-[10px] font-black tracking-[0.3em] text-[#3b82f6] uppercase">SECURE CONN</div>
         <div className="w-40 h-[2px] bg-[#3b82f6]/30"></div>
         <div className="w-20 h-[2px] bg-[#3b82f6]/30"></div>
      </div>
    </div>
  );
};

export default Hero;
