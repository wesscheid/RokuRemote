export default {
  content: [
    './index.html',
    './**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        roku: {
          purple: '#662D91',
          dark: '#281140',
          accent: '#9E66C4'
        }
      }
    }
  },
  plugins: [],
}
