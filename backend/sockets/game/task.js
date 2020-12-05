const { globals, socketRemoteIP } = require('../../utils');
// const User = require('../../models/User');

module.exports = {
  use: (socket, next) => {
    console.log(`SOCKET-GAME-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
    const hostname = socket.nsp.hostname || socket.nsp.name.substring(6);
    if (!globals.games[hostname]) {
      const err = new Error("Invalid game host!");
      err.data = { content: "You must use the host's exact username to join" };
      return next(err);
    }

    socket.nsp.hostname = hostname;
    let socketSuccess = globals.games[hostname].registerPlayerSocket(username, socket);
    if (!socketSuccess) {
      const err = new Error("Failed to register player in game");
      err.data = { content: "Illegal request to join" };
      return next(err);
    }
    console.log(`SOCKET-GAME-${socket.nsp.hostname}|SUCCESS: ${socket.id}|${socketRemoteIP(socket)}`);
    next();
  },
  onConnection: (socket) => {
    const gameRoomIO = socket.nsp;
    const hostname = gameRoomIO.hostname = gameRoomIO.hostname || socket.nsp.name.substring(6);

  }
};
