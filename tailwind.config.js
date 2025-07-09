/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: "#FF7D1F",
        green: "#9CCC44",
        blue: "#4DB9CA",
        purple: "#984EFD",
        pink: "#FC478E",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
