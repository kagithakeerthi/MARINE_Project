import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0369a1',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        coral: {
          300: '#fb7185',
          400: '#f43f5e',
          500: '#ec4899',
        },
        seagrass: {
          300: '#4ade80',
          400: '#22c55e',
          500: '#16a34a',
        },
      },
    },
  },
  plugins: [],
} as const
