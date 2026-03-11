import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00F5A0",
          50: "#F0FFF9",
          100: "#CCFFF0",
          500: "#00F5A0",
          600: "#00D988",
          700: "#00B870",
        },
        purple: {
          500: "#7B61FF",
          600: "#6448FF",
        },
        dark: {
          50:  "#E8E8F0",
          100: "#BBBBD0",
          200: "#6B6B8A",
          300: "#2A2A3E",
          400: "#1A1A26",
          500: "#12121A",
          600: "#0A0A0F",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        pulseGlow: { "0%,100%": { boxShadow: "0 0 8px #00F5A030" }, "50%": { boxShadow: "0 0 24px #00F5A060" } },
      },
    },
  },
  plugins: [],
};
export default config;
