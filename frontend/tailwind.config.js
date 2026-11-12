/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1020', // Main dark navy background
          800: '#0E172E',
          700: '#14213D', // Deep blue card/panel background
          600: '#1E2C4F',
          500: '#2A3C66',
        },
        primary: {
          DEFAULT: '#3B82F6', // Electric blue
          hover: '#2563EB',
          light: '#60A5FA',
          glow: 'rgba(59, 130, 246, 0.15)',
        },
        slate: {
          850: '#131B2E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

