const apiRouter = require('express').Router();

module.exports = (router, app, server, io) => {
  require('./users')(apiRouter, app, server, io);
  router.use('/api', apiRouter);
}
