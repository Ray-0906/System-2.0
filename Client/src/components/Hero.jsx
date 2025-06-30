import React, { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import { useNavigate } from "react-router-dom";
const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const ParticleField = () => (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );

  const GridPattern = () => (
    <div className="absolute inset-0 opacity-10">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#grid)"
          className="text-purple-400"
        />
      </svg>
    </div>
  );

  const FloatingElements = () => (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-20 h-20 border border-purple-500/20 rounded-lg backdrop-blur-sm bg-purple-500/5"
          style={{
            left: `${20 + i * 10}%`,
            top: `${30 + (i % 3) * 20}%`,
            transform: `rotate(${i * 45}deg)`,
            animation: `drift ${8 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-black">
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        @keyframes drift {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(90deg);
          }
          50% {
            transform: translateY(-5px) rotate(180deg);
          }
          75% {
            transform: translateY(-15px) rotate(270deg);
          }
        }
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.8),
              0 0 60px rgba(168, 85, 247, 0.4);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
          -webkit-background-clip: text;
          background-clip: text;
        }
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-button {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-indigo-900/20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)`,
          }}
        />
        <img
          src="/pic/image.png"
          alt="Hero Background"
          className="w-full h-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-transparent" />
      </div>

      {/* Animated Background Elements */}
      <GridPattern />
      <ParticleField />
      <FloatingElements />

      {/* Main Content */}
      <div className="container mx-auto px-6 z-10 flex flex-col lg:flex-row items-center">
        <div
          className={`w-full lg:w-1/2 text-left mb-16 px-4 lg:mb-2 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 my-4 mb-8 glass rounded-full text-sm font-medium text-purple-300 border border-purple-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full  mr-2 animate-pulse" />
            System Status: Online
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight">
            {/* Wrapping block to stabilize height */}
            <div className="relative">
              {/* Invisible placeholder that wraps naturally */}
              <span className="invisible block">Be the Monarch.</span>

              {/* Animated text */}
              <span className="absolute top-0 left-0 w-full text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600">
                <TypeAnimation
                  sequence={[
                    "Rise as a Hunter.",
                    1000,
                    "Be the Monarch.",
                    1000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </span>
            </div>

            {/* Static line */}
            <span className="block mt-2 text-white">
              Level Up Your
              <span className="relative inline-block ml-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Life.
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 blur-lg -z-10 animate-pulse" />
              </span>
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
            Gamify your life with{" "}
            <span className="text-purple-400 font-semibold">
              AI-powered adaptive quests
            </span>{" "}
            that track your growth, streaks, and stats—just like a real RPG.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <button
              onClick={() => {
                navigate("/signup");
              }}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-lg font-medium transition-all duration-300 transform hover:scale-105 glow-button overflow-hidden"
            >
              <span className="relative z-10">Start Your Awakening</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <button
              onClick={() => {
                navigate("/login");
              }}
              className="group px-8 py-4 glass rounded-xl text-lg font-medium transition-all duration-300 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400 relative overflow-hidden"
            >
              <span className="relative z-10">Watch the System</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex space-x-8 text-sm">
            {[
              {
                label: "Active Hunters",
                value: "50K+",
                color: "text-green-400",
              },
              {
                label: "Quests Completed",
                value: "2M+",
                color: "text-blue-400",
              },
              {
                label: "Average Level Up",
                value: "30 Days",
                color: "text-purple-400",
              },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Interactive Demo */}
        <div
          className={`w-full lg:w-1/2 relative transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
          }`}
        >
          <div className="relative">
            {/* Holographic Frame */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl animate-pulse" />

            {/* Main Demo Container */}
            <div className="relative glass rounded-2xl p-8 border border-purple-500/30">
              <img
                src="/pic/demo.png"
                alt="Holographic UI"
                className="w-full h-auto object-contain rounded-lg"
              />

              {/* Floating UI Elements */}
              <div className="absolute top-4 right-4 glass rounded-lg px-3 py-2 text-xs text-green-400 border border-green-500/30">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping" />
                  Level Up!
                </div>
              </div>

              <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs text-blue-400 border border-blue-500/30">
                XP: +250
              </div>
            </div>

            {/* Orbiting Elements */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-purple-400 rounded-full opacity-60"
                style={{
                  animation: `orbit 6s linear infinite`,
                  animationDelay: `${i * 2}s`,
                  transformOrigin: "200px 200px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <div className="flex flex-col items-center glass rounded-full px-6 py-4 border border-purple-500/30">
          <span className="text-sm text-purple-300 mb-2 font-medium">
            Enter the Dungeon
          </span>
          <div className="w-6 h-6 border-2 border-purple-400 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(200px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(200px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
