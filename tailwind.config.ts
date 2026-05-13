import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0D1B2A",
          50: "#1a2d42",
          100: "#162435",
          200: "#0f1f30",
          300: "#0D1B2A",
        },
        brand: {
          DEFAULT: "#1E6FD9",
          50:  "#EAF1FB",
          100: "#C5DAEF",
          200: "#7BB3E0",
          300: "#4D96D9",
          400: "#1E6FD9",
          500: "#1558B0",
          600: "#0D4287",
        },
        teal: {
          DEFAULT: "#00C2CB",
          50: "#E0FAFB",
          100: "#9EEEF2",
          200: "#00C2CB",
          300: "#009EA6",
        },
        priority: {
          highest: "#FF4D4F",
          high:    "#FF7A45",
          medium:  "#FFC53D",
          low:     "#73D13D",
          lowest:  "#40A9FF",
        },
      },
      fontFamily: {
        sans:  ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono:  ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "slide-in-right": "slideInRight 0.25s ease-out",
        "fade-in":        "fadeIn 0.2s ease-out",
        "scale-in":       "scaleIn 0.15s ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
