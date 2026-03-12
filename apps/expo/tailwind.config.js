/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#fdf6ee",
          100: "#faecd8",
          200: "#f5d5a8",
          300: "#efb970",
          400: "#e89442",
          500: "#e27a24",
          600: "#c95e18",
          700: "#a74518",
          800: "#87371c",
          900: "#6e2f1a",
        },
        brand: "#e27a24",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
