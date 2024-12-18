/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "mainBackgroundColor": "#0D1117",
        "columnBackgroundColor": "#161C22",
        "rowTitleBackgroundColor": "#1a2128",
      },
    },
  },
  plugins: [
    typography
  ],
}

