/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        midnight: '#1a202c',
        coral: '#ff7f50',
        sage: '#f4f7f4',
        parchment: '#fcfaf7',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};