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
  setInterval(() => {
    console.log("GAME INFO:");
    console.log(require('util').inspect(globals.games, { depth: 4 }));
  }, 30000);
}

/* SHOULD BE FOR HOSTS ONLY
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
*/

//const games = {};
// games.push({
//   od: "fsgrgRE",
//   taskSocket: [],
//   host: "host_username",
// })


/*
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  // console.log(require('util').inspect(socket, { depth: 1 }));
// if socket is a player {
//   socket.on(stast task, () => {
//     tasksocket.sendmessage(play is doing you);
//   })
// }
// if socket is task {
//   add to tasksockets
// }
  socket.on('message', data => {
    // if data.type === STAST TASK)
    //   tasksockets[data.taskID].send(message, data);
    console.log(data);
  })
*/

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
