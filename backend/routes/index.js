const router = require('express').Router();

module.exports = (app, server, io) => {
  require('./api')(router, app, server, io);
  app.use(router);
}
