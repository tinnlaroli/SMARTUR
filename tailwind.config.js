/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant Mexican color palette
        orange: {
          DEFAULT: "#FF7D1F",
          light: "#FF9E4D",
          dark: "#E05D00"
        },
        green: {
          DEFAULT: "#9CCC44",
          light: "#C1E57D",
          dark: "#7AAB20"
        },
        blue: {
          DEFAULT: "#4DB9CA",
          light: "#7FD1E0",
          dark: "#2D8FA0"
        },
        purple: {
          DEFAULT: "#984EFD",
          light: "#BB8AFF",
          dark: "#7A2CE8"
        },
        pink: {
          DEFAULT: "#FC478E",
          light: "#FF7EAD",
          dark: "#E01A6B"
        },
        // Additional colors for more vibrancy
        yellow: "#FFD700",
        red: "#E53E3E",
        teal: "#38B2AC",
        indigo: "#5C6BC0"
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        // Adding decorative font options
        decorative: ['"Cinzel Decorative"', 'serif'],
        handwritten: ['"Dancing Script"', 'cursive']
      },
      backgroundImage: {
        'colorful-pattern': "url('path-to/colorful-mexican-pattern.png')",
        'paper-texture': "url('path-to/aged-paper-texture.jpg')"
      },
      boxShadow: {
        'colorful': '0 4px 20px -5px rgba(252, 71, 142, 0.3), 0 4px 20px -5px rgba(152, 78, 253, 0.3), 0 4px 20px -5px rgba(76, 185, 202, 0.3)',
        'folk-art': '5px 5px 0px 0px rgba(0,0,0,0.1)'
      },
      borderWidth: {
        'decorative': '3px'
      },
      animation: {
        'pulse-slow': 'pulse 5s infinite',
        'fiesta': 'bounce 1s infinite'
      }
    },
  },
  plugins: [
    require('tailwindcss-animated')
  ],
}
