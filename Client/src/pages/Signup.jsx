import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const Signup = () => {
  const [email, setEmail] = useState('');
 const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

   const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', form);
      navigate('/oauth-success');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google`;
  };

  useEffect(() => {
    const initialParticles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: i
    }));
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          delay: 0
        },
      ]);
      setTimeout(() => setParticles((prev) => prev.slice(1)), 6000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] overflow-hidden text-white">
      {/* Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-cyan-400 opacity-60 animate-[floatAnimation_6s_ease-in-out_infinite]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `translate(${(mousePosition.x - 0.5) * (i + 1) * 0.5}px, ${(mousePosition.y - 0.5) * (i + 1) * 0.5}px)`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Magic Circle */}
      <div className="absolute z-10 top-1/2 left-1/2 rounded-full border-2 border-cyan-400/20 animate-[rotate_20s_linear_infinite]"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, rgba(138,43,226,0.05) 50%, transparent 70%)',
          transform: 'translate(-50%, -50%)'
        }}>
        <div className="absolute top-1/2 left-1/2 rounded-full border border-purple-600/30 animate-[rotateReverse_15s_linear_infinite]"
          style={{
            width: '400px',
            height: '400px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Login Form */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-5">
        <form onSubmit={handleSignup} className="w-full max-w-sm bg-black/80 border border-cyan-400/30 p-8 rounded-2xl shadow-xl space-y-6 backdrop-blur">
          <h2 className="text-3xl font-black text-center text-cyan-400 tracking-wider drop-shadow-md">HUNTER'S GATE</h2>
          <p className="text-sm uppercase text-purple-500 text-center tracking-widest">Shadow Monarch System</p>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <label className="block text-sm font-semibold mb-2 uppercase text-cyan-400 tracking-wider">
                Hunter Name
              </label>
          <input
            type="text"
          placeholder="Username"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-400"
            value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          <label className="block text-sm font-semibold mb-2 uppercase text-cyan-400 tracking-wider">
                Hunter ID
              </label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-400"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
            <label className="block text-sm font-semibold mb-2 uppercase text-cyan-400 tracking-wider">
                Access Code
              </label>

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-400"
            value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button type="submit" className="w-full bg-gradient-to-r from-cyan-400 to-purple-600 hover:opacity-90 py-3 rounded font-semibold uppercase">
            Sign Up
          </button>

          <div className="text-center text-sm text-white/70">
            or
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-purple-600/50 rounded bg-black/60 hover:bg-purple-600/20 flex justify-center items-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign Up with Google
          </button>
           <div className="text-center text-sm text-white/70">
             Hunter?{' '}
            <Link
              to={'/login'}
              className="font-semibold text-cyan-400 hover:text-purple-500 transition-colors duration-300 bg-transparent border-none cursor-pointer hover:drop-shadow-[0_0_10px_rgba(138,43,226,0.5)]"
            >
              Access the Guild
            </Link>
          </div>
        </form>
        
      </div>

      <style>{`
        @keyframes floatAnimation {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
        }
        @keyframes rotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes rotateReverse {
          from {
            transform: translate(-50%, -50%) rotate(360deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Signup;
