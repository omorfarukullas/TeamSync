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
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        body: ["var(--font-body)", "Source Serif 4", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        mono: {
          black: "#000000",
          white: "#FFFFFF",
          muted: "#F5F5F5",
          "muted-fg": "#525252",
          "border-light": "#E5E5E5",
          "border-dark": "#000000",
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
        none: "none",
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};

export default config;
