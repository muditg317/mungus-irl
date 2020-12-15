const { globals, socketRemoteIP } = require('../../utils');
const User = require('../../models/User');

const playerIO = require('./player');
const taskIO = require('./task');

module.exports = (rootIO, gameRooms) => {
  gameRooms.use((socket, next) => {
    try {
      console.log(`SOCKET-GAME-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
      switch (socket.handshake.query.clientType) {
        case "PLAYER":
          playerIO.use(socket, next);
          break;
        case "TASK":
          taskIO.use(socket, next);
          break;
        default:
          const err = new Error(`Invalid Client Type |${socket.handshake.query.clientType}|!`);
          err.data = { content: "You must be a player or task" }; // additional details
          return next(err);
      }
    } catch (error) {
      console.log("UNEXPECTED ERROR");
      console.error(error);
      const err = new Error("Unexpected server error");
      err.data = { content: "Contact Mudit for help" };
      return next(err);
    }
  });

  gameRooms.on('connection', socket => {
    socket.send("hello");
    console.log(`game connection ${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
    try {
      switch (socket.handshake.query.clientType) {
        case "PLAYER":
          playerIO.onConnection(socket);
          break;
        case "TASK":
          taskIO.onConnection(socket);
          break;
        default:
          socket.volatile.emit("error", "must specify clientType");
          return socket.disconnect(true);
      }
    } catch (error) {
      console.error(error);
      socket.volatile.emit("error", "internal error");
      socket.disconnect(true);
    } finally {

    }
  });
};
