/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#103935',
          dark: '#0A2422',
          light: '#E6F0EF',
          mid: '#1D5C56'
        },
        gold: {
          DEFAULT: '#C9973A',
          light: '#FBF3E4'
        },
        page: '#F7F9F8',
        card: '#FFFFFF',
        border: '#E0ECEA',
        'text-primary': '#0A1F1E',
        'text-secondary': '#4A6B69',
        'text-muted': '#8AADAA'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 8px rgba(16,57,53,0.08)',
        'card-hover': '0 8px 24px rgba(16,57,53,0.14)',
        modal: '0 20px 60px rgba(16,57,53,0.18)'
      },
      borderRadius: {
        card: '16px'
      }
    }
  },
  plugins: []
};
