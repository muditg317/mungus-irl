const { globals, socketRemoteIP, verifyJWTtoken } = require('../../utils');
const { MONGOOSE_READ_TIMEOUT } = require('../../config/env');
const User = require('../../models/User');

module.exports = {
  use: async (socket, next) => {
    try {
      console.log(`SOCKET-GAME-${socket.nsp.name}: PLAYER - ${socket.id}|${socketRemoteIP(socket)}`);
      const gameIndex = socket.nsp.gameIndex || socket.nsp.name.substring(6);
      if (!globals.games[gameIndex]) {
        const err = new Error("Invalid game!");
        err.data = { code: "NO GAME", content: "You must use the exact passcode to join" };
        return next(err);
      }
      const game = globals.games[gameIndex];
      const gameToken = socket.handshake.query.gameToken;
      if (game.gameToken !== gameToken) {
        const err = new Error("Invalid game token!");
        err.data = { content: "Please try to rejoin the game" };
        return next(err);
      }
      const username = socket.handshake.query.username;
      if (!game.hasPlayer(username)) {
        const err = new Error("Invalid username!");
        err.data = { content: "Please try to rejoin the game" };
        return next(err);
      }
      socket.nsp.gameIndex = gameIndex;
      let socketSuccess = game.registerPlayerSocket(username, socket);
      if (!socketSuccess) {
        const err = new Error("Failed to register player in game");
        err.data = { content: "Illegal request to join" };
        return next(err);
      }
      if (socket.handshake.query.authenticated) {
        // console.log('has token', socket.handshake.query);
        // console.log(require('util').inspect(socket.handshake.query.authToken, { depth: null }));
        const { token, decoded } = socket.handshake.query;
        let { id, username: tokenUsername } = verifyJWTtoken(token.slice(token.indexOf(' ')+1));
        if (tokenUsername === username && username === game.hostname) {
          let user = await User.findById(id).maxTime(MONGOOSE_READ_TIMEOUT);
          if (user && user.username === tokenUsername)
            game.hostSocketID = socket.id;
            socket.isHost = true;
        }
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
    socket.join("players");
    socket.isHost ? socket.join("host") : socket.join("nonHostPlayers");
    // console.log(`game socket connection: ${socket.id}|${socketRemoteIP(socket)}`);
    const gameRoomIO = socket.nsp;
    const gameIndex = gameRoomIO.gameIndex = gameRoomIO.gameIndex || socket.nsp.name.substring(6);
    const username = socket.handshake.query.username;
    const game = globals.games[gameIndex];
    const player = game.players[username];
    // console.log(`new user(${username}) connected to game ${gameIndex}: ${socket.id}`);


    socket.on("pingus", (data, ack) => {
      // globals.rootIO.of("/debug").emit(`pingTo${gameRoomIO.name}`, {username, active:player.active||'undefined', was:player.wasActive||'undefined'});
      ack(data.time);
    });

    socket.on("leaveGame", (data, ack) => {
      const { username: leavingUser } = data;
      // console.log("leave game request", gameIndex, username, leavingUser);
      if (username !== leavingUser) {
        return;
      }
      const removedPlayer = game.removePlayer(username);
      if (removedPlayer) {
        // console.log("player removed");
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

    socket.onAny((event, ...args) => {
      if (socket.eventNames().includes(event))
        return;
      console.log(`got ${event}`, ...args);
    });

    socket.on("disconnect", reason => {
      console.log(`SOCKET-GAME-${gameRoomIO.name} EXIT (${reason}): PLAYER ${socket.id}`);
      game.unregisterPlayerSocket(username);
      // socket.leave("players");
    });

    socket.on("updateReadyState", data => {
      if (game.started) {
        return;
      }
      const { ready } = data;
      game.setReadyState(player, ready);
    });

    socket.on("killPlayer", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("imposters")) {
        return;
      }
      const { crewmateName } = data;
      player.alive && game.attemptImposterKill(username, crewmateName);
    });

    socket.on("unreadyImposterKill", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("imposters")) {
        return;
      }
      player.alive && game.unreadyImposterKill(username);
    });

    socket.on("iGotKilled", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("crewmates")) {
        return;
      }
      const { username: killedUsername } = data;
      username === killedUsername && game.receiveImposterKill(killedUsername);
    });

    socket.on("reportPlayer", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("alive")) {
        return;
      }
      const { username: bodyName } = data;
      player.alive && username !== bodyName && game.attemptReport(username, bodyName);
    });

    socket.on("unreadyReport", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("alive")) {
        return;
      }
      player.alive && game.unreadyReport(username);
    });

    socket.on("iGotReported", data => {
      if (!game.readyForActions()) {
        return;
      }
      if (!socket.rooms.has("ghosts")) {
        return;
      }
      const { username: reportedUsername } = data;
      username === reportedUsername && game.receiveReport(reportedUsername);
    });


    socket.on("castVote", data => {
      if (!game.inMeeting || game.votingTimer <= 0) {
        return;
      }
      if (!socket.rooms.has("alive")) {
        return;
      }
      const { choice } = data;
      game.castVote(username, choice);
    });


    socket.on("qrScan", data => {
      if (!game.readyForActions()) {
        return;
      }
      const { qrData } = data;
      game.acknowledgeQrScan(username, qrData);
    });

    socket.on("stopMobileTask", data => {
      if (!game.readyForActions()) {
        return;
      }
      const { mobileTask } = data;
      game.stopMobileTask(username, mobileTask);
    });

    socket.on("finishMobileTask", data => {
      if (!game.readyForActions()) {
        return;
      }
      const { mobileTask } = data;
      game.finishMobileTask(username, mobileTask);
    });



    if (socket.isHost) {
      socket.on("updateRule", data => {
        const { ruleName, oldValue, newValue } = data;
        if (ruleName in game.rules) {//} && game.rules[ruleName].value === oldValue) {
          game.updateRule(ruleName, newValue);
        }
      });
      socket.on("startGame", data => {
        !game.started && game.startGame();
      });
      socket.on("resetGame", data => {
        game.started && game.ended && game.resetGame();
      });
    }
    // console.log(socket.isHost ? "SOCKET HOST" : "not host socket");


    // console.log({ player: player.getGamePrivateData() });
    // TODO: \/ replace belowwith playerConnect or something??
    // gameRoomIO.to("players").emit("playerJoin", { player: player.getGamePrivateData() });
    socket.emit("gameData", { game: socket.isHost ? game.getHostData() : game.getUserPrivateData(username) });
  }
};
