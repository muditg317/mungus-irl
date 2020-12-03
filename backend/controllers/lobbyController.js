const User = require('../models/User');
const Game = require('../models/custom/Game');
const Task = require('../models/Task');
const { globals, verifyJWTtoken, randStr } = require('../utils');
const { MONGOOSE_READ_TIMEOUT } = require('../config/env');

module.exports = {
  createGame: async (rootIO, lobbyIO, socket, jwtToken) => {
    console.log("create game - token:", jwtToken);
    let { id, username } = verifyJWTtoken(jwtToken.slice(jwtToken.indexOf(' ')+1));
    if (globals.games[username])
      throw new Error(`Game already hosted by user ${username}`);
    let user = await User.findById(id).maxTime(MONGOOSE_READ_TIMEOUT);
    if (!user)
      throw new Error("Need account to host!");
    let tasks = await Promise.all(user.tasks.map(async (taskID) => {
      const task = await Task.findById(taskID).maxTime(MONGOOSE_READ_TIMEOUT);
      delete task.id;
      // task.
      // TODO: ^ add fields about completion and stuff or something
    }));
    const game = new Game({ rootIO, hostname: user.username, tasks });
    globals.games[game.hostname] = game;
    socket.to("lobby").emit("newGame", { game: game.getPublicData() });
    return game;
  },
  joinGame: async (rootIO, lobbyIO, socket, callback, hostname, passcode, username) => {
    if (!globals.games[hostname])
      throw new Error(`No game hosted by ${hostname}!`);
    const game = globals.games[hostname];
    if (game.passcode !== passcode)
      throw new Error("Wrong passcode!");
    const existingPlayer = game.players.find(_player => _player.username === username);
    if (existingPlayer && (existingPlayer.active || existingPlayer.wasActive)) {
      throw new Error(`${username} is already in the game!`);
    } else if (!existingPlayer) {
      game.addPlayer({socket, username});
    }
    callback({code: "SUCCESS", message: `Joined game!`, data: game.getPublicData()});
  }
}
