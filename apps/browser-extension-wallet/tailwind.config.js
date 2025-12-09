/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{tsx,ts,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#22222e',
          500: '#2a2a38',
        },
        accent: {
          purple: '#7c3aed',
          'purple-hover': '#6d28d9',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0b0',
          muted: '#6b6b7b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
