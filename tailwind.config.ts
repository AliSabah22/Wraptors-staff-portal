import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wraptors: {
          black: "#0a0a0a",
          charcoal: "#141414",
          surface: "#1a1a1a",
          "surface-hover": "#242424",
          border: "#2a2a2a",
          gold: "#C8A45D",
          "gold-light": "#D4B87A",
          "gold-dark": "#A68B4B",
          muted: "#737373",
          "muted-light": "#a3a3a3",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(200, 164, 93, 0.2)",
        "gold-glow": "0 0 24px -4px rgba(200, 164, 93, 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
