# System 2.0 - UI/UX Design Strategy & AI Styling Guide

This document serves as the canonical design system and implementation guide for the **System 2.0** frontend. Any AI agent or developer adding new pages or updating existing components should strictly adhere to these patterns to maintain the "Solo Leveling" / System window aesthetic.

## 1. Core Aesthetic
- **Theme**: LitRPG / Solo Leveling "System Interface".
- **Vibe**: Dark, sleek, somewhat ominous but rewarding. High contrast.
- **Lighting**: Neon glows against abyssal dark backgrounds, extensive use of radial gradients and drop shadows.

## 2. Typography
- **Primary (Numbers, Stats, Headers)**: `'Rajdhani'`, `'Orbitron'`, or `monospace`. Often tracked out (letter-spacing) and bold.
- **Secondary (Body, Descriptions, UI Elements)**: `'Exo 2'`, `'Poppins'`, or `sans-serif`. 
- **Implementation**: Tailwinds `font-['Exo_2']` or custom mapping in Tailwind config.

## 3. Color Palette
- **Backgrounds**: 
  - Deep atmospheric darks: `bg-black`, `bg-gray-950`.
  - Gradients: `bg-gradient-to-b from-[#030305] to-[#0a0a0f]` or `bg-gradient-to-br from-gray-900 via-black to-gray-800`.
- **Accents (The "System" Colors)**:
  - System Purple: `purple-500` (`#a855f7`), `purple-600`
  - System Pink (Alerts/High Rank): `pink-500` (`#ec4899`)
  - Tech Cyan (Info/Stats): `cyan-400`, `blue-500`
- **Text**: `text-gray-200` or `text-white` for primary, `text-purple-300`/`text-gray-400` for secondary.

## 4. The Interactive "System" Background (Standard Page Wrapper)
EVERY main app page should have the signature mouse-tracking ambient glow. When an AI generates or updates a page, wrap the main return block exactly like this:

```jsx
import AuthLayout from '../components/AuthLayout';

export default function GenericSystemPage() {
  return (
    <AuthLayout>
      {/* 1. Main Background Wrapper with Mouse Tracker */}
      <div 
        className="min-h-screen bg-gradient-to-b from-[#030305] to-[#0a0a0f] text-gray-200 relative overflow-hidden font-['Exo_2'] pb-24"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        {/* 2. dynamic mouse-following glow overlay */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 animate-pulse"
          style={{
            background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.15), transparent 80%)'
          }}
        />

        {/* 3. Optional: Subdued Grid/Matrix overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

        {/* 4. Foreground Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Component Content Here */}
        </div>
      </div>
    </AuthLayout>
  );
}
```

## 5. UI Component Strategies

### Glassmorphism System Panels (Cards)
Use semitransparent black backgrounds with strong glowing borders.
```jsx
<div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/30 p-6 shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:border-purple-500/50 transition-all duration-300">
  ... content
</div>
```

### Glowing Text (Headers)
For main titles or critical System prompts.
```jsx
<h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
  SYSTEM DIRECTIVE
</h1>
```

### Call to Action (Primary Buttons)
```jsx
<button className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold tracking-wider hover:from-purple-500 hover:to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-105 transition-all duration-300">
  ACCEPT QUEST
</button>
```

### Progress Bars (XP / Health / Duration)
```jsx
<div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50">
  <div 
    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)] transition-all duration-700" 
    style={{ width: '65%' }}
  />
</div>
```

## 6. AI Agent Instruction Checklist for Styling Pages
Whenever you (the AI) are asked to "redesign", "style", or "apply System theme" to a page:
1. **Locate the outermost `<div>`** inside the `return` statement (usually inside an `<AuthLayout>`).
2. **Apply the mouse-tracking wrapper** and CSS variable assignment (Section 4).
3. **Insert the interactive radial-gradient `<div />`** immediately inside the wrapper.
4. **Reskin flat elements**: Change solid white/gray backgrounds to `bg-black/40 backdrop-blur-sm` with `border-purple-500/30`.
5. **Update text colors**: Avoid pure stark white if possible; use `text-purple-200`, `text-indigo-200`, or gradients for headers.
6. **Add hover states**: Interactive elements should scale slightly (`hover:scale-105`) and their shadow/glow should intensify.