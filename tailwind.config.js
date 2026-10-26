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
      keyframes: {
        'dropdown-masuk': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dropdown-keluar': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
        },
      },
      animation: {
        'dropdown-masuk': 'dropdown-masuk 160ms ease-out',
        'dropdown-keluar': 'dropdown-keluar 140ms ease-in forwards',
      },
    },
  },
  plugins: [],
}
