/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'cosmic-latte': '#FFF8E7',
        'system-black': '#050505',
        'accent-blue': '#0000FF',
        'accent-red': '#FF0000',
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display': ['12vw', { lineHeight: '0.8', letterSpacing: '-0.04em' }],
        'meta': ['11px', { lineHeight: '1.4', letterSpacing: '0.05em', textTransform: 'uppercase' }],
      },
      screens: {
        'lg': '1024px',
        'xl': '1440px',
        '2xl': '1920px',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
