/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cozy: {
          bg: 'rgb(var(--cozy-bg) / <alpha-value>)',
          card: 'rgb(var(--cozy-card) / <alpha-value>)',
          paper: 'rgb(var(--cozy-paper) / <alpha-value>)',
          primary: 'rgb(var(--cozy-primary) / <alpha-value>)',
          accent: 'rgb(var(--cozy-accent) / <alpha-value>)',
          text: 'rgb(var(--cozy-text) / <alpha-value>)',
          muted: 'rgb(var(--cozy-muted) / <alpha-value>)',
          border: 'rgb(var(--cozy-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
          '60%': { transform: 'scale(1.2) translateY(-40px)', opacity: '0.9' },
          '100%': { transform: 'scale(0.8) translateY(-80px)', opacity: '0' },
        },
        'jar-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-12deg)' },
          '30%': { transform: 'rotate(10deg)' },
          '45%': { transform: 'rotate(-8deg)' },
          '60%': { transform: 'rotate(6deg)' },
          '75%': { transform: 'rotate(-3deg)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'heart-pop': 'heart-pop 0.9s ease-out forwards',
        'bounce-in': 'bounce-in 0.35s ease-out both',
        'jar-shake': 'jar-shake 0.9s ease-in-out',
      },
    },
  },
  plugins: [],
};
