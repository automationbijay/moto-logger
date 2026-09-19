/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          950: '#0b0d11',
          900: '#111318',
          850: '#161920',
          800: '#1b1f28',
          700: '#262b37',
          600: '#383f4f'
        },
        amberFlame: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          DEFAULT: '#FF6B35'
        },
        tealMint: '#10b981',
        marineBlue: '#0284c7'
      },
      boxShadow: {
        'glow-orange': '0 8px 24px -4px rgba(255, 107, 53, 0.35)',
        'card-warm': '0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
      }
    },
  },
  plugins: [],
}

