/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#3B82F6',
          green: '#10B981',
          purple: '#8B5CF6',
        },
        listening: '#3B82F6',
        reading: '#10B981',
        writing: '#F59E0B',
        speaking: '#EF4444',
      },
    },
  },
  plugins: [],
}
