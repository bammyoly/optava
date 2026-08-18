import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base
        background: "#f0f4ff",
        foreground: "#1a1a2e",
        border: "#e2e8f0",

        // Clay palette
        clay: {
          50:  "#f8f7ff",
          100: "#f0eeff",
          200: "#e4e0ff",
          300: "#c9c2ff",
          400: "#a99eff",
          500: "#8b7ff8",
          600: "#7c6df0",
          700: "#6a5bd4",
          800: "#574aac",
          900: "#483d8b",
        },

        // Accent colors for nav items
        violet:  "#8b7ff8",
        indigo:  "#6366f1",
        blue:    "#60a5fa",
        cyan:    "#22d3ee",
        emerald: "#34d399",
        amber:   "#fbbf24",
        rose:    "#fb7185",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      boxShadow: {
        // Clay shadows
        "clay-sm": "4px 4px 10px rgba(139, 127, 248, 0.15), inset 0 -2px 4px rgba(0,0,0,0.08)",
        "clay":    "6px 6px 16px rgba(139, 127, 248, 0.2), inset 0 -3px 6px rgba(0,0,0,0.08)",
        "clay-lg": "8px 8px 24px rgba(139, 127, 248, 0.25), inset 0 -4px 8px rgba(0,0,0,0.08)",
        "clay-inset": "inset 4px 4px 12px rgba(0,0,0,0.08), inset -2px -2px 8px rgba(255,255,255,0.8)",

        // Colored clay shadows for nav items
        "clay-violet":  "4px 4px 14px rgba(139, 127, 248, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",
        "clay-blue":    "4px 4px 14px rgba(96, 165, 250, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",
        "clay-emerald": "4px 4px 14px rgba(52, 211, 153, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",
        "clay-amber":   "4px 4px 14px rgba(251, 191, 36, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",
        "clay-rose":    "4px 4px 14px rgba(251, 113, 133, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",
      },

      backgroundImage: {
        "clay-gradient": "linear-gradient(135deg, #f8f7ff 0%, #f0eeff 100%)",
        "clay-violet":   "linear-gradient(135deg, #a99eff 0%, #8b7ff8 100%)",
        "clay-blue":     "linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)",
        "clay-emerald":  "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)",
        "clay-amber":    "linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)",
        "clay-rose":     "linear-gradient(135deg, #fda4af 0%, #fb7185 100%)",
        "clay-cyan":     "linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)",
        "page-bg":       "linear-gradient(135deg, #f0f4ff 0%, #faf0ff 50%, #f0f8ff 100%)",
      },

      animation: {
        "float":     "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;