/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gk-bg': '#1a1a2e',
        'gk-bg-secondary': '#16213e',
        'gk-bg-tertiary': '#0f3460',
        'gk-accent-cyan': '#00d9ff',
        'gk-accent-magenta': '#ff006e',
        'gk-accent-green': '#00ff88',
        'gk-accent-orange': '#ff8c00',
        'gk-accent-purple': '#a855f7',
        'gk-accent-yellow': '#fbbf24',
        'gk-text': '#e4e4e7',
        'gk-text-muted': '#a1a1aa',
        'gk-border': '#27272a',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
