const express = require('express');
// const session = require("express-session");
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs')
const passport = require('passport');
const http = require("http");
const socketIO = require("socket.io");
const { PORT: ENV_PORT, NODE_ENV = 'development' } = require('./config/env');
const { globals } = require('./utils');

const app = express();
const serverCertOpts = {};
if (NODE_ENV === 'development') {
  // serverCertOpts.key = fs.readFileSync(path.resolve('../ssl-certs/key.pem')).toString();
  // serverCertOpts.cert = fs.readFileSync(path.resolve('../ssl-certs/cert.pem')).toString();
  // serverCertOpts.requestCert = false;
  // serverCertOpts.rejectUnauthorized = false;
  // console.log(serverCertOpts);
}
const socketIOopts = {
  // pingInterval: 5000
};
const server = http.createServer(serverCertOpts, app);
const PORT = ENV_PORT || 8080;
const io = socketIO(server, socketIOopts);
require('./database');

// const sessionMiddleware = session({ secret: SECRET_OR_KEY, resave: false, saveUninitialized: false });
// app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());
// app.use(passport.session());

require('./config/passport')(passport);

app.use(function(req, res, next) {
  console.log(`${req.method} -- ${req.protocol}://${req.get('host')}${req.originalUrl} \n\t-- AUTH: ${(req.headers.authorization || "no auth").substring(0,20)}`);
  next();
});

require('./routes')(app, server, io);

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

globals.games = {};
globals.rootIO = io;
require('./sockets')(io);

if (NODE_ENV !== 'development') {
  // setInterval(() => {
  //   console.log("GAME INFO:");
  //   console.log(require('util').inspect(globals.games, { depth: 2 }));
  // }, 30000);
  // setInterval(() => {
  //   console.log("IO info");
  //   console.log(Object.keys(io.sockets.sockets));
  //   io._nsps.forEach(nsp => {
  //     nsp.sockets.forEach(socket => {
  //       console.log(`socket at |${nsp.name}|: id:${socket.id}|`);
  //     });
  //   });
  // }, 30000);
}

/* SHOULD BE FOR HOSTS ONLY
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
*/

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
