/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        elegant: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      colors: {
        rose: {
          50: '#fdf5f5',
          100: '#fce8e8',
          200: '#f9d4d4',
          300: '#f4b4b4',
          400: '#ec8888',
          500: '#e05d5d',
          600: '#cc4040',
          700: '#ac3232',
          800: '#8f2d2d',
          900: '#772b2b',
          950: '#411212',
        },
        champagne: '#f5ebe0',
        cream: '#faf7f2',
        noir: '#1a1a1a',
        charcoal: {
          DEFAULT: '#2d2d2d',
          600: '#4a4a4a',
          700: '#3d3d3d',
          800: '#2d2d2d',
          900: '#1a1a1a',
        },
        amber: {
          700: '#b45309',
          800: '#92400e',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'luxury-pattern': 'linear-gradient(135deg, #faf7f2 0%, #f5ebe0 50%, #fce8e8 100%)',
      },
    },
  },
  plugins: [],
};
