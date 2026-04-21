/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        lime: {
          50:  '#f4fbe4',
          100: '#e5f5c3',
          200: '#caed8c',
          300: '#b1e35e',
          400: '#a3e635',
          500: '#88c61e',
          600: '#6aa214',
        },
        ink: {
          50:  '#f5f7f4',
          100: '#e9ecea',
          900: '#0a0f0c',
          950: '#050805',
        },
        forest: {
          900: '#0b2418',
          950: '#071a10',
        },
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter2: '-0.035em',
      },
    },
  },
  plugins: [],
};
