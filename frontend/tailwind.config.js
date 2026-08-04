/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dfe8ff",
          200: "#c2d4ff",
          300: "#98b6ff",
          400: "#6690fd",
          500: "#4169f0",
          600: "#2d4fd6",
          700: "#243fb0",
          800: "#20368a",
          900: "#1d306d",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        ink: {
          50: "#f8f9fb",
          100: "#f1f2f5",
          200: "#e3e6eb",
          300: "#cdd2db",
          400: "#9aa2b1",
          500: "#6b7280",
          600: "#4b5262",
          700: "#363c4a",
          800: "#20242e",
          900: "#12141a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.3rem" }],
        base: ["0.9375rem", { lineHeight: "1.55rem" }],
        lg: ["1.0625rem", { lineHeight: "1.6rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        "3xl": ["1.9rem", { lineHeight: "2.3rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.5rem", { lineHeight: "2.8rem", letterSpacing: "-0.025em" }],
        "5xl": ["3.25rem", { lineHeight: "3.5rem", letterSpacing: "-0.03em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18, 20, 26, 0.04), 0 1px 3px rgba(18, 20, 26, 0.04)",
        card: "0 4px 14px rgba(18, 20, 26, 0.07), 0 1px 3px rgba(18, 20, 26, 0.05)",
        lifted: "0 12px 28px rgba(18, 20, 26, 0.10), 0 2px 6px rgba(18, 20, 26, 0.06)",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(45,79,214,0.10) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
