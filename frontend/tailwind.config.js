/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0d0f14',
        surface:  '#13161e',
        surface2: '#1a1f2c',
        surface3: '#212638',
        border:   '#2a3047',
        accent:   '#4f7cff',
        accent2:  '#7c4fff',
        green:    '#22c55e',
        red:      '#ef4444',
        orange:   '#f97316',
        yellow:   '#eab308',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
