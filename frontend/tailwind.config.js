/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0052FF',
          secondary: '#4D7CFF',
          50: '#EFF4FF',
          100: '#DBE5FF',
          200: '#BFD3FF',
          500: '#0052FF',
          600: '#0046DC',
          700: '#003BB8',
        },
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#FAFAFA',
        },
        cream: {
          DEFAULT: '#FAFAFA',
          soft: '#F1F5F9',
          dark: '#E2E8F0',
        },
        gold: {
          DEFAULT: '#0052FF',
          50: '#EFF4FF',
          100: '#DBE5FF',
          200: '#BFD3FF',
          300: '#4D7CFF',
          400: '#0052FF',
          500: '#0046DC',
          600: '#003BB8',
          700: '#002F94',
        },
        dark: {
          DEFAULT: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          400: '#64748B',
          300: '#94A3B8',
        },
        lightBorder: '#E2E8F0',
        lightGray: '#F1F5F9',
      },
      borderRadius: {
        '28': '28px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.04)',
        glassHover: '0 12px 40px 0 rgba(0, 82, 255, 0.15)',
        luxury: '0 20px 50px rgba(15, 23, 42, 0.06)',
        accent: '0 4px 14px rgba(0, 82, 255, 0.28)',
        'accent-lg': '0 8px 24px rgba(0, 82, 255, 0.38)',
      },
      fontFamily: {
        display: ['"Calistoga"', '"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
