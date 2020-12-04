const { socketRemoteIP } = require('../utils');

const debugSockets = require('./debug');
const lobbySockets = require('./lobby');
const gameSockets = require('./game');

module.exports = (io) => {
  io.use((socket, next) => {
    console.log(`SOCKET-ROOT: ${socket.id}|${socketRemoteIP(socket)}`);
    next();
  });
  io.on("connection", socket => {
    console.log(`SOCKET-ROOT-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
  });

  const debugIO = io.of('/debug');
  debugSockets(io, debugIO);

  const lobbyIO = io.of('/lobby');
  lobbySockets(io, lobbyIO);

  const gameIO = io.of(/^\/game\/[\w\d]+$/);
  gameSockets(io, gameIO);


  const fallbackIO = io.of(/.*/g);
  fallbackIO.on("connection", socket => {
    console.log(`SOCKET-FALLBACK-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
  });
};
