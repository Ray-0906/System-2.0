import React, { useState, useEffect, useRef } from "react";

const Features = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [activeCard, setActiveCard] = useState(null);
  const observerRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards(
              (prev) => new Set([...prev, entry.target.dataset.index])
            );
          }
        });
      },
      { threshold: 0.2 }
    );

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const ParticleField = ({ color = "purple" }) => (
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

  const FeatureCard = ({ feature, index, delay }) => {
    const cardRef = useRef();
    const isVisible = visibleCards.has(index.toString());
    const isActive = activeCard === index;

    useEffect(() => {
      if (cardRef.current && observerRef.current) {
        cardRef.current.dataset.index = index;
        observerRef.current.observe(cardRef.current);
      }
    }, [index]);

    return (
      <div
        ref={cardRef}
        className={`group relative transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: `${delay}ms` }}
        onMouseEnter={() => setActiveCard(index)}
        onMouseLeave={() => setActiveCard(null)}
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Card Background with Glass Effect */}
        <div className="relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
              }}
            />
          </div>

          {/* Icon Container */}
          <div className="relative w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-4xl text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
              {feature.icon}
            </div>
            {/* Pulse Ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/50 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-50 transition-all duration-500" />
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
            {feature.title}
          </h3>
          <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
            {feature.description}
          </p>

          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  };

  const AISystemCard = ({ system, index }) => (
    <div className="group relative bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden">
      {/* Animated Corner Accent */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 mr-6 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <div className="text-2xl">{system.icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-3 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
            {system.title}
          </h3>
          <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
            {system.description}
          </p>
        </div>
      </div>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );

  const features = [
    {
      icon: "🧠",
      title: "Adaptive Quests Engine",
      description:
        "AI analyzes your habits, streaks & failures to craft personalized missions daily.",
    },
    {
      icon: "📈",
      title: "RPG Stat Tracking",
      description:
        "Upgrade stats like Strength, Agility, Intelligence with real actions.",
    },
    {
      icon: "👑",
      title: "Rank Ascension Trials",
      description: "Face periodic evaluations to ascend from E-Rank to S-Rank.",
    },
    {
      icon: "🎯",
      title: "Skill & Artifact Unlocks",
      description:
        "Earn powerful passive boosts and skills through consistent mastery.",
    },
    {
      icon: "🏆",
      title: "Achievements & Titles",
      description:
        "Unlock rare titles and cosmetic flair for your accomplishments.",
    },
    {
      icon: "👥",
      title: "Community Challenges",
      description:
        "Compete with other hunters in global events and seasonal competitions.",
    },
  ];

  const aiSystems = [
    {
      icon: "✅",
      title: "Adaptive Quest Generator",
      description:
        "Tracks your daily progress and streaks, then levels up your quests automatically based on your pace and consistency.",
    },
    {
      icon: "🧠",
      title: "AI Rank Ascension Judge",
      description:
        "Analyzes your stat levels, completed missions, penalties, and success rate to simulate a real ascension trial — just like a Hunter Exam.",
    },
    {
      icon: "🧩",
      title: "Personalized Missions",
      description:
        "Combines NLP + context of your past quests to create completely personalized, gamified life tasks.",
    },
  ];

  const techStack = [
    { icon: "💾", name: "MERN Stack" },
    { icon: "⚡", name: "Zustand State" },
    { icon: "🔗", name: "GraphQL + Apollo" },
    { icon: "🤖", name: "OpenAI Integration" },
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
          }
        }
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
          }
        }
        @keyframes data-flow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      {/* Feature Showcase Section */}
      <div className="py-32 bg-black relative overflow-hidden">
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

        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-purple-500/10 backdrop-blur-sm rounded-full text-purple-300 border border-purple-500/30">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse" />
              System Features
            </div>

            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                Welcome to the
              </span>
              <br />
              <span className="text-white">AI System</span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Crafted with adaptive intelligence to track, challenge, and evolve
              your every action.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                index={index}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI System Section */}
      <div className="py-32 bg-grey-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-purple-950/10" />
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)`,
            }}
          />
        </div>

        <ParticleField color="purple" />

        <div className="container mx-auto px-6   relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-blue-500/10 backdrop-blur-sm rounded-full text-blue-300 border border-blue-500/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse" />
              AI Intelligence
            </div>

            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Not Just Smart —</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                AI Smart
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Every quest, stat update, and rank trial is judged by an
              intelligent system inspired by the Solo Leveling world.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* AI Systems List */}
            <div className="space-y-8">
              {aiSystems.map((system, index) => (
                <AISystemCard key={index} system={system} index={index} />
              ))}
            </div>

            {/* Interactive Demo Visualization */}
            <div className="relative">
              {/* Main Visualization Container */}
              <div className="relative bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 overflow-hidden">
                {/* Animated Background Grid */}
                <div className="absolute inset-0 opacity-10">
                  <svg
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="ai-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#ai-grid)"
                      className="text-blue-400"
                    />
                  </svg>
                </div>

                {/* Central AI Core */}
                <div className="relative h-80 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 flex items-center justify-center animate-pulse">
                    <div className="text-6xl">🤖</div>
                  </div>

                  {/* Orbiting Data Points */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-8 h-8 bg-blue-400/60 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        animation: `orbit 8s linear infinite`,
                        animationDelay: `${i * 1.3}s`,
                        transformOrigin: "0 0",
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) rotate(${
                          i * 60
                        }deg) translateX(120px) rotate(-${i * 60}deg)`,
                      }}
                    >
                      {["AI", "ML", "NLP", "RPG", "UX", "API"][i]}
                    </div>
                  ))}
                </div>

                {/* Tech Stack Display */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-6 text-center text-blue-400">
                    Behind the Scenes:
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {techStack.map((tech, index) => (
                      <div
                        key={index}
                        className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 flex items-center border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:bg-blue-500/10"
                      >
                        <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-300">
                          {tech.icon}
                        </span>
                        <span className="font-medium text-gray-300 group-hover:text-blue-300 transition-colors duration-300">
                          {tech.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Flow Animation */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30">
                  <div
                    className="w-full h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse"
                    style={{
                      animation: "data-flow 3s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>

              {/* Floating Status Indicators */}
              <div className="absolute -top-4 -right-4 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-green-500/30">
                <div className="flex items-center text-green-400 text-sm font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping" />
                  AI Online
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-500/30">
                <div className="flex items-center text-blue-400 text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                  Processing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translateX(120px)
              rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translateX(120px)
              rotate(-360deg);
          }
        }
      `}</style>
    </>
  );
};

export default Features;
