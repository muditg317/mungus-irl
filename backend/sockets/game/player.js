const { globals, socketRemoteIP, verifyJWTtoken } = require('../../utils');
const { MONGOOSE_READ_TIMEOUT } = require('../../config/env');
const User = require('../../models/User');

module.exports = {
  use: (socket, next) => {
    try {
      console.log(`SOCKET-GAME-${socket.nsp.name}: PLAYER - ${socket.id}|${socketRemoteIP(socket)}`);
      const gameIndex = socket.nsp.gameIndex || socket.nsp.name.substring(6);
      if (!globals.games[gameIndex]) {
        const err = new Error("Invalid game!");
        err.data = { code: "NO GAME", content: "You must use the exact passcode to join" };
        return next(err);
      }
      const gameToken = socket.handshake.query.gameToken;
      if (globals.games[gameIndex].gameToken !== gameToken) {
        const err = new Error("Invalid game token!");
        err.data = { content: "Please try to rejoin the game" };
        return next(err);
      }
      const username = socket.handshake.query.username;
      if (!globals.games[gameIndex].hasPlayer(username)) {
        const err = new Error("Invalid username!");
        err.data = { content: "Please try to rejoin the game" };
        return next(err);
      }
      socket.nsp.gameIndex = gameIndex;
      let socketSuccess = globals.games[gameIndex].registerPlayerSocket(username, socket);
      if (!socketSuccess) {
        const err = new Error("Failed to register player in game");
        err.data = { content: "Illegal request to join" };
        return next(err);
      }
      console.log(`SOCKET-GAME-${socket.nsp.gameIndex}|SUCCESS: PLAYER - ${socket.id}|${socketRemoteIP(socket)}`);
      next();
    } catch (error) {
      console.log("UNEXPECTED ERROR");
      console.error(error);
      const err = new Error("Unexpected server error");
      err.data = { content: "Contact Mudit for help" };
      return next(err);
    }
  },
  onConnection: (socket) => {
    console.log(`game socket connection: ${socket.id}|${socketRemoteIP(socket)}`);
    const gameRoomIO = socket.nsp;
    const gameIndex = gameRoomIO.gameIndex = gameRoomIO.gameIndex || socket.nsp.name.substring(6);
    const username = socket.handshake.query.username;
    const game = globals.games[gameIndex];
    console.log(`new user(${username}) joined game ${gameIndex}: ${socket.id}`);

    try {
      // let socketSuccess = game.registerPlayerSocket(username, socket);
      // if (!socketSuccess) {
      //   throw new Error("Failed to register socket");
      // }
      // console.log("socketSuccess!",socket.id);
    } catch (error) {
      console.error(error);
      socket.volatile.emit("error", "failed to register socket");
      return socket.disconnect(true);
    } finally {

    }

    socket.join("players");
    const player = game.players[username];

    socket.on("pingus", (data, ack) => {
      globals.rootIO.of("/debug").emit(`pingTo${gameRoomIO.name}`, {username, active:player.active||'undefined', was:player.wasActive||'undefined'});
      ack(data.time);
    });

    socket.on("leaveGame", (data, ack) => {
      const { username: leavingUser } = data;
      console.log("leave game request", gameIndex, username, leavingUser);
      if (username !== leavingUser) {
        return;
      }
      const removedPlayer = game.removePlayer(username);
      if (removedPlayer) {
        console.log("player removed");
        gameRoomIO.to("players").emit("playerLeave", { player: removedPlayer.getGamePrivateData() });
        ack && ack();
      }
    });

    socket.on("endGame", async data => {
      if (!data.auth) {
        return false;
      }
      let { id, username: tokenUsername } = verifyJWTtoken(data.auth.token.slice(data.auth.token.indexOf(' ')+1));
      if (tokenUsername !== username) {
        return;//throw new Error("Attempt to join with bad host credentials!");
      }
      if (username !== game.hostname) {
        return;//throw new Error("Attempt to join as host with wrong username!");
      }
      let user = await User.findById(id).maxTime(MONGOOSE_READ_TIMEOUT);
      if (!user)
        return;//throw new Error("Attempt to join with invalid host credentials!");
      game.close();
    })

    socket.on("disconnect", reason => {
      console.log(`SOCKET-GAME-${gameRoomIO.name} EXIT (${reason}): ${socket.id}`);
      game.unregisterPlayerSocket(username);
      // socket.leave("players");
    });

    // console.log({ player: player.getGamePrivateData() });
    // TODO: \/ replace belowwith playerConnect or something??
    // gameRoomIO.to("players").emit("playerJoin", { player: player.getGamePrivateData() });
    socket.emit("gameData", { game: game.getGamePrivateData() });
  }
};
