module.exports = {
  important: 'body>div#root',
  purge: [
    './src/components/**/*.jsx',
    './src/assets/styles/**/*.css'
  ],
  theme: {
    extend: {
      inset: {
        half: '50%',
        full: '100%',
      },
      height: {
        fill: '-webkit-fill-available',
      },
      zIndex: {
        '-10': '-10',
      },
    },
  },
};
