/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "inside-gold": "#D4AF37",
        "inside-dark": "#0A0A0A",
        "inside-gray": "#1C1C1C",
        "inside-accent": "#E5E5E5",
      },
      fontFamily: {
        cinematic: ["Inter", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        "gold-glow": "0 0 15px rgba(212, 175, 55, 0.2)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
