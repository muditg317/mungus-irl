const { socketRemoteIP } = require('../utils');

const debugSockets = require('./debug');
const lobbySockets = require('./lobby');
const gameSockets = require('./game');

module.exports = (io) => {
  io.use((socket, next) => {
    console.log(`SOCKET-ROOT: ${socket.id}|${socketRemoteIP(socket)}`);
    next();
  });

  debugIO = io.of('/debug');
  debugSockets(io, debugIO);

  lobbyIO = io.of('/lobby');
  lobbySockets(io, lobbyIO);

  gameIO = io.of(/^\/game\/[\w\d]+$/);
  gameSockets(io, gameIO);
};
