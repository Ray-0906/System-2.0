import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';

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
  const ParticleField = ({ color = 'purple' }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 bg-${color}-400 rounded-full opacity-20`}
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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .gradient-border {
          border: 1px solid transparent;
          background: linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(31, 41, 55, 0.8)) padding-box,
                      linear-gradient(145deg, rgba(168, 85, 247, 0.5), rgba(59, 130, 246, 0.5)) border-box;
        }
        .card-3d {
          transform: perspective(1000px) translateZ(0);
          transition: transform 0.5s ease, box-shadow 0.5s ease;
        }
        .card-3d:hover {
          transform: perspective(1000px) translateZ(20px) translateY(-4px);
        }
        .pulse-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid currentColor;
          opacity: 0;
          transform: scale(0);
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden" ref={containerRef}>
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-indigo-900/10" />
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)`,
            }}
          />
        </div>
        <ParticleField color="purple" />

        <Hero />
        <Features />

        {/* Stats & Progression Section */}
        <div className="py-32 bg-black relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/10 via-gray-950 to-purple-900/10" />
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)`,
              }}
            />
          </div>
          <ParticleField color="purple" />

          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20 animate-on-scroll">
              <div className="inline-flex items-center px-6 py-3 mb-8 bg-purple-500/10 backdrop-blur-sm rounded-full text-purple-300 border border-purple-500/30">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse" />
                Your Hunter Journey
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                  Unleash Your Inner Hunter
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Earn rare skills, equip mystical artifacts, and build your unique stat build — powered by your real-life actions.
              </p>
            </div>

            {/* Skills & Artifacts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-on-scroll">
              {/* Skills Section */}
              <div className="space-y-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-white group">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring">
                    <i className="fas fa-bullseye text-xl"></i>
                  </span>
                  <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                    Skills
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Focus Burst', level: 'Intelligence Lv.15', desc: 'Increases productivity by 30% for 2 hours. Cooldown: 24 hours.', icon: 'fa-bolt', color: 'purple' },
                    { title: 'Agile Thinking', level: 'Agility Lv.20', desc: 'Reduces decision-making time by 25%. Passive skill.', icon: 'fa-running', color: 'indigo' },
                    { title: 'Mental Fortitude', level: 'Endurance Lv.25', desc: 'Reduces stress impact by 40% during high-pressure situations.', icon: 'fa-shield-alt', color: 'blue' },
                    { title: 'Silver Tongue', level: 'Charisma Lv.18', desc: 'Increases persuasion success rate by 35% in social interactions.', icon: 'fa-comments', color: 'pink' },
                  ].map((skill, index) => (
                    <div
                      key={index}
                      className={`group relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-${skill.color}-500/50 transition-all duration-500 card-3d hover:shadow-${skill.color}-500/20 overflow-hidden`}
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-${skill.color}-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-${skill.color}-500/20 to-indigo-500/20 flex items-center justify-center text-${skill.color}-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring`}>
                          <i className={`fas ${skill.icon} text-xl`}></i>
                        </div>
                        <div>
                          <h4 className={`font-bold text-${skill.color}-400 group-hover:text-${skill.color}-300 transition-colors duration-300`}>{skill.title}</h4>
                          <div className="text-xs text-gray-400">{skill.level}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">{skill.desc}</p>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts Section */}
              <div className="space-y-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-white group">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring">
                    <i className="fas fa-gem text-xl"></i>
                  </span>
                  <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                    Artifacts
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Crown of Wisdom', rarity: 'Mythic', desc: '+15 Intelligence, +10% learning speed for all new skills.', icon: 'fa-crown', color: 'yellow' },
                    { title: 'Amulet of Haste', rarity: 'Epic', desc: '+20 Agility, reduces task completion time by 15%.', icon: 'fa-tachometer-alt', color: 'purple' },
                    { title: 'Heart of Endurance', rarity: 'Rare', desc: '+25 Endurance, +20% recovery rate after completing difficult tasks.', icon: 'fa-heart', color: 'blue' },
                    { title: 'Dice of Fortune', rarity: 'Common', desc: '+10 Luck, 5% chance to double rewards from completed quests.', icon: 'fa-dice', color: 'green' },
                  ].map((artifact, index) => (
                    <div
                      key={index}
                      className={`group relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-${artifact.color}-500/50 transition-all duration-500 card-3d hover:shadow-${artifact.color}-500/20 overflow-hidden`}
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-${artifact.color}-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-${artifact.color}-500/20 to-indigo-500/20 flex items-center justify-center text-${artifact.color}-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring`}>
                          <i className={`fas ${artifact.icon} text-xl`}></i>
                        </div>
                        <div>
                          <h4 className={`font-bold text-${artifact.color}-400 group-hover:text-${artifact.color}-300 transition-colors duration-300`}>{artifact.title}</h4>
                          <div className={`text-xs text-${artifact.color}-600`}>{artifact.rarity}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">{artifact.desc}</p>
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-16 animate-on-scroll">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center text-white group">
                <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring">
                  <i className="fas fa-chart-line text-xl"></i>
                </span>
                <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                  Your Current Stats
                </span>
              </h3>
              <div className="relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 card-3d hover:shadow-purple-500/20 overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
                    }}
                  />
                </div>
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Radar Chart */}
                  <div className="relative h-80 w-full">
                    <div ref={statsChartRef} className="h-full w-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 backdrop-blur-sm border border-purple-400/50 animate-pulse flex items-center justify-center">
                        <i className="fas fa-star text-purple-400"></i>
                      </div>
                    </div>
                  </div>
                  {/* Stats Details */}
                  <div className="space-y-6">
                    {/* Level Progress */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-purple-400">Level</span>
                        <span className="text-sm font-medium text-purple-400">24</span>
                      </div>
                      <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: '65%' }}
                        />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">65% to Level 25</span>
                        <span className="text-xs text-gray-400">12,450 / 19,000 XP</span>
                      </div>
                    </div>
                    {/* Rank Progress */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-blue-400">Rank</span>
                        <span className="text-sm font-medium text-blue-400">C</span>
                      </div>
                      <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: '40%' }}
                        />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Progress to Rank B</span>
                        <span className="text-xs text-gray-400">40%</span>
                      </div>
                    </div>
                    {/* Achievements & Streak */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group relative bg-gray-800/30 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 card-3d hover:shadow-yellow-500/20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center mb-2">
                          <i className="fas fa-trophy text-yellow-500 mr-2 pulse-ring"></i>
                          <span className="font-medium text-gray-300 group-hover:text-yellow-400 transition-colors duration-300">Achievements</span>
                        </div>
                        <div className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300">32 / 100</div>
                      </div>
                      <div className="group relative bg-gray-800/30 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 card-3d hover:shadow-orange-500/20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center mb-2">
                          <i className="fas fa-fire text-orange-500 mr-2 pulse-ring"></i>
                          <span className="font-medium text-gray-300 group-hover:text-orange-400 transition-colors duration-300">Current Streak</span>
                        </div>
                        <div className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors duration-300">14 days</div>
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