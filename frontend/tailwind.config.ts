import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-kumbh-sans)", "Kumbh Sans", "sans-serif"],
      },
      colors: {
        tf: {
          ink: "#0c2124",
          panel: "#123237",
          tile: "#1c5360",
          "tile-hover": "#236475",
          row: "#0e2327",
          accent: "#2e8fa3",
          sky: "#b5e8f4",
          rose: "#f48fb1",
          mint: "#a5d6a7",
          amber: "#ffcc80",
          lime: "#f1ffb5",
          peach: "#ffd0b0",
          salmon: "#f4b0b0",
          blue: "#90caf9",
          line: "#5d5845",
          text: "#f3efe9",
          muted: "#9ebdc4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
