/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'], mono: ['DM Mono', 'monospace'] },
      colors: {
        blue: { DEFAULT: '#378ADD', light: '#E6F1FB', dark: '#0C447C' },
        indigo: { DEFAULT: '#534AB7', light: '#EEEDFE', dark: '#3C3489' },
        teal: { DEFAULT: '#1D9E75', light: '#E1F5EE' },
        coral: { DEFAULT: '#D85A30', light: '#FAECE7' },
        amber: { DEFAULT: '#BA7517', light: '#FAEEDA' },
        surface: '#FAFAF8',
        card: '#FFFFFF',
        'gray-100': '#F1EFE8',
        'gray-200': '#D3D1C7',
        'gray-400': '#888780',
        'gray-600': '#5F5E5A',
        ink: '#1A1A18',
      },
      borderRadius: { xl: '20px', '2xl': '28px', '3xl': '44px' },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'toast-in': 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        slideUp: { from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        toastIn: { from: { opacity: '0', transform: 'translateX(-50%) translateY(-16px) scale(0.94)' }, to: { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' } },
      },
    },
  },
  plugins: [],
}
