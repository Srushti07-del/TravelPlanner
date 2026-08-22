/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // indigo-600
        secondary: '#10B981', // emerald-500
        accent: '#F59E0B', // amber-500
      },
    },
  },
  plugins: [],
};
