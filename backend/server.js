const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const http = require("http");
const socketIo = require("socket.io");
const app = express();
require('./database');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

require('./config/passport')(passport);

app.use(function(req, res, next) {
  console.log("REQUEST AT", req.protocol + "://" + req.get('host') + req.originalUrl, " -- METHOD", req.method, " -- AUTH", (req.headers.authorization || "").substring(0,20));
  next();
});

const routes = require('./routes');
app.use(routes);

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, '../frontend/build'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  console.log(require('util').inspect(socket, { depth: null }));

  socket.on('verification_request', data => {
    console.log(data);
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    console.log(require('util').inspect(socket, { depth: null }));
  });
});
