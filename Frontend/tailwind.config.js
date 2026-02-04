/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        finance: {
          primary: "#0F172A", // Slate 900
          secondary: "#334155", // Slate 700
          accent: "#0EA5E9", // Sky 500
          success: "#10B981", // Emerald 500
          danger: "#EF4444", // Red 500
          background: "#F1F5F9", // Slate 100
          surface: "#FFFFFF", // White
        },
      },
      screens: {
        xs: "420px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
