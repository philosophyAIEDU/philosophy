/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          gold: '#D4AF37',
          goldLight: '#F3E5AB',
          goldDark: '#AA8C2C',
        },
        luxury: {
          charcoal: '#36454F',
          graphite: '#252525',
          cream: '#FFFDD0',
        },
        // Semantic colors mapped to new palette
        listening: '#3B82F6', // Keeping functional colors for now but potentially muted
        reading: '#10B981',
        writing: '#F59E0B',
        speaking: '#EF4444',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(to right bottom, #1e293b, #0f172a)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
      },
    },
  },
  plugins: [],
}
