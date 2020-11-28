const express = require('express');
// const session = require("express-session");
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const http = require("http");
const socketIO = require("socket.io");
const { PORT: ENV_PORT } = require('./config/env');

const app = express();
const server = http.createServer(app);
const PORT = ENV_PORT || 8080;
const io = socketIO(server);
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
  console.log("REQUEST AT", req.protocol + "://" + req.get('host') + req.originalUrl, "\n\t-- METHOD:", req.method, "\n\t-- AUTH:", (req.headers.authorization || "no auth").substring(0,20));
  next();
});

require('./routes')(app, server, io);

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.games = {};
require('./sockets')(io);



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

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected", socket.id);
    // console.log(require('util').inspect(socket, { depth: 1 }));
  });

  socket.emit("connection", "hello");

  let int;
  let count = 5;
  int = setInterval(() => {
    socket.emit("message", {count: count*100 });
    count -= 1;
    if (count == 0) {
      clearInterval(int);
    }
  }, 1000);

});

io.of('/lobby').on("connection", (socket) => {
  console.log("New client connected TO LOBBY", socket.id);
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

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected", socket.id);
    // console.log(require('util').inspect(socket, { depth: 1 }));
  });

  socket.emit("connection", {yeet:5});

  let int;
  let count = 8;
  int = setInterval(() => {
    socket.emit("message", {loc:"lobby", count: count*100 });
    count -= 1;
    if (count == 0) {
      clearInterval(int);
    }
  }, 1500);

});
*/

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
