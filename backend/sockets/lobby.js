const { MONGOOSE_READ_TIMEOUT } = require('../config/env');
const User = require('../models/User');
const Game = require('../models/Game');

module.exports = (rootIO, lobbyIO) => {
  lobbyIO.use((socket, next) => {
    console.log(`\tLOBBY: ${socket.id}`);
    next();
  });

  lobbyIO.on("connection", async (socket) => {
    console.log(`new user joined lobby: ${socket.id}`);

    socket.on("test", data => {
      console.log("test received:", data);
    });

    socket.on("joinGame", async (data) => {
      const { gameID } = data;
      console.log(`user joining game: ${gameID}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected (${reason}):\n\t- Leaving lobby:${socket.id}`);
    });

    try {
      let games = await Game.findByStarted(false).select("host").maxTime(MONGOOSE_READ_TIMEOUT);
      console.log("available games", games);
      const hostnames = await Promise.all(games.map(async (game) => {
        let host = await User.findById(game.host, "username").exec();
        return host.username;
      }));
      socket.emit("hosts", {hosts: hostnames});
    } catch (error) {
      console.error(error);
      socket.volatile.emit("error", "failed to access database");
      socket.disconnect(true);
    } finally {

    }
  });
};
