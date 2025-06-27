import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useUserStore } from "../store/userStore";
import { statLevelThresholds, userLevelThresholds } from "../utils/levelling";
import SoloLoading from "../components/Loading";
import { useLoadUser } from "../utils/userLoader";
import AuthLayout from "../components/AuthLayout";

const Dashboard = () => {
  
 
  const user = useUserStore((state) => state.user);

  const chartRef = useRef(null);
 // 1. Check for error first!
 



  const getLevelProgress = (value, level) => {
    const total = statLevelThresholds[level] || 500;
    return (value / total) * 100;
  };

  useEffect(() => {
    if (chartRef.current && user) {
      const newChart = echarts.init(chartRef.current);
      const statValues = [
        user.stats.intelligence.level,
        user.stats.strength.level,
        user.stats.charisma.level,
        user.stats.agility.level,
        user.stats.endurance.level,
      ];
      const mx = Math.max(...statValues);
      const option = {
        animation: true,
        radar: {
          indicator: [
            { name: "INTELLIGENCE", max: mx + 10 },
            { name: "STRENGTH", max: mx + 10 },
            { name: "CHARISMA", max: mx + 10 },
            { name: "AGILITY", max: mx + 10 },
            { name: "ENDURANCE", max: mx + 10 },
          ],
          shape: "polygon",
          splitNumber: 5,
          axisName: {
            color: "rgba(170, 130, 255, 0.9)",
            fontSize: 12,
            fontFamily: "Arial, sans-serif",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: [3, 5],
          },
          splitLine: {
            lineStyle: {
              color: "rgba(170, 130, 255, 0.3)",
              type: "dashed",
            },
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ["rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)"],
            },
          },
          axisLine: {
            lineStyle: {
              color: "rgba(170, 130, 255, 0.5)",
              width: 2,
            },
          },
        },
        series: [
          {
            name: "Shadow Monarch Stats",
            type: "radar",
            data: [
              {
                value: statValues,
                lineStyle: {
                  color: "#8B5CF6",
                  width: 2,
                  shadowColor: "rgba(139, 92, 246, 0.5)",
                  shadowBlur: 10,
                },
                areaStyle: {
                  color: "rgba(139, 92, 246, 0.3)",
                  shadowColor: "rgba(139, 92, 246, 0.5)",
                  shadowBlur: 15,
                },
                symbol: "circle",
                symbolSize: 6,
                itemStyle: {
                  color: "#8B5CF6",
                },
              },
            ],
          },
        ],
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      };
      newChart.setOption(option);
      const handleResize = () => newChart.resize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        newChart.dispose();
      };
    }
  }, [user]);

  const stats = [
    {
      name: "INTELLIGENCE",
      value: user?.stats?.intelligence?.value || 0,
      level: user?.stats?.intelligence?.level || 1,
    },
    {
      name: "STRENGTH",
      value: user?.stats?.strength?.value || 0,
      level: user?.stats?.strength?.level || 1,
    },
    {
      name: "CHARISMA",
      value: user?.stats?.charisma?.value || 0,
      level: user?.stats?.charisma?.level || 1,
    },
    {
      name: "AGILITY",
      value: user?.stats?.agility?.value || 0,
      level: user?.stats?.agility?.level || 1,
    },
    {
      name: "ENDURANCE",
      value: user?.stats?.endurance?.value || 0,
      level: user?.stats?.endurance?.level || 1,
    },
  ];

  const skills = user?.skills || [];
  const artifacts = user?.equipments || user?.equiments || [];

  return (
    <><AuthLayout>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white font-mono p-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center text-5xl font-extrabold mb-10 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 animate-pulse">
          SHADOW MONARCH SYSTEM
        </h1>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hunter ID Card */}
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-2 border-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
              <h2 className="text-xl text-center font-semibold mb-4 border-b border-purple-700 pb-2 relative z-10">
                HUNTER ID
              </h2>
              <div className="flex flex-col items-center mb-6 relative z-10">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.7)] mb-4 transform hover:scale-105 transition-transform">
                  <img
                    src="https://readdy.ai/api/search-image?query=Anime%20style%20portrait%20of%20a%20mysterious%20hunter%20with%20dark%20green%20hair%20and%20intense%20eyes%2C%20looking%20directly%20at%20viewer%20with%20a%20serious%20expression%2C%20dark%20atmospheric%20background%20with%20subtle%20shadows%2C%20high%20quality%20digital%20art&width=300&height=300&seq=1&orientation=squarish"
                    alt="Shadow Monarch Avatar"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="text-center relative z-10">
                  <p className="mb-1">
                    <span className="text-purple-400">IDENT - </span>
                    {user?.username || "Unknown"}
                  </p>
                  <p className="mb-1">
                    <span className="text-purple-400">Title - </span>
                    <span className="text-yellow-400">
                      {user?.titles?.[0] || "Shadow Soldier"}
                    </span>
                  </p>
                  <p className="mb-1">
                    <span className="text-purple-400">Hunter Rank - </span>
                    <span className="text-yellow-400 font-bold">
                      {user?.rank || "E"}
                    </span>
                  </p>
                  <p className="mb-1">
                    <span className="text-purple-400">Hunter Level - </span>
                    {user?.level || 1}
                  </p>
                  <p className="mb-1">
                    <span className="text-purple-400">Coins - </span>
                    {user?.coins || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-400">XP:</span>
                  <span className="text-lg font-bold">
                    Lv. {user?.level || 1}
                  </span>
                  <span className="text-xs text-purple-300">
                    {user?.xp || 0}/{userLevelThresholds[user?.level] || 500}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full shadow-[0_0_5px_rgba(139,92,246,0.7)]"
                    style={{
                      width: `${
                        ((user?.xp || 0) /
                          (userLevelThresholds[user?.level] || 500)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            {/* Stats Section */}
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-2 border-purple-900 lg:col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
              <h2 className="text-xl text-center font-semibold mb-8 border-b border-purple-700 pb-2 relative z-10">
                SHADOW STATS
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                <div className="flex items-center justify-center">
                  <div ref={chartRef} className="w-full h-64"></div>
                </div>
                <div className="space-y-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-400">{stat.name}</span>
                        <span className="text-sm text-yellow-400">
                          Lv. {stat.level}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full shadow-[0_0_5px_rgba(139,92,246,0.7)]"
                          style={{
                            width: `${getLevelProgress(
                              stat.value,
                              stat.level
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Artifacts Section */}
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-2 border-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
              <h2 className="text-xl font-semibold mb-4 border-b border-purple-700 pb-2 relative z-10">
                SHADOW ARTIFACTS
              </h2>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-6 min-w-max px-6 relative z-10">
                    {artifacts.length > 0 ? (
                      artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className="group relative cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.3)] hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <img
                              src={artifact.icon}
                              alt={artifact.name}
                              className="w-10 h-10 text-purple-500 animate-pulse"
                            />
                          </div>
                          <p className="mt-2 text-center text-sm text-yellow-400">
                            {artifact.name}
                          </p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <p className="font-semibold text-sm text-yellow-400">
                              {artifact.name}
                            </p>
                            <p className="text-xs text-purple-300 mt-1">
                              {artifact.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-purple-300 text-center">
                        No artifacts equipped
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Skills Section */}
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-2 border-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
              <h2 className="text-xl font-semibold mb-4 border-b border-purple-700 pb-2 relative z-10">
                SHADOW SKILLS
              </h2>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-6 min-w-max px-6 relative z-10">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <div
                          key={skill.id}
                          className="group relative cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.3)] hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <img
                              src={skill.icon}
                              alt={skill.name}
                              className="w-10 h-10 text-purple-500 animate-pulse"
                            />
                          </div>
                          <p className="mt-2 text-center text-sm text-yellow-400">
                            {skill.name}
                          </p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <p className="font-semibold text-sm text-yellow-400">
                              {skill.name}
                            </p>
                            <p className="text-xs text-purple-300 mt-1">
                              {skill.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-purple-300 text-center">
                        No Skills Unlocked
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></AuthLayout></>
  );
};

export default Dashboard;