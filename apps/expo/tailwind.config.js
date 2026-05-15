/** @type {import('tailwindcss').Config} */
// ─── Web-Mobile Color Parity ───────────────────────────────────────
// Extracted from apps/next/app/globals.css (shadcn/ui slate theme)
// --primary: 222.2 47.4% 11.2%  →  #1A2744  (dark navy)
// --foreground: 222.2 84% 4.9%  →  #090E1A
// --secondary: 210 40% 96.1%    →  #F1F5F9  (slate-100)
// --muted-foreground: 215.4 16.3% 46.9% → #64748B (slate-500)
// --border: 214.3 31.8% 91.4%   →  #E2E8F0  (slate-200)
// Scrollbar/brand accent:         #6366F1  (indigo-500)
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Brand / Accent (Indigo — matches web scrollbar & interactive elements) ──
        primary: {
          DEFAULT: "#6366F1",
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        // ── Web Primary (dark navy) ──
        navy: {
          DEFAULT: "#1A2744",
          light: "#2D3F6B",
          dark: "#090E1A",
        },
        // ── Neutrals (slate palette — matches web secondary/muted) ──
        surface: "#FFFFFF",
        background: "#F8FAFC",
        "muted-bg": "#F1F5F9",
        "muted-text": "#64748B",
        border: "#E2E8F0",
        foreground: "#090E1A",
        // ── Semantic ──
        success: "#22C55E",
        danger:  "#EF4444",
        warning: "#F59E0B",
        info:    "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
