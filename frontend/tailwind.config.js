/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        slate: '#374151',
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        accent: '#DB2777',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
