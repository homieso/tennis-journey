/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wimbledon-green': '#0B4F37',
        'wimbledon-grass': '#7CB083',
        'wimbledon-purple': '#6B4E71',
        'wimbledon-white': '#F5F5F5',
      },
      fontFamily: {
        'wimbledon': ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}