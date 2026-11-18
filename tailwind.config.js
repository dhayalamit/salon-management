/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F8F5EF',
          soft: '#F4F0E6',
          dark: '#EFEAE0',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FDFBF3',
          100: '#F9F3DC',
          200: '#F2E4B2',
          300: '#E5C358',
          400: '#D4AF37',
          500: '#C59F2E',
          600: '#A37E1F',
          700: '#7E5F15',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          800: '#262626',
          700: '#333333',
          400: '#666666',
          300: '#888888',
        },
        lightBorder: '#E8DFCF',
        lightGray: '#ECE8DF',
      },
      borderRadius: {
        '28': '28px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        glassHover: '0 12px 40px 0 rgba(212, 175, 55, 0.12)',
        luxury: '0 20px 50px rgba(26, 26, 26, 0.06)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
