import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "../utils/axios";
import SoloLoading from "../components/Loading";

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const PARTICLE_COUNT = 6;
const PARTICLE_SPAWN_INTERVAL = 3000;
const PARTICLE_LIFETIME = 6000;

const Login = () => {
  const particleIdRef = useRef(0);
  const [error, setError] = useState("");
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const generateParticle = useCallback(() => ({
    id: particleIdRef.current++,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: 0,
  }), []);

  useEffect(() => {
    // Initialize particles
    const initialParticles = Array.from({ length: PARTICLE_COUNT }, generateParticle);
    setParticles(initialParticles);

    // Particle animation
    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev.slice(-PARTICLE_COUNT + 1),
        generateParticle(),
      ]);
    }, PARTICLE_SPAWN_INTERVAL);

    return () => clearInterval(interval);
  }, [generateParticle]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/auth/login", data, {
        timeout: 10000, // Add timeout to prevent hanging
      });
      if (response.data.redirectUrl) {
        navigate(response.data.redirectUrl);
      } else {
        navigate("/oauth-success");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message === "timeout of 10000ms exceeded"
          ? "Request timed out. Please try again."
          : "An unexpected error occurred. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "https://api.example.com";
    window.location.assign(`${serverUrl}/auth/google`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] overflow-hidden text-white">
      {/* Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-cyan-400 opacity-60 animate-[floatAnimation_6s_ease-in-out_infinite]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              transform: `translate(${
                (mousePosition.x - 0.5) * p.size * 0.5
              }px, ${(mousePosition.y - 0.5) * p.size * 0.5}px)`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Magic Circle */}
      <div
        className="absolute z-10 top-1/2 left-1/2 rounded-full border-2 border-cyan-400/20 animate-[rotate_20s_linear_infinite]"
        style={{
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(0,212,255,0.1) 0%, rgba(138,43,226,0.05) 50%, transparent 70%)",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 rounded-full border border-purple-600/30 animate-[rotateReverse_15s_linear_infinite]"
          style={{
            width: "400px",
            height: "400px",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Login Form */}
      <SoloLoading loading={loading} message="Logging in..." />
      {!loading && (
        <div className="relative z-20 flex items-center justify-center min-h-screen p-5">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-sm bg-black/80 border border-cyan-400/30 p-8 rounded-2xl shadow-xl space-y-6 backdrop-blur"
            noValidate
            aria-label="Login form"
          >
            <h2 className="text-3xl font-black text-center text-cyan-400 tracking-wider drop-shadow-md">
              HUNTER'S GATE
            </h2>
            <p className="text-sm uppercase text-purple-500 text-center tracking-widest">
              Shadow Monarch System
            </p>

            {error && (
              <p className="text-red-500 text-sm text-center" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold uppercase text-cyan-400 tracking-wider"
              >
                Hunter ID
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                className={`w-full p-3 rounded bg-gray-800 border ${
                  errors.email ? "border-red-500" : "border-gray-700"
                } focus:outline-none focus:border-cyan-400`}
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold uppercase text-cyan-400 tracking-wider"
              >
                Access Code
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className={`w-full p-3 rounded bg-gray-800 border ${
                  errors.password ? "border-red-500" : "border-gray-700"
                } focus:outline-none focus:border-cyan-400`}
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 py-3 rounded font-semibold uppercase text-white shadow-md"
              aria-label="Submit login form"
            >
              Login
            </button>

            <div className="text-center text-sm text-white/70">or</div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 border border-purple-600/50 rounded bg-black/60 hover:bg-purple-600/20 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.20-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="text-center text-sm text-white/70">
              New Hunter?{" "}
              <Link
                to="/signup"
                className="font-semibold text-cyan-400 hover:text-purple-500 transition-colors duration-300 bg-transparent border-none cursor-pointer hover:drop-shadow-[0_0_10px_rgba(138,43,226,0.5)]"
                aria-label="Sign up for a new account"
              >
                Join the Guild
              </Link>
            </div>
          </form>
        </div>
      )}

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
      `}</style>
    </div>
  );
};

export default Login;