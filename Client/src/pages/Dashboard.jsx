import React, { useEffect, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, User, BarChart2, Shield, Swords, Pencil } from 'lucide-react';
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
const ProgressBar = ({ value, max, color = 'bg-purple-500' }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-900/80 rounded-full h-2.5 overflow-hidden border border-purple-500/20 shadow-inner my-1">
      <motion.div
        className={`bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 h-full rounded-full relative`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Animated shimmer effect on the bar */}
        <div className="absolute top-0 inset-x-0 h-full bg-white/20 animate-pulse" />
      </motion.div>
    </div>
  );
};

// 3. Hunter Profile Card
const HunterProfile = ({ user, onEdit }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
    className="w-full h-full bg-black/40 backdrop-blur-md rounded-xl p-4 md:p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
  >
    <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <h2 className="text-xl text-center font-bold tracking-wider mb-4 border-b border-purple-500/30 pb-2 flex items-center justify-center gap-2 relative bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 shrink-0" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
      <User size={20} className="text-purple-400" /> HUNTER ID
      <button onClick={onEdit} className="absolute right-0 top-0 text-purple-300 hover:text-pink-400 hover:scale-110 transition-all" title="Edit Profile">
        <Pencil size={18} />
      </button>
    </h2>
    
      <div className="flex flex-col items-center mb-6 relative z-10 flex-grow justify-center">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[3px] border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-105 hover:border-pink-500 transition-all duration-300 mb-6 relative group">
        <img
          src={user?.avatar || "https://readdy.ai/api/search-image?query=Anime%20style%20portrait%20of%20a%20mysterious%20hunter%20with%20dark%20green%20hair%20and%20intense%20eyes%2C%20looking%20directly%20at%20viewer%20with%20a%20serious%20expression%2C%20dark%20atmospheric%20background%20with%20subtle%20shadows%2C%20high%20quality%20digital%20art&width=300&height=300&seq=1&orientation=squarish"}
          alt="Hunter Avatar"
          className="w-full h-full object-cover object-top"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x300/1a1a1a/c084fc?text=Hunter'; }}
        />
        <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full mix-blend-screen" />
      </div>
      
<div className="w-full max-w-[280px] space-y-2 text-sm">     
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-purple-500/20">
          <span className="text-purple-400/80 text-xs font-semibold tracking-widest">IDENT:</span>
          <span className="text-purple-100 font-medium truncate ml-2">{user?.username || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-purple-500/20">
          <span className="text-purple-400/80 text-xs font-semibold tracking-widest">TITLE:</span>
          <span className="text-amber-300 font-medium truncate ml-2">{user?.activeTitle || user?.titles?.[0] || "Shadow"}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-purple-500/20">
          <span className="text-purple-400/80 text-xs font-semibold tracking-widest">RANK:</span>
          <span className="text-pink-400 font-bold text-base drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">{user?.rank || 'E'}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-purple-500/20">
          <span className="text-purple-400/80 text-xs font-semibold tracking-widest">COINS:</span>
          <span className="text-yellow-400 font-medium">{Number(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <div className="mt-auto relative z-10 pt-4 w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-purple-400 font-bold tracking-widest text-sm" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>PLAYER LEVEL</span>
        <span className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
          Lv. {user?.level || 1}
        </span>
      </div>
      <ProgressBar value={user?.xp || 0} max={userLevelThresholds[user?.level || 1] || 500} />
      <div className="text-right text-xs text-purple-300/80 mt-2 font-['Exo_2'] font-medium">
        {Number(user?.xp || 0).toLocaleString()} / {Number(userLevelThresholds[user?.level || 1] || 500).toLocaleString()} XP
      </div>
    </div>
  </motion.div>
);

// 4. Stats Display Section
const StatsDisplay = ({ user, stats }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chart; let echartsLocal;
    let disposed = false;
    const init = async () => {
      if (!chartRef.current || !user || !stats || !stats.length) return;
      const mod = await import(/* webpackChunkName: "echarts" */'echarts');
      echartsLocal = mod;
      if (disposed) return;
      chart = echartsLocal.getInstanceByDom(chartRef.current) || echartsLocal.init(chartRef.current, 'dark');
      const statValues = stats.map(s => s.level);
      const mx = Math.max(...statValues, 10);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', backgroundColor: 'rgba(0,0,0,0.85)', borderColor: '#a855f7', borderWidth: 1, textStyle:{ color:'#e2e8f0'} },
        radar: {
          indicator: stats.map(s => ({ name: s.name.substring(0,3), max: mx + 5 })),
          shape: 'polygon', center:['50%','50%'], radius:'65%',
          axisName:{ color:'rgba(224,204,255,0.9)', fontSize:10, fontFamily:"'Rajdhani', 'Orbitron', monospace", fontWeight: 600, textShadowColor:'rgba(168,85,247,0.7)', textShadowBlur:8 },
          splitLine:{ lineStyle:{ color:'rgba(168,85,247,0.2)', type:'solid'}},
          splitArea:{ show:true, areaStyle:{ color:['rgba(0,0,0,0)','rgba(168,85,247,0.03)']}},
          axisLine:{ lineStyle:{ color:'rgba(168,85,247,0.4)'} }
        },
        series:[{ type:'radar', data:[{ value: statValues, name:'Level Stats', symbol:'circle', symbolSize:6,
          itemStyle:{ color:'#ec4899'}, lineStyle:{ color:'#a855f7', width:2, shadowColor:'rgba(236,72,153,0.5)', shadowBlur:8 },
          areaStyle:{ color: new echartsLocal.graphic.RadialGradient(0.5,0.5,0.5,[{offset:0,color:'rgba(236,72,153,0.4)'},{offset:1,color:'rgba(168,85,247,0.1)'}]) }
        }]}]
      });
      const resize = () => chart && chart.resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    };
    init();
    return () => { disposed = true; if (chart) { chart.dispose(); } };
  }, [user, stats]);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
      className="w-full h-full bg-black/40 backdrop-blur-md rounded-xl p-4 md:p-6 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:border-purple-500/50 transition-all duration-300 lg:col-span-2 relative overflow-hidden flex flex-col justify-between group/card"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none group-hover/card:from-purple-900/20 transition-all duration-500" />
      <h2 className="text-2xl text-center font-bold tracking-wider mb-4 border-b border-purple-500/30 pb-3 flex items-center justify-center gap-3 relative bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
        <BarChart2 size={24} className="text-purple-400" /> SHADOW STATS
      </h2>
      <div className="flex flex-col lg:flex-row items-center w-full gap-6 flex-grow py-4">
        <div className="flex justify-center h-full min-h-[300px] w-full lg:w-[45%] relative group max-w-md mx-auto">
          <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-500 pointer-events-none" />
          <div ref={chartRef} className="w-[120%] h-[120%] -ml-[10%] -mt-[10%] relative z-10"></div>
        </div>
        <div className="flex flex-col justify-center space-y-4 px-4 w-full lg:w-[55%]">
          {stats.map((stat) => {
            const maxVal = statLevelThresholds[stat.level] || 0;
            return (
              <div key={stat.name} className="relative z-10 w-full mb-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-purple-300 font-semibold tracking-wider text-sm drop-shadow truncate" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                    {stat.name}
                  </span>
                  <span className="text-sm font-bold text-amber-300 ml-2" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                    Lv.{stat.level}
                  </span>
                </div>
                <ProgressBar value={stat.value} max={maxVal} color="bg-purple-500" />
                <div className="flex justify-end items-center mt-1.5">
                  <span className="text-xs text-purple-300/70 font-medium font-['Exo_2']">
                    {Number(stat.value).toLocaleString()} <span className="text-purple-400/50">/</span> {Number(maxVal).toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// 5. Inventory Section (for Skills & Artifacts)
const InventorySection = ({ title, items, icon: Icon, type }) => {
  // Filter out unpopulated items (raw ObjectIds from login response)
  const populated = (items || []).filter((item) => item && typeof item === 'object' && item.icon);

  return (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
    className="bg-black/40 backdrop-blur-md rounded-xl p-4 md:p-5 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[300px]"
  >
    <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <h2 className="text-xl font-bold tracking-wider mb-3 border-b border-purple-500/30 pb-2 flex items-center gap-3 relative bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
      <Icon size={20} className="text-purple-400" /> {title}
    </h2>
    <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0">
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-900/50 hover:scrollbar-thumb-pink-500/60 transition-colors">
        <div className="flex gap-4 min-w-max px-1">
          {populated.length > 0 ? (
            populated.map((item) => (
              <div key={item._id || item.name} className="group relative cursor-pointer text-center w-24">
                <div className="w-24 h-24 bg-gray-950/80 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:border-pink-500 transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transform group-hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={`/pic/${type}/${item.icon}`}
                    alt={item.name || '?'}
                    className="w-14 h-14 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/56x56/1a1a1a/c084fc?text=${(item.name || '?').charAt(0)}`; }}
                  />
                </div>
                <p className="mt-3 text-center text-xs font-semibold text-purple-200 truncate px-1 transition-colors group-hover:text-pink-300" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                  {item.name}
                </p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-56 bg-gray-950/95 border border-pink-500/50 p-4 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 translate-y-2 group-hover:translate-y-0 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl pointer-events-none" />
                  <p className="font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 mb-1" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                    {item.name}
                  </p>
                  <p className="text-xs text-purple-200/90 leading-relaxed font-['Exo_2']">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-8 opacity-50">
              <Icon size={32} className="text-purple-500 mb-2" />
              <p className="text-purple-400 font-medium tracking-widest text-sm" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
                NO {title.toUpperCase()} ACQUIRED
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
};

// --- Main Dashboard Component ---

const Dashboard = () => {
  
    const user = useUserStore((state) => state.user);
    const setUser = useUserStore(s=>s.setUser);
    const updateCoin = useUserStore(s=>s.updateCoin);
    const [editing,setEditing]=useState(false);
    const [availableTitles,setAvailableTitles]=useState([]);
    const [pendingTitle,setPendingTitle]=useState('');
    const [uploading,setUploading]=useState(false);
    const [tempAvatar,setTempAvatar]=useState('');

    const openEdit=async()=>{
      setEditing(true);
      try{
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/titles`,{ credentials:'include'});
        const data = await res.json();
        setAvailableTitles(data.titles||[]);
        setPendingTitle(user?.activeTitle || user?.titles?.[0] || '');
      }catch(e){/* ignore */}
    };

    const handleUpload = async (file)=>{
      setUploading(true);
      try{
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET || 'unsigned');
        const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
        const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`,{ method:'POST', body: form });
        const json = await resp.json();
        if(json.secure_url){
          setTempAvatar(json.secure_url);
        }
      }catch(err){ console.error('Upload failed', err); }
      finally{ setUploading(false);} }

  const saveProfile = async()=>{
      try{
        const body = { activeTitle: pendingTitle };
        if(tempAvatar) body.avatar = tempAvatar;
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/user/profile`,{ method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
        const out = await res.json();
        if(out.user){
          setUser({ ...user, ...out.user });
          setEditing(false);
        }
      }catch(e){ console.error(e);} }
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
          className="w-full flex flex-col gap-4 max-w-[1300px] h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4 pb-8 flex-1">
            <div className="lg:col-span-4 min-h-[450px]">
              <HunterProfile user={user} onEdit={openEdit} />
            </div>
            <div className="lg:col-span-8 min-h-[450px]">
              <StatsDisplay user={user} stats={stats} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 flex-1">
            <InventorySection title="SHADOW ARTIFACTS" items={user?.equiments || []} icon={Shield} type="arti" />
            <InventorySection title="SHADOW SKILLS" items={user?.skills || []} icon={Swords} type="skill" />
          </div>
          {editing && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-lg bg-gray-950/90 border border-purple-500/40 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-purple-200 tracking-wide">Edit Hunter Profile</h3>
                  <button onClick={()=>setEditing(false)} className="text-purple-400 hover:text-white">✕</button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-purple-400 mb-1">Active Title</p>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {availableTitles.map(t=> (
                      <button key={t.name} onClick={()=>t.unlocked && setPendingTitle(t.name)} className={`w-full text-left px-3 py-2 rounded-md text-sm border ${pendingTitle===t.name? 'border-pink-500 bg-pink-500/10':'border-purple-500/20'} ${t.unlocked? 'hover:border-pink-400':'opacity-40 cursor-not-allowed'}`}> 
                        <span className="text-purple-200">{t.name}</span>
                        <span className="text-[10px] ml-2 text-purple-400">Tier {t.tier}</span>
                        {!t.unlocked && <span className="text-[10px] ml-2 text-yellow-400">LOCKED</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-purple-400 mb-1">Profile Image</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500">
                      <img src={tempAvatar || user?.avatar || 'https://placehold.co/100x100/1a1a1a/c084fc?text=H'} className="w-full h-full object-cover" />
                    </div>
                    <label className="text-xs bg-gradient-to-r from-purple-600 to-pink-500 px-3 py-2 rounded-md cursor-pointer hover:from-purple-500 hover:to-pink-400 text-white shadow">
                      {uploading? 'Uploading...' : 'Upload Image'}
                      <input type="file" className="hidden" accept="image/*" onChange={e=> e.target.files && handleUpload(e.target.files[0])} />
                    </label>
                  </div>
                  <p className="text-[10px] mt-1 text-purple-400">Uses Cloudinary unsigned upload preset.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={()=>setEditing(false)} className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white">Cancel</button>
                  <button onClick={saveProfile} disabled={uploading} className="px-5 py-2 text-sm rounded-md bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white disabled:opacity-50">Save</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <AuthLayout>
      <div 
        className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 font-['Exo_2'] selection:bg-[#a855f7]/30 selection:text-white relative overflow-hidden pb-20 pt-6 md:pt-10"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 animate-pulse"
          style={{
            background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.15), transparent 80%)'
          }}
        />
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:60px_60px] pointer-events-none z-0" />
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto w-full relative z-10 p-4 sm:p-6 lg:px-8 flex flex-col h-full min-h-screen overflow-y-auto overflow-x-hidden">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
            className="flex items-center justify-center mb-4 gap-4 mt-2 w-full max-w-[1200px] shrink-0"
          >
            <div className="flex-1 max-w-[150px] h-[1px] bg-gradient-to-r from-transparent to-purple-500/50 hidden md:block" />
            <h1 
              className="text-center text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif", letterSpacing: '0.15em' }}
            >
              SHADOW MONARCH SYSTEM
            </h1>
            <div className="flex-1 max-w-[150px] h-[1px] bg-gradient-to-l from-transparent to-purple-500/50 hidden md:block" />
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoading ? 'loading' : error ? 'error' : 'content'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center flex-1 min-h-0"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Dashboard;
