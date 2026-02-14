module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#39ff14",
          purple: "#b300ff",
          pink: "#ff006e",
          cyan: "#00ffff",
          dark: "#0a0e27",
        },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { textShadow: "0 0 10px #39ff14" },
          "50%": { textShadow: "0 0 20px #39ff14, 0 0 30px #39ff14" },
        },
      },
    },
  },
  plugins: [],
};
