import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#3b82f6"
        },
        secondary: {
          DEFAULT: "#4f46e5",
          dark: "#4338ca",
          light: "#6366f1"
        },
        success: {
          DEFAULT: "#16a34a",
          dark: "#15803d",
          light: "#22c55e"
        },
        warning: {
          DEFAULT: "#ca8a04",
          dark: "#a16207",
          light: "#eab308"
        },
        error: {
          DEFAULT: "#dc2626",
          dark: "#b91c1c",
          light: "#ef4444"
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};

export default config;
