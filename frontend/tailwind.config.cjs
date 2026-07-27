/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'construction-gold': '#d97706', // Darker amber for better contrast
        'construction-gold-light': '#f59e0b',
        'manufacturing-blue': '#2563eb', // Darker blue
        'manufacturing-blue-light': '#3b82f6',
        'slate': '#0f172a',
        'slate-50': '#f8fafc',
        'slate-100': '#f1f5f9',
        'slate-200': '#e2e8f0',
        'slate-300': '#cbd5e1',
        'slate-400': '#94a3b8',
        'slate-500': '#64748b',
        'slate-600': '#475569',
        'slate-700': '#334155',
        'slate-800': '#1e293b',
        'slate-900': '#0f172a',
      },
    },
  },
  plugins: [],
}
