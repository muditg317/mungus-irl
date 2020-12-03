module.exports = {
  important: 'body>div#root',
  purge: [
    './src/components/**/*.jsx',
    './src/assets/styles/**/*.css'
  ],
  theme: {
    extend: {
      animation: {
        jiggle: 'jiggle 0.2s ease-in-out infinite',
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      },
      height: {
        fill: '-webkit-fill-available',
      },
      inset: {
        half: '50%',
        full: '100%',
      },
      keyframes: {
        jiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        }
      },
      zIndex: {
        '-10': '-10',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['odd'],
      borderRadius: ['first', 'last'],
      display: ['group-hover'],
      textColor: ['odd'],
    }
  },
};
