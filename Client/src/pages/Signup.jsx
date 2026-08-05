import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "../utils/axios";
import SoloLoading from "../components/Loading";
import { useGoogleLogin } from '@react-oauth/google';
import { useUserStore } from '../store/userStore';
import { Swords, UserPlus, AlertCircle, Trophy, Brain, Flame, Shield } from 'lucide-react';

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must contain uppercase, lowercase, and a number"
    )
    .required("Password is required"),
});

const RANKS = [
  { rank: "E", label: "Novice", color: "text-gray-400" },
  { rank: "D", label: "Trained", color: "text-green-400" },
  { rank: "C", label: "Skilled", color: "text-blue-400" },
  { rank: "B", label: "Veteran", color: "text-purple-400" },
  { rank: "A", label: "Elite", color: "text-orange-400" },
  { rank: "S", label: "Shadow Monarch", color: "text-red-400" },
];

const Signup = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/auth/register", data, { timeout: 10000 });
      const { user } = response.data;
      if (user) {
        useUserStore.getState().setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
      useUserStore.getState().triggerRefetch();
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.message === "timeout of 10000ms exceeded"
          ? "Request timed out. Please try again."
          : "An unexpected error occurred. Please try again later.");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.post('/auth/google', { credential: tokenResponse.access_token });
        if (data.user) {
          useUserStore.getState().setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        useUserStore.getState().triggerRefetch();
        navigate('/dashboard');
      } catch (err) {
        setError('Google signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google signup was cancelled.'),
  });

  const fields = [
    { id: "username", label: "HUNTER NAME", type: "text", placeholder: "Choose your identity", key: "username" },
    { id: "email", label: "HUNTER ID", type: "email", placeholder: "email@example.com", key: "email" },
    { id: "password", label: "ACCESS CODE", type: "password", placeholder: "••••••••", key: "password" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white font-['Exo_2'] overflow-hidden">
      <SoloLoading loading={loading} message="Initializing..." />

      {!loading && (
        <div className="flex min-h-screen">

          {/* ───── LEFT: Hero Panel ───── */}
          <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
            {/* Hero Image */}
            <img
              src="/images/hero-signup.jpg"
              alt="Hunter awakening with purple energy"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
            <div className="absolute inset-0 bg-[#a855f7]/[0.03]" />

            {/* Content overlay */}
            <div className="relative z-10 flex flex-col justify-between p-12 w-full">
              {/* Top — Brand */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#a855f7] flex items-center justify-center"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-black tracking-[0.15em]">SYSTEM 2.0</span>
                </div>
              </div>

              {/* Center — Tagline */}
              <div className="max-w-lg">
                <p className="text-[10px] font-black tracking-[0.5em] text-[#a855f7] font-['Rajdhani'] mb-4">
                  BEGIN YOUR JOURNEY
                </p>
                <h1 className="text-5xl xl:text-6xl font-black italic leading-[1.1] tracking-wide mb-6">
                  EVERY LEGEND
                  <br />
                  <span className="text-[#a855f7] drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">STARTS AT E-RANK.</span>
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                  Start as a Novice Hunter. Complete quests, build discipline, and climb through 
                  the ranks. Your awakening begins now.
                </p>

                {/* Rank progression preview */}
                <div className="mt-8 flex items-center gap-2">
                  {RANKS.map(({ rank, label, color }, i) => (
                    <div key={rank} className="flex items-center gap-2">
                      <div className={`flex flex-col items-center ${i === 0 ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-9 h-9 border flex items-center justify-center text-xs font-black font-['Rajdhani'] ${
                          i === 0 ? 'border-[#a855f7]/50 bg-[#a855f7]/10 text-[#a855f7]' : 'border-gray-700/50 bg-gray-900/50 text-gray-500'
                        }`}>
                          {rank}
                        </div>
                        <span className={`text-[8px] font-['Rajdhani'] font-bold tracking-wider mt-1 ${i === 0 ? color : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </div>
                      {i < RANKS.length - 1 && (
                        <div className="w-3 h-px bg-gray-700/50 mb-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom — Stats teaser */}
              <div className="flex gap-8">
                {[
                  { icon: Trophy, label: "5 Stats", sub: "to master" },
                  { icon: Flame, label: "Streaks", sub: "build power" },
                  { icon: Brain, label: "AI Coach", sub: "guides you" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#a855f7]/60" />
                    <div>
                      <p className="text-xs font-bold text-gray-300">{label}</p>
                      <p className="text-[9px] text-gray-600 font-['Rajdhani'] tracking-wider">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ───── RIGHT: Form Panel ───── */}
          <div className="w-full lg:w-[45%] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[#030305]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Mobile brand header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-[#a855f7] flex items-center justify-center"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-black tracking-[0.15em]">SYSTEM 2.0</span>
            </div>

            <div className="relative z-10 w-full max-w-[380px] px-6 py-12">
              {/* Form header */}
              <div className="mb-8">
                <h2 className="text-2xl font-black italic tracking-wider mb-1">
                  BEGIN AWAKENING
                </h2>
                <p className="text-[10px] font-black tracking-[0.3em] text-[#a855f7] font-['Rajdhani']">
                  PLAYER REGISTRATION PROTOCOL
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Signup form" className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-['Rajdhani'] font-bold tracking-wider">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {fields.map(({ id, label, type, placeholder, key }) => (
                  <div key={id} className="space-y-2">
                    <label htmlFor={id} className="block text-[10px] font-black text-gray-500 font-['Rajdhani'] tracking-[0.2em]">
                      {label}
                    </label>
                    <input
                      id={id}
                      type={type}
                      placeholder={placeholder}
                      className={`w-full h-12 px-4 bg-[#080a0e] border text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#a855f7]/50 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.15)] transition-all duration-200 ${
                        errors[key] ? "border-red-500/50" : "border-[#1a1d27]"
                      }`}
                      {...register(key)}
                      aria-invalid={errors[key] ? "true" : "false"}
                      aria-describedby={errors[key] ? `${id}-error` : undefined}
                    />
                    {errors[key] && (
                      <p id={`${id}-error`} className="text-red-400 text-[10px] font-['Rajdhani'] font-bold tracking-wider">
                        {errors[key].message}
                      </p>
                    )}
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-1 bg-[#a855f7] hover:bg-[#9333ea] disabled:bg-[#1e2330] disabled:text-gray-600 disabled:cursor-not-allowed text-white text-xs font-black font-['Rajdhani'] tracking-[0.3em] transition-all duration-200 hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] relative overflow-hidden group"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_ease-in-out] pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    AWAKEN NOW
                  </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 py-1">
                  <div className="flex-1 h-px bg-[#1a1d27]" />
                  <span className="text-[9px] font-black text-gray-700 font-['Rajdhani'] tracking-[0.3em]">OR</span>
                  <div className="flex-1 h-px bg-[#1a1d27]" />
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-12 border border-[#1a1d27] bg-[#080a0e] hover:border-[#a855f7]/25 hover:bg-[#0d0f14] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all duration-200 text-xs font-semibold text-gray-400 tracking-wider"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign Up with Google
                </button>
              </form>

              {/* Footer */}
              <div className="text-center mt-8">
                <span className="text-[10px] text-gray-600 font-['Rajdhani'] tracking-[0.15em] font-bold">
                  ALREADY AWAKENED?{" "}
                  <Link to="/login" className="text-[#a855f7] hover:text-[#c084fc] transition-colors">
                    ACCESS SYSTEM →
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Signup;