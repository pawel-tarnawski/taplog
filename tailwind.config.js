/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: '#0e1016',
        tile: {
          DEFAULT: '#181b26',
          hover: '#1e2133',
        },
        sidebar: '#12141e',
        primary: '#c8c4d4',
        muted: '#6b6d85',
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
    },
  },
  plugins: [],
}
