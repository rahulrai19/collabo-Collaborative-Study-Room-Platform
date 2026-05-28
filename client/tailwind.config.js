/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50:'#faf5fb', 100:'#f3e8f5', 200:'#e6cde9', 300:'#d5a9d8', 400:'#c07dc5', 500:'#7f2880', 600:'#6b206c', 700:'#551956', 800:'#431444', 900:'#341135' },
        dark: { 900:'#0B0F19', 800:'#121826', 700:'#1f2937', 600:'#374151', 500:'#4b5563' },
        peach: { 400:'#F87171', 500:'#ef4444' }
      }
    },
  },
  plugins: [],
}
// Force tailwind rebuild
