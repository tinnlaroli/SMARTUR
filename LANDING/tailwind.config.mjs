/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        tablet: { max: "987px" },
        phone: { max: "767px" },
        "phone-sm": { max: "400px" },
      },
    },
  },
  plugins: [],
};
