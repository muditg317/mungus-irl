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
        '124': '31rem'
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
      maxHeight: {
        '1/2': '50%',
        '124': '31rem'
      },
      maxWidth: {
        '1/2': '50%'
      },
      minHeight: {
        fit: 'fit-content'
      },
      minWidth: {
        fit: 'fit-content'
      },
      screens: {
        'print': {'raw': 'print'},
      },
      width: {
        fill: '-webkit-fill-available',
        fit: 'fit-content'
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
      margin: ['first', 'last'],
      padding: ['first', 'last'],
      textColor: ['odd'],
    }
  },
};
