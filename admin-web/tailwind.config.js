/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#AD2C00',
          600: '#872000',
          700: '#D83900',
          800: '#E65100',
          900: '#BF360C',
        },
        secondary: {
          50: '#F6F3F2',
          100: '#EAE7E7',
          200: '#E5E2E1',
          300: '#A8A29E',
          400: '#78716C',
          500: '#5F5E5E',
          600: '#1C1B1B',
        },
      },
    },
  },
  plugins: [],
}
