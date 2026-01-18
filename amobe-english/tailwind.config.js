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
        'navy-dark': '#111827', // Main background
        'navy-card': '#1F2937', // Card and sidebar background
        'accent-blue': '#3B82F6', // Listening
        'accent-green': '#10B981', // Reading
        'accent-yellow': '#FACC15', // Writing / Highlight
        'accent-red': '#EF4444', // Speaking
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
