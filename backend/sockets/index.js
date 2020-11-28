const lobbySockets = require('./lobby');
const gameSockets = require('./game');

module.exports = (io) => {
  io.use((socket, next) => {
    console.log(`SOCKET: ${socket.id}`);
    next();
  });

  lobbyIO = io.of('/lobby');
  lobbySockets(io, lobbyIO);

  gameIO = io.of('/game');
  gameSockets(io, gameIO);
};
