import React, { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, User, BarChart2, Shield, Swords } from 'lucide-react';
import { statLevelThresholds, userLevelThresholds } from "../utils/levelling";

import AuthLayout from "../components/AuthLayout";
import { useUserStore } from "../store/userStore";



// --- Helper & Sub-Components ---

// 1. Animated Particle Background
const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const setup = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 20000);
        for (let i = 0; i < particleCount; i++) {
            particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() * 0.5 - 0.25),
            speedY: (Math.random() * 0.5 - 0.25),
            });
        }
    };

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x > canvas.width || p.x < 0) p.speedX *= -1;
        if (p.y > canvas.height || p.y < 0) p.speedY *= -1;

        ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      setup();
    };

    setup();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    }
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};


// 2. Animated Progress Bar
const ProgressBar = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.7)]"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
};

// 3. Hunter Profile Card
const HunterProfile = ({ user }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
    className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_25px_rgba(139,92,246,0.2)] border border-purple-500/30 relative overflow-hidden"
  >
    <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-3xl"></div>
    <h2 className="text-xl text-center font-semibold mb-4 border-b border-purple-700/50 pb-2 flex items-center justify-center gap-2"><User size={20} /> HUNTER ID</h2>
    <div className="flex flex-col items-center mb-6 relative z-10">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.7)] mb-4 transform hover:scale-105 transition-transform duration-300">
        <img
          src="https://readdy.ai/api/search-image?query=Anime%20style%20portrait%20of%20a%20mysterious%20hunter%20with%20dark%20green%20hair%20and%20intense%20eyes%2C%20looking%20directly%20at%20viewer%20with%20a%20serious%20expression%2C%20dark%20atmospheric%20background%20with%20subtle%20shadows%2C%20high%20quality%20digital%20art&width=300&height=300&seq=1&orientation=squarish"
          alt="Shadow Monarch Avatar"
          className="w-full h-full object-cover object-top"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x300/1a1a1a/c084fc?text=Hunter'; }}
        />
      </div>
      <div className="text-center">
        <p><span className="text-purple-400">IDENT:</span> {user?.username || 'N/A'}</p>
        <p><span className="text-purple-400">TITLE:</span> <span className="text-yellow-400">{user?.titles?.[0] || "Shadow Soldier"}</span></p>
        <p><span className="text-purple-400">RANK:</span> <span className="text-yellow-400 font-bold text-lg">{user?.rank || 'E'}</span></p>
        <p><span className="text-purple-400">COINS:</span> {user?.coins || 0}</p>
      </div>
    </div>
    <div className="mt-4 relative z-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-purple-400">LEVEL:</span>
        <span className="text-lg font-bold text-white">Lv. {user?.level || 1}</span>
      </div>
      <ProgressBar value={user?.xp || 0} max={userLevelThresholds[user?.level || 1] || 500} />
      <div className="text-right text-xs text-purple-300 mt-1">{user?.xp || 0} / {userLevelThresholds[user?.level || 1] || 500} XP</div>
    </div>
  </motion.div>
);

// 4. Stats Display Section
const StatsDisplay = ({ user, stats }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !user) return;
    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
        chart = echarts.init(chartRef.current, 'dark');
    }
    
    const statValues = stats.map(s => s.level);
    const mx = Math.max(...statValues, 10); // Ensure a minimum max value

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: '#8B5CF6',
        textStyle: { color: '#fff' }
      },
      radar: {
        indicator: stats.map(s => ({ name: s.name, max: mx + 5 })),
        shape: 'polygon',
        center: ['50%', '50%'],
        radius: '75%',
        axisName: {
          color: 'rgba(224, 204, 255, 0.9)',
          fontSize: 12,
          fontFamily: "'Rajdhani', 'Orbitron', monospace",
          textShadowColor: 'rgba(192, 132, 252, 0.5)',
          textShadowBlur: 5,
        },
        splitLine: { lineStyle: { color: 'rgba(170, 130, 255, 0.2)', type: 'dashed' } },
        splitArea: { show: true, areaStyle: { color: ['rgba(139, 92, 246, 0.05)', 'rgba(139, 92, 246, 0.1)'] } },
        axisLine: { lineStyle: { color: 'rgba(170, 130, 255, 0.3)' } },
      },
      series: [{
        name: 'Shadow Monarch Stats',
        type: 'radar',
        data: [{
          value: statValues,
          name: 'Current Levels',
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#C084FC' },
          lineStyle: { color: '#C084FC', width: 3, shadowColor: 'rgba(192, 132, 252, 0.8)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [{
              offset: 0, color: 'rgba(192, 132, 252, 0.5)'
            }, {
              offset: 1, color: 'rgba(139, 92, 246, 0.1)'
            }])
          }
        }],
      }],
    };
    chart.setOption(option);
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [user, stats]);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
      className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_25px_rgba(139,92,246,0.2)] border border-purple-500/30 lg:col-span-2"
    >
      <h2 className="text-xl text-center font-semibold mb-4 border-b border-purple-700/50 pb-2 flex items-center justify-center gap-2"><BarChart2 size={20} /> SHADOW STATS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-center min-h-[250px]">
          <div ref={chartRef} className="w-full h-full"></div>
        </div>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-purple-400">{stat.name}</span>
                <span className="text-sm text-yellow-400">Lv. {stat.level}</span>
              </div>
              <ProgressBar value={stat.value} max={statLevelThresholds[stat.level] || 500} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// 5. Inventory Section (for Skills & Artifacts)
const InventorySection = ({ title, items, icon: Icon, type }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
    className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-[0_0_25px_rgba(139,92,246,0.2)] border border-purple-500/30 relative overflow-hidden"
  >
    <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-3xl"></div>
    <h2 className="text-xl font-semibold mb-4 border-b border-purple-700/50 pb-2 flex items-center gap-2"><Icon size={20} /> {title}</h2>
    <div className="relative">
      <div className="overflow-x-auto pb-4 -mb-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
        <div className="flex gap-4 min-w-max">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item._id || item.name} className="group relative cursor-pointer text-center w-20">
                <div className="w-20 h-20 bg-gray-900/50 rounded-lg flex items-center justify-center border-2 border-transparent group-hover:border-purple-500 transition-all duration-300 shadow-md group-hover:shadow-[0_0_15px_rgba(192,132,252,0.5)]">
                  <img
                    src={`/pic/${type}/${item.icon}`}
                    alt={item.name}
                    className="w-12 h-12"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/48x48/1a1a1a/c084fc?text=${item.name.charAt(0)}`; }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-purple-300 truncate">{item.name}</p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 border border-purple-500/50 p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <p className="font-semibold text-sm text-yellow-400">{item.name}</p>
                  <p className="text-xs text-purple-300 mt-1">{item.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-purple-400/70 text-center w-full">No {title.toLowerCase()} found.</p>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  
    const user = useUserStore((state) => state.user);
   const isLoading=false;
   const error =false;
  // Memoize stats array to prevent re-creation on every render
  const stats = useMemo(() => {
    if (!user?.stats) return []; // Defensive check for stats object
    return [
      { name: "INTELLIGENCE", value: user.stats.intelligence?.value || 0, level: user.stats.intelligence?.level || 1 },
      { name: "STRENGTH", value: user.stats.strength?.value || 0, level: user.stats.strength?.level || 1 },
      { name: "CHARISMA", value: user.stats.charisma?.value || 0, level: user.stats.charisma?.level || 1 },
      { name: "AGILITY", value: user.stats.agility?.value || 0, level: user.stats.agility?.level || 1 },
      { name: "ENDURANCE", value: user.stats.endurance?.value || 0, level: user.stats.endurance?.level || 1 },
    ];
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-purple-300">
          <Loader2 className="w-16 h-16 animate-spin mb-4" />
          <p className="text-2xl tracking-widest">Loading System Data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-400">
          <AlertTriangle className="w-16 h-16 mb-4" />
          <h2 className="text-3xl mb-2">System Error</h2>
          <p className="text-red-400/80">{error.message || "Failed to load hunter data."}</p>
        </div>
      );
    }

    if (user) {
      return (
        <motion.div
          className="grid gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HunterProfile user={user} />
            <StatsDisplay user={user} stats={stats} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventorySection title="SHADOW ARTIFACTS" items={user.equipments || []} icon={Shield} type="arti" />
            <InventorySection title="SHADOW SKILLS" items={user.skills || []} icon={Swords} type="skill" />
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 relative overflow-x-hidden" style={{ fontFamily: "'Rajdhani', 'Orbitron', monospace" }}>
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h1 
            className="text-center text-4xl md:text-5xl font-extrabold mb-8 sm:mb-12 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ textShadow: '0 0 15px rgba(192, 132, 252, 0.4)' }}
          >
            SHADOW MONARCH SYSTEM
          </motion.h1>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoading ? 'loading' : error ? 'error' : 'content'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
   
  );
};

export default Dashboard;
