/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores principales de Cusco Smile
        'smile_50': '#E8F8F5',
        'smile_100': '#C1EDE5',
        'smile_200': '#9AE2D5',
        'smile_300': '#73D7C5',
        'smile_400': '#6DCFBC',
        'smile_500': '#5DBEAB',
        'smile_600': '#4AA896',
        'smile_700': '#3D8B7A',
        'smile_800': '#2F6D5F',
        'smile_900': '#1F4840',
      },
    },
  },
  plugins: [],
}
