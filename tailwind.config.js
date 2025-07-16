/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  important: '#root', // Kluczowa linia - wymusza ważność styli Tailwind
  theme: {
    extend: {
      colors: {
        // Przykładowe kolory - możesz dodać własne
        primary: '#3490dc',
        secondary: '#ffed4a',
        danger: '#e3342f',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Opcjonalnie - jeśli masz konflikty z istniejącymi stylami
    preflight: true, // false jeśli chcesz wyłączyć domyślne style Tailwind
  }
}
