import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wt: {
          bg:      '#0d0d0d',
          surface: '#141414',
          card:    '#1c1c1c',
          border:  '#282828',
          accent:  '#f97316',
          accent2: '#fb923c',
          text:    '#f5f5f5',
          muted:   '#737373',
          green:   '#22c55e',
          red:     '#ef4444',
          yellow:  '#eab308',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
