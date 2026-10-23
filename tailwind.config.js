/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cozy: {
          bg: '#FFF5F5',
          card: '#FFFFFF',
          primary: '#F4B5B5',
          accent: '#E88A8A',
          text: '#4A3535',
          muted: '#9B7272',
          border: '#F4B5B5',
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
      },
    },
  },
  plugins: [],
};
