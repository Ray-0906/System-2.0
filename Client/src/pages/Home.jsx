import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Target, Zap, PersonStanding, Shield, MessageSquare, Box, Crown, Gauge, Heart, Dices, TrendingUp, Trophy, Flame } from 'lucide-react';

import Hero from '../components/Hero';
import Features from '../components/Features';
import CtaFooter from '../components/CtaFooter';

const HomePage = () => {
  const statsChartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section) => observer.observe(section));
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ECharts for AI system visualization
  useEffect(() => {
    if (statsChartRef.current && isVisible) {
      const chart = echarts.init(statsChartRef.current);
      const option = {
        animation: true,
        animationDuration: 2000,
        radar: {
          indicator: [
            { name: 'Strength', max: 100 },
            { name: 'Agility', max: 100 },
            { name: 'Intelligence', max: 100 },
            { name: 'Endurance', max: 100 },
            { name: 'Charisma', max: 100 },
            { name: 'Luck', max: 100 },
          ],
          radius: 120,
          splitNumber: 4,
          axisName: {
            color: '#d1d5db',
            fontSize: 12,
            fontWeight: 'bold',
          },
          splitArea: {
            areaStyle: {
              color: [
                'rgba(168, 85, 247, 0.1)',
                'rgba(168, 85, 247, 0.2)',
                'rgba(168, 85, 247, 0.3)',
                'rgba(168, 85, 247, 0.4)',
              ],
            },
          },
          axisLine: {
            lineStyle: { color: 'rgba(255, 255, 255, 0.2)' },
          },
          splitLine: {
            lineStyle: { color: 'rgba(255, 255, 255, 0.2)' },
          },
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: [85, 70, 90, 65, 75, 60],
                name: 'Your Stats',
                areaStyle: { color: 'rgba(168, 85, 247, 0.6)' },
                lineStyle: { width: 2, color: '#a855f7' },
                itemStyle: { color: '#d8b4fe' },
              },
            ],
            animation: true,
            animationEasing: 'elasticOut',
          },
        ],
        graphic: [
          {
            type: 'circle',
            shape: { r: 10 },
            style: { fill: '#a855f7', opacity: 0.7 },
            position: [0, 0],
            z: 10,
            animation: {
              type: 'scale',
              loop: true,
              duration: 2000,
              easing: 'elasticOut',
            },
          },
        ],
      };
      chart.setOption(option);
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  // Particle Field Component
  const ParticleField = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.05] pointer-events-none mix-blend-screen mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)"></div>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-[#a855f7] shadow-[0_0_8px_#a855f7] rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(180deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
        }
        @keyframes scanline-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .cyber-card {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
          position: relative;
        }
        .cyber-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 15px;
          height: 15px;
          background: rgba(168, 85, 247, 0.4);
          clip-path: polygon(100% 0, 0 100%, 100% 100%);
        }
        .hover-glow-tech {
          transition: all 0.3s ease;
        }
        .hover-glow-tech:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
          border-color: rgba(168, 85, 247, 0.5);
        }
        .pulse-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid currentColor;
          opacity: 0;
          transform: scale(0);
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#030305] text-gray-200 font-['Rajdhani'] relative overflow-hidden" ref={containerRef}>
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-black to-[#08080a]" />
          <div
            className="absolute inset-0 transition-all duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)`,
            }}
          />
        </div>
        <ParticleField color="purple" />

        <Hero />
        <Features />

        {/* Stats & Progression Section */}
        <div className="py-32 bg-transparent relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.03]"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20 animate-on-scroll">
              <div className="inline-flex items-center px-4 py-1 mb-6 border border-[#a855f7]/30 bg-[#a855f7]/5 text-[#a855f7] tracking-[0.3em] text-xs font-bold uppercase backdrop-blur-sm shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full mr-2 animate-ping" />
                SYS_DIR: EVOLUTION
              </div>
              <h2 className="text-5xl md:text-6xl font-black italic tracking-widest mb-6 font-['Exo_2'] uppercase">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  System Intel:
                </span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#a855f7] drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  Growth
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto tracking-wide uppercase font-semibold">
                Acquire rare capabilities, map out stat builds, and ascend ranks through real-world actions.
              </p>
            </div>

            {/* Skills & Artifacts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-on-scroll">
              {/* Skills Section */}
              <div className="space-y-8">
                <h3 className="text-2xl font-black italic tracking-widest text-white group flex items-center font-['Exo_2'] uppercase">
                  <div className="w-10 h-10 bg-[#121319] border border-white/10 flex items-center justify-center mr-4 text-[#a855f7] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#a855f7]/10 animate-pulse"></div>
                    <Target className="relative z-10 w-5 h-5" />
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                    Active Skills
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Focus Burst', level: 'INT LV.15', desc: 'Increases productivity by 30% for 2 hours. Cooldown: 24h.', icon: Zap, color: '#a855f7' },
                    { title: 'Agile Thinking', level: 'AGI LV.20', desc: 'Reduces decision-making time by 25%. Passive.', icon: PersonStanding, color: '#3b82f6' },
                    { title: 'Mental Fortitude', level: 'END LV.25', desc: 'Reduces stress impact by 40% under pressure.', icon: Shield, color: '#ec4899' },
                    { title: 'Silver Tongue', level: 'CHA LV.18', desc: 'Increases persuasion success rate by 35%.', icon: MessageSquare, color: '#eab308' },
                  ].map((skill, index) => (
                    <div
                      key={index}
                      className="cyber-card bg-[#050608]/80 backdrop-blur-md p-5 border border-white/5 hover-glow-tech group"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:0.5rem_0.5rem] opacity-5 pointer-events-none mix-blend-screen"></div>
                      <div className="absolute top-0 left-0 w-1 h-full opacity-50 overflow-hidden" style={{ backgroundColor: skill.color }}>
                         <div className="absolute inset-0 bg-white/50 animate-scanline-vertical"></div>
                      </div>
                      
                      <div className="ml-3">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 rounded-sm bg-[#121319] border border-white/10 flex items-center justify-center mr-3" style={{ color: skill.color }}>
                            <i className={`fas ${skill.icon}`}></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide uppercase text-sm">{skill.title}</h4>
                            <div className="text-[10px] font-black tracking-widest uppercase opacity-70" style={{ color: skill.color }}>{skill.level}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors uppercase font-medium leading-relaxed">{skill.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts Section */}
              <div className="space-y-8">
                <h3 className="text-2xl font-black italic tracking-widest text-white group flex items-center font-['Exo_2'] uppercase">
                  <div className="w-10 h-10 bg-[#121319] border border-white/10 flex items-center justify-center mr-4 text-[#eab308] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#eab308]/10 animate-pulse"></div>
                    <Box className="relative z-10 w-5 h-5" />
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                    Artifact Inventory
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Crown of Wisdom', rarity: 'MYTHIC', desc: '+15 INT. +10% learning speed globally.', icon: Crown, color: '#eab308' },
                    { title: 'Amulet of Haste', rarity: 'EPIC', desc: '+20 AGI. -15% task completion par time.', icon: Gauge, color: '#a855f7' },
                    { title: 'Heart of Endurance', rarity: 'RARE', desc: '+25 END. +20% stamina recovery rate.', icon: Heart, color: '#3b82f6' },
                    { title: 'Dice of Fortune', rarity: 'COMMON', desc: '+10 LCK. 5% chance double rewards.', icon: Dices, color: '#10b981' },
                  ].map((artifact, index) => (
                    <div
                      key={index}
                      className="cyber-card bg-[#050608]/80 backdrop-blur-md p-5 border border-white/5 hover-glow-tech group"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:0.5rem_0.5rem] opacity-5 pointer-events-none mix-blend-screen"></div>
                      <div className="absolute top-0 right-0 w-full h-[1px] opacity-70" style={{ backgroundImage: `linear-gradient(to left, ${artifact.color}, transparent)` }}></div>
                      
                      <div>
                        <div className="flex items-center mb-3 justify-between">
                          <div className="flex items-center">
                             <div className="w-8 h-8 rounded-sm bg-[#121319] border border-white/10 flex items-center justify-center mr-3" style={{ color: artifact.color, boxShadow: `0 0 10px ${artifact.color}33` }}>
                               <i className={`fas ${artifact.icon}`}></i>
                             </div>
                             <h4 className="font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide uppercase text-sm">{artifact.title}</h4>
                          </div>
                        </div>
                        <div className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: artifact.color }}>CLASS: {artifact.rarity}</div>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors uppercase font-medium leading-relaxed">{artifact.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-20 animate-on-scroll relative">
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-[#a855f7] to-transparent opacity-50"></div>
              
              <h3 className="text-2xl font-black italic tracking-widest mb-8 flex items-center justify-center text-white group font-['Exo_2'] uppercase">
                <div className="flex items-center justify-center mr-4 relative">
                  <div className="w-12 h-1 bg-[#3b82f6] absolute -left-14 opacity-50"></div>
                    <TrendingUp className="text-[#3b82f6] relative z-10 w-6 h-6" />
                  <div className="w-12 h-1 bg-[#3b82f6] absolute -right-14 opacity-50"></div>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
                  Real-time Diagnostics
                </span>
              </h3>
              
              <div className="cyber-card bg-[#0a0b10] border border-white/10 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#3b82f6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] mix-blend-screen pointer-events-none"></div>

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Radar Chart */}
                  <div className="relative h-80 w-full flex justify-center">
                    <div className="absolute inset-0 rounded-full border border-white/5 bg-[#121319]/50 animate-[spin_60s_linear_infinite]" style={{ clipPath: 'circle(48% at 50% 50%)' }}>
                       <div className="absolute top-0 right-1/2 w-[1px] h-1/2 bg-gradient-to-b from-[#a855f7] to-transparent origin-bottom animate-ping"></div>
                    </div>
                    <div ref={statsChartRef} className="h-full w-full relative z-10" />
                  </div>
                  
                  {/* Stats Details */}
                  <div className="space-y-8">
                    {/* Level Progress */}
                    <div className="bg-[#121319] border border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7]"></div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-black tracking-[0.2em] text-[#a855f7] uppercase">Player Level</span>
                        <span className="text-xs font-black tracking-[0.2em] text-white">LV. 24</span>
                      </div>
                      <div className="w-full bg-[#050608] h-2 relative overflow-hidden border border-white/10">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.8)_2px,rgba(0,0,0,0.8)_4px)] z-10 pointer-events-none"></div>
                        <div
                          className="bg-gradient-to-r from-[#a855f7] to-[#d8b4fe] h-full shadow-[0_0_10px_#a855f7]"
                          style={{ width: '65%' }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">65% SYNCHRONIZED</span>
                        <span className="text-[10px] uppercase font-bold text-[#a855f7] tracking-widest">12,450 / 19,000 XP</span>
                      </div>
                    </div>
                    
                    {/* Rank Progress */}
                    <div className="bg-[#121319] border border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]"></div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-black tracking-[0.2em] text-[#3b82f6] uppercase">Current Rank</span>
                        <span className="text-xs font-black tracking-[0.2em] text-white">CLASS C</span>
                      </div>
                      <div className="w-full bg-[#050608] h-2 relative overflow-hidden border border-white/10">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.8)_2px,rgba(0,0,0,0.8)_4px)] z-10 pointer-events-none"></div>
                        <div
                          className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] h-full shadow-[0_0_10px_#3b82f6]"
                          style={{ width: '40%' }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">PROMOTION RUN TO CLASS B</span>
                        <span className="text-[10px] uppercase font-bold text-[#3b82f6] tracking-widest">40%</span>
                      </div>
                    </div>

                    {/* Achievements & Streak */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#121319] border border-white/5 p-4 flex flex-col items-center justify-center relative overflow-hidden group/ach">
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover/ach:opacity-100 transition duration-300"></div>
                        <div className="text-yellow-500 mb-2">
                          <Trophy className="drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-1">ACHIEVEMENTS</div>
                        <div className="text-xl font-black text-white font-['Exo_2']">32 <span className="text-gray-600 text-sm">/ 100</span></div>
                      </div>
                      
                      <div className="bg-[#121319] border border-white/5 p-4 flex flex-col items-center justify-center relative overflow-hidden group/str">
                        <div className="absolute inset-0 bg-[#ef4444]/5 opacity-0 group-hover/str:opacity-100 transition duration-300"></div>
                        <div className="text-[#ef4444] mb-2">
                          <Flame className="drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] w-6 h-6 text-red-500" />
                        </div>
                        <div className="text-xs font-bold tracking-[0.2em] text-gray-400 mb-1">STREAK LOG</div>
                        <div className="text-xl font-black text-white font-['Exo_2']">14 <span className="text-gray-600 text-sm">DAYS</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CtaFooter />
      </div>
    </>
  );
};

export default HomePage;