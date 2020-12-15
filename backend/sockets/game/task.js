const { globals, socketRemoteIP } = require('../../utils');
// const User = require('../../models/User');

module.exports = {
  use: (socket, next) => {
    console.log(`SOCKET-GAME-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
    const gameIndex = socket.nsp.gameIndex || socket.nsp.name.substring(6);
    if (!globals.games[gameIndex]) {
      const err = new Error("Invalid game host!");
      err.data = { content: "You must use the host's exact username to join" };
      return next(err);
    }

    socket.nsp.gameIndex = gameIndex;
    let socketSuccess = globals.games[gameIndex].registerPlayerSocket(username, socket);
    if (!socketSuccess) {
      const err = new Error("Failed to register player in game");
      err.data = { content: "Illegal request to join" };
      return next(err);
    }
    console.log(`SOCKET-GAME-${socket.nsp.gameIndex}|SUCCESS: ${socket.id}|${socketRemoteIP(socket)}`);
    next();
  },
  onConnection: (socket) => {
    const gameRoomIO = socket.nsp;
    const gameIndex = gameRoomIO.gameIndex = gameRoomIO.gameIndex || socket.nsp.name.substring(6);

  }
};
