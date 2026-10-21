/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Aksen mengikuti elemen biru & hijau logo RSUD AMI
        aksen: {
          biru: '#0284c7', // sky-600
          hijau: '#16a34a', // green-600
        },
      },
      boxShadow: {
        kartu: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
}
