import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1180px" },
    },
    extend: {
      colors: {
        border: "#e0e0d2",
        input: "#e0e0d2",
        ring: "#5f8a00",
        background: "#f2f2ea",
        foreground: "#16160f",
        primary: {
          DEFAULT: "#a8e617",
          foreground: "#1c2400",
          hover: "#d4ff4d",
        },
        secondary: {
          DEFAULT: "#1c2400",
          foreground: "#a8e617",
          hover: "#262f00",
        },
        muted: { DEFAULT: "#e9e9dd", foreground: "#5f5f57" },
        accent: { DEFAULT: "#e9e9dd", foreground: "#1c2400" },
        destructive: { DEFAULT: "#d6483c", foreground: "#ffffff" },
        card: { DEFAULT: "#ffffff", foreground: "#16160f" },
        popover: { DEFAULT: "#ffffff", foreground: "#16160f" },
        brand: {
          cream: "#f2f2ea",
          "cream-2": "#e9e9dd",
          ink: "#16160f",
          muted: "#5f5f57",
          lime: "#a8e617",
          "lime-glow": "#d4ff4d",
          green: "#5f8a00",
          navy: "#1c2400",
          "navy-2": "#262f00",
          line: "#e0e0d2",
          amber: "#e0a72e",
          red: "#d6483c",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-instrument-sans)",
          "Instrument Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        display: [
          "clamp(1.75rem, 4.5vw, 2.625rem)",
          { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "600" },
        ],
        h2: [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "-0.5px", fontWeight: "600" },
        ],
        h3: [
          "1.3125rem",
          { lineHeight: "1.575rem", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
        body: ["1rem", { lineHeight: "1.5rem" }],
        button: ["0.90625rem", { lineHeight: "normal", fontWeight: "500" }],
        small: ["0.78125rem", { lineHeight: "1.125rem" }],
        eyebrow: [
          "0.71875rem",
          { lineHeight: "1rem", letterSpacing: "1.6px", fontWeight: "400" },
        ],
      },
      borderRadius: {
        input: "10px",
        button: "12px",
        panel: "14px",
        card: "16px",
        pill: "999px",
      },
      borderWidth: { "1.5": "1.5px" },
      boxShadow: {
        card: "0 10px 30px rgba(28, 36, 0, 0.08)",
        primary: "0 6px 18px rgba(168, 230, 23, 0.35)",
        "primary-hover": "0 8px 22px rgba(168, 230, 23, 0.5)",
        "focus-lime": "0 0 0 3px rgba(168, 230, 23, 0.25)",
        floating: "0 6px 16px rgba(0, 0, 0, 0.35)",
      },
      maxWidth: { app: "1180px" },
    },
  },
  plugins: [animate],
};

export default config;
