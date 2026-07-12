/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F8CFF',
          dark: '#3B6FD9',
          light: '#7BA8FF',
        },
        secondary: {
          DEFAULT: '#5EEAD4',
          dark: '#3DD4BD',
        },
        background: '#EAF1F8',
        surface: '#F8FAFC',
        'text-primary': '#1E293B',
        'text-secondary': '#64748B',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '30px',
      },
      boxShadow: {
        'neumorph': '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        'neumorph-hover': '12px 12px 24px #c5cdd8, -12px -12px 24px #ffffff',
        'neumorph-inset': 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
