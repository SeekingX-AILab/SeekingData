/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        secondary: {
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#9C27B0',
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A148C',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          variant: '#F5F5F5',
        },
        background: {
          DEFAULT: '#FAFAFA',
          dark: '#121212',
        },
        error: {
          DEFAULT: '#B3261E',
          light: '#F2B8B5',
        },
        success: {
          DEFAULT: '#2E7D32',
          light: '#A5D6A7',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '28px',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
        'elevation-2': '0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
        'elevation-3': '0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.3)',
        'elevation-4': '0 6px 10px 4px rgba(0,0,0,0.15), 0 2px 3px 0 rgba(0,0,0,0.3)',
        'elevation-5': '0 8px 12px 6px rgba(0,0,0,0.15), 0 4px 4px 3px rgba(0,0,0,0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ripple': 'ripple 0.6s linear',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
