import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1F4E79",
          dark: "#0F2D47",
          light: "#2E6DA4",
          50: "#f0f6fc",
          100: "#dbe8f5",
          200: "#bad3ee",
          300: "#8eb6e2",
          400: "#5c94d3",
          500: "#3974c0",
          600: "#2759a4",
          700: "#1F4E79",
          800: "#1b3f61",
          900: "#0F2D47",
          950: "#081726",
        },
        status: {
          availBg: "#C6EFCE",
          availBorder: "#70AD47",
          availText: "#375623",
          notBg: "#FFC7CE",
          notBorder: "#FF0000",
          notText: "#9C0006",
          maybeBg: "#FFEB9C",
          maybeBorder: "#FFAB00",
          maybeText: "#7D4E00",
          emptyBg: "#F5F5F5",
          emptyText: "#6B7280",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 78, 121, 0.15)",
        gold: "0 0 15px rgba(245, 158, 11, 0.35)",
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.15)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pulseLive: "pulseLive 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
