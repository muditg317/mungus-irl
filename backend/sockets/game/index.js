const { globals, socketRemoteIP } = require('../../utils');
const User = require('../../models/User');

module.exports = (rootIO, gameRooms) => {
  gameRooms.use((socket, next) => {
    console.log(`SOCKET-GAME-${socket.nsp.name}: ${socket.id}|${socketRemoteIP(socket)}`);
    const hostname = socket.nsp.hostname || socket.nsp.name.substring(6);
    if (!globals.games[hostname]) {
      const err = new Error("Invalid game host!");
      err.data = { content: "You must use the host's exact username to join" }; // additional details
      return next(err);
    }
    // console.log(require('util').inspect(socket.handshake.query, { depth: null }));
    const gameToken = socket.handshake.query.gameToken;
    if (globals.games[hostname].gameToken !== gameToken) {
      // console.log("GAMET:",globals.games[hostname].gameToken);
      // console.log("USERT:",gameToken);
      const err = new Error("Invalid game token!");
      err.data = { content: "Please try to rejoin the game" }; // additional details
      return next(err);
    }
    const username = socket.handshake.query.username;
    if (!globals.games[hostname].players.map(player => player.username).includes(username)) {
      const err = new Error("Invalid username!");
      err.data = { content: "Please try to rejoin the game" }; // additional details
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
  });

  // gameRooms.on("connection", socket => {
  //   console.log(`new user joined game: ${socket.id}`);
  //
  //   socket.on("joinGame", async (data) => {
  //     const { gameID } = data;
  //     console.log(`user joining game: ${gameID}`);
  //   });
  //
  //   socket.on("disconnect", (reason) => {
  //     console.log(`Client disconnected (${reason}):\n\t- Leaving game:${socket.id}`);
  //   });
  // });


  gameRooms.on('connection', socket => {
    const gameRoomIO = socket.nsp;
    const hostname = gameRoomIO.hostname = gameRoomIO.hostname || socket.nsp.name.substring(6);
    const username = socket.handshake.query.username;
    console.log(`new user(${username}) joined game ${hostname}: ${socket.id}`);
    const game = globals.games[hostname];

    try {
      let socketSuccess = game.registerPlayerSocket(username, socket);
      if (!socketSuccess) {
        throw new Error("Failed to register socket");
      }
      console.log("socketSuccess!",socket.id);
    } catch (error) {
      console.error(error);
      socket.volatile.emit("error", "failed to register socket");
      return socket.disconnect(true);
    } finally {

    }

    socket.on("pingus", (data, ack) => {
      ack(data.time);
    });

    socket.emit("gameData", { game: game.getPrivateData() });
    // gameRoomIO.emit('playerJoin', socket);
  });

};
