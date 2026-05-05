/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: '#0f1117',
        tile: {
          DEFAULT: '#1a1d27',
          hover: '#1f2335',
        },
        sidebar: '#13151f',
        accent: '#3b82f6',
        primary: '#e2e8f0',
        muted: '#64748b',
        danger: '#ef4444',
        success: '#22c55e',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'tile-pulse': 'tile-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'tile-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 24px rgba(59, 130, 246, 0.35)' },
          '50%': { 'box-shadow': '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
