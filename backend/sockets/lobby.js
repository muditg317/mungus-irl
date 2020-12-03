const lobbyController = require('../controllers/lobbyController');
const User = require('../models/User');
const Task = require('../models/Task');
const { globals, verifyJWTtoken, socketRemoteIP } = require('../utils');
const { MONGOOSE_READ_TIMEOUT } = require('../config/env');

module.exports = (rootIO, lobbyIO) => {
  lobbyIO.use((socket, next) => {
    console.log(`SOCKET-LOBBY: ${socket.id}|${socketRemoteIP(socket)}`);
    // console.log("socket.request.connection",require('util').inspect(socket.request.connection, { depth: null }));
    // console.log("socket.conn.transport",require('util').inspect(socket.conn.transport, { depth: null }));

    next();
  });

  lobbyIO.on("connection", async (socket) => {
    console.log(`new user joined lobby: ${socket.id}`);

    //TODO: socket join lobby room within lobby namespace (for easier broadcasting)
    socket.join("lobby");

    socket.on("test", data => {
      console.log("test received:", data);
    });

    socket.on("createGame", async (data, callback) => {
      if (data.authenticated) {
        try {
          const game = await lobbyController.createGame(rootIO, lobbyIO, socket, data.token);
          // have the socket join the room they've just created.
          await lobbyController.joinGame(rootIO, lobbyIO, socket, callback, game.hostname, game.passcode, game.hostname);
        } catch (error) {
          console.error(error);
          callback && callback({code: "ERROR", message: `${error.name}: ${error.message}`});
        }
      }
    });

    socket.on("joinGame", async (data, callback) => {
      try {
        const { hostname, passcode, username } = data;
        if (!globals.games[hostname])
          throw new Error("Invalid game host!");
        await lobbyController.joinGame(rootIO, lobbyIO, socket, callback, hostname, passcode, username);
      } catch (error) {
        console.error(error);
        callback && callback({code: "ERROR", message: `${error.name}: ${error.message}`});
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`SOCKET-LOBBY EXIT (${reason}): ${socket.id}`);
      //TODO: socket leave lobby
      socket.leave("lobby");
    });

    try {
      // let games = await Game.findByStarted(false).select("hostname").maxTime(MONGOOSE_READ_TIMEOUT);
      // console.log("available games", games);
      // const hostnames = await Promise.all(games.map(async (game) => {
      //   let host = await User.findById(game.hostname, "username").exec();
      //   return host.username;
      // }));
      const availableGames = Object.keys(globals.games).filter(hostname => !globals.games[hostname].started).map(hostname => globals.games[hostname].getPublicData());
      // const hostnames = availableGames.map(game => game.hostname);
      socket.emit("games", {games: availableGames});
    } catch (error) {
      console.error(error);
      socket.volatile.emit("error", "failed to access database");
      socket.disconnect(true);
    } finally {

    }
  });
};
