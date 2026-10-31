/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F5F4FF',
          content: '#F8F8FF',
          sidebar: '#111B49',
          card: '#FFFFFF',
          cardSecondary: '#F9F8FF',
          input: '#F5F5FC',
          hover: '#F0EEFF',
        },
        brand: {
          purple: '#6546E8',
          electricPurple: '#7653F5',
          blue: '#3568F5',
          electricBlue: '#477BFF',
          lavender: '#EDE9FF',
          softPurple: '#F2EEFF',
          softBlue: '#EDF3FF',
        },
        typo: {
          primary: '#171B3D',
          secondary: '#68708D',
          muted: '#9299AF',
          sidebar: '#F7F7FF',
          mutedSidebar: '#A9B3D5',
        },
        border: {
          card: '#EAE8F5',
          input: '#E5E3F0',
          divider: '#ECEAF5',
        },
        status: {
          healthy: '#20B486',
          healthyBg: '#E8F8F2',
          healthyBorder: '#A3EAD2',
          warning: '#F3A43B',
          warningBg: '#FEF6EB',
          warningBorder: '#FBD9A4',
          critical: '#E85D70',
          criticalBg: '#FDEDF0',
          criticalBorder: '#F9B6C1',
          info: '#4387EF',
          infoBg: '#EDF3FF',
          infoBorder: '#B5D1FC',
        },
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        subtle: '0px 4px 18px rgba(38, 35, 90, 0.045)',
        card: '0px 2px 12px rgba(38, 35, 90, 0.04)',
        hover: '0px 8px 24px rgba(73, 109, 245, 0.08)',
        modal: '0px 16px 36px rgba(17, 27, 73, 0.16)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(110deg, #496DF5 0%, #7650E9 100%)',
        'soft-gradient': 'linear-gradient(135deg, #F0EDFF 0%, #EDF3FF 100%)',
        'subtle-pulse': 'radial-gradient(circle at top right, #EDE9FF 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}

