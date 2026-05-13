import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0D1B2A",
          50:  "#1a2d42",
          100: "#162435",
          200: "#0f1f30",
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
          50:  "#E0FAFB",
          100: "#9EEEF2",
          200: "#00C2CB",
          300: "#009EA6",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;