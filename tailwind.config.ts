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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // AAPA custom tokens
        base: "#1a1a2e",
        "base-card": "#374151",
        accent: "#f59e0b",
        "score-red": "#ef4444",
        "score-yellow": "#eab308",
        "score-blue": "#3b82f6",
        "score-green": "#22c55e",
        "profile-accessories": "#f59e0b",
        "profile-parts": "#3b82f6",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
