/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#0A0E1A',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
          200: '#CBD5E1',
          100: '#E2E8F0',
          50: '#F8FAFC'
        },
        night: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706'
        },
        shield: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED'
        },
        dust: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        }
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      backdropBlur: {
        glass: '16px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-shield': '0 0 20px rgba(139, 92, 246, 0.3)'
      }
    }
  },
  plugins: []
}
