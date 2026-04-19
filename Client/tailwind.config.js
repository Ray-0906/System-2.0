import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
 content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        primary: ["'Rajdhani'", "'Orbitron'", "monospace"],
        secondary: ["'Exo 2'", "'Poppins'", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.7)' },
        },
        auroraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        floatBlob: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.65' },
          '50%': { transform: 'translateY(-14px) scale(1.08)', opacity: '0.9' },
        },
        rotateRing: {
          'to': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'shimmer': 'shimmer 2.2s infinite',
        'glow-pulse': 'glow-pulse 2s infinite',
        'aurora': 'auroraShift 9s ease-in-out infinite',
        'blob': 'floatBlob 11s ease-in-out infinite',
        'rotate-ring': 'rotateRing 18s linear infinite',
      }
    },
  },
  plugins: [
    typography,
  ],
}

