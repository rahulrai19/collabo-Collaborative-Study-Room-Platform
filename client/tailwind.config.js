/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd', 400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed', 700:'#6d28d9', 800:'#5b21b6', 900:'#4c1d95' },
        dark: { 900:'#0B0F19', 800:'#121826', 700:'#1f2937', 600:'#374151', 500:'#4b5563' },
        peach: { 400:'#F87171', 500:'#ef4444' }
      }
    },
  },
  plugins: [],
}
