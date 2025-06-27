import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const CtaFooter = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleElements, setVisibleElements] = useState(new Set());
  const observerRef = useRef();
 const navigate=useNavigate();
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

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(
              (prev) => new Set([...prev, entry.target.dataset.index])
            );
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section, index) => {
      section.dataset.index = index;
      observerRef.current.observe(section);
    });
    return () => {
      sections.forEach((section) => observerRef.current.unobserve(section));
    };
  }, []);

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

      {/* CTA Section */}
      <div className="py-32 bg-black relative overflow-hidden">
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
          <div className="max-w-4xl mx-auto text-center animate-on-scroll" data-index="0">
            <div className="inline-flex items-center px-6 py-3 mb-8 bg-purple-500/10 backdrop-blur-sm rounded-full text-purple-300 border border-purple-500/30">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse" />
              Call to Action
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                Your Journey Begins Now
              </span>
              <span className="block mt-2 text-white">
                Will You Rise... or Stay Ordinary?
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-12">
              <button onClick={()=>{navigate('/signup')}} className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 card-3d">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Start Your Awakening</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              </button>
              <button onClick={()=>{navigate('/dashboard')}}  className="group relative px-10 py-5 bg-transparent border border-purple-500/50 rounded-xl text-xl font-medium transition-all duration-300 hover:bg-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 card-3d">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Preview the Dashboard</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mt-24 animate-on-scroll" data-index="1">
            <h3 className="text-2xl font-bold mb-10 flex items-center justify-center text-white group">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 mr-4 group-hover:scale-110 transition-transform duration-300 pulse-ring">
                <i className="fas fa-users text-xl"></i>
              </span>
              <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                Hunter Testimonials
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Alex Chen',
                  level: 'Level 14 | Rank C | Focus Mage',
                  quote: 'This system turned my routines into an adventure. Every quest feels personal and tailored to my goals.',
                  color: 'purple',
                },
                {
                  name: 'Sarah Johnson',
                  level: 'Level 22 | Rank B | Agile Tactician',
                  quote: 'Finally, a productivity tool that feels like a game. I’ve accomplished more in 3 months than in the past year.',
                  color: 'blue',
                },
                {
                  name: 'Michael Torres',
                  level: 'Level 31 | Rank A | Endurance Knight',
                  quote: 'The way this system adapts to my habits is incredible. It’s like having a personal trainer, life coach, and RPG all in one.',
                  color: 'green',
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className={`group relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-${testimonial.color}-500/50 transition-all duration-500 card-3d hover:shadow-${testimonial.color}-500/20 overflow-hidden ${visibleElements.has((index + 1).toString()) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-${testimonial.color}-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
                      }}
                    />
                  </div>
                  <div className="relative flex flex-col items-center mb-6">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-${testimonial.color}-500/20 to-indigo-500/20 flex items-center justify-center text-${testimonial.color}-400 mb-4 group-hover:scale-110 transition-transform duration-300 pulse-ring`}>
                      <i className="fas fa-user text-2xl"></i>
                    </div>
                    <div className="text-center">
                      <h4 className={`font-bold text-lg text-${testimonial.color}-400 group-hover:text-${testimonial.color}-300 transition-colors duration-300`}>{testimonial.name}</h4>
                      <div className={`text-sm text-${testimonial.color}-400`}>{testimonial.level}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 italic text-center group-hover:text-gray-200 transition-colors duration-300">{testimonial.quote}</p>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="py-16 bg-purple-900/10 border-t border-gray-800/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-grey-950 to-black" />
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)`,
            }}
          />
        </div>
        <ParticleField color="purple" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-on-scroll" data-index="2">
            {/* Hunter System Info */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                Hunter System
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Gamify your life with AI-powered adaptive quests that track your growth, streaks, and stats—just like a real RPG.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'discord', 'github', 'instagram'].map((platform, index) => (
                  <a
                    key={index}
                    href="#"
                    className="group relative text-gray-400 transition-all duration-300"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <i className={`fab fa-${platform} text-xl group-hover:text-purple-400 transition-colors duration-300 pulse-ring`} />
                  </a>
                ))}
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-6 text-white group">
                <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                  Quick Links
                </span>
              </h4>
              <ul className="space-y-3">
                {['About', 'Features', 'Documentation', 'Community', 'Blog'].map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="group relative text-gray-400 transition-all duration-300"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-sm blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative group-hover:text-purple-400 transition-colors duration-300">{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Demo Quest */}
            <div>
              <h4 className="text-lg font-bold mb-6 text-white group">
                <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
                  Try a Demo Quest
                </span>
              </h4>
              <div className="group relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 card-3d hover:shadow-purple-500/20 overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative mb-4">
                  <button className="group w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-base font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative">
                      <i className="fas fa-dice-d20 mr-2"></i> Roll a Demo Quest
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  </button>
                </div>
                <div className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                  Get a taste of our AI-generated quests tailored to different playstyles and goals.
                </div>
              </div>
              <div className="mt-6 text-sm text-gray-500 text-center">
                Built with <i className="fas fa-heart text-red-500 pulse-ring"></i> by Asraful
                <div className="mt-2">© 2025 Hunter System. All rights reserved.</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default CtaFooter;