/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primaryColor: "#e0e1e6",
        secondaryColor: "#4F46E5",
        thirdColor: '#fbb984',
      },
    },
  },
  plugins: [],
}

