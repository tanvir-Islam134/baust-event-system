/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Black and Gold Elegance" Color Palette
        brand: {
          white: '#FFFFFF',
          silver: '#E5E5E5',
          gold: '#FCA311',
          'gold-hover': '#e5920d',
          'gold-light': '#fff8eb',
          'gold-muted': '#fde0ad',
          navy: '#14213D',
          'navy-dark': '#0d1629',
          'navy-light': '#1e2f52',
          black: '#000000',
        },
        gold: {
          50: '#fffbf0',
          100: '#fef3d6',
          200: '#fde4ab',
          300: '#fccf75',
          400: '#fbb73b',
          500: '#FCA311',
          600: '#e5920d',
          700: '#be6b07',
          800: '#97520e',
          900: '#7c430f',
        },
        navy: {
          50: '#f0f3fa',
          100: '#dce4f3',
          200: '#bccbe9',
          300: '#91acdc',
          400: '#5e86cb',
          500: '#3c66b8',
          600: '#2c4f99',
          700: '#233e7b',
          800: '#1b305f',
          900: '#14213D',
          950: '#0c1426',
        },
        silver: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
        },
        baust: {
          50: '#f0f3fa',
          100: '#dce4f3',
          500: '#FCA311',
          700: '#14213D',
          900: '#0d1629',
        },
      },
    },
  },
  plugins: [],
};

