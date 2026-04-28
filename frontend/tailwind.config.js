/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          925: "#0f1117",
          950: "#0a0c12",
        },
      },
    },
  },
  plugins: [],
};
