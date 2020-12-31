const User = require('../models/User');
const Game = require('../models/custom/Game');
const Task = require('../models/Task');
const { globals, verifyJWTtoken, randStr, socketRemoteIP, fieldsFromObject } = require('../utils');
const { MONGOOSE_READ_TIMEOUT } = require('../config/env');

module.exports = {
  createGame: async (rootIO, lobbyIO, socket, jwtToken) => {
    console.log("create game - token:", jwtToken);
    let { id, username } = verifyJWTtoken(jwtToken.slice(jwtToken.indexOf(' ')+1));
    while (globals.games[username])
      if (globals.games[username].checkPlayerActivityState())
        throw new Error(`Game already hosted by user ${username}`);
    let user = await User.findById(id).maxTime(MONGOOSE_READ_TIMEOUT);
    if (!user)
      throw new Error("Need account to host!");
    let tasks = await Promise.all(user.tasks.map(async (taskID) => {
      const task = await Task.findById(taskID).maxTime(MONGOOSE_READ_TIMEOUT);
      // delete task.id;
      // console.log(task);
      // console.log(task.toObject());
      const taskData = task;//fieldsFromObject(task, Object.keys(Task.schema.paths));
      delete taskData.createdBy;
      delete taskData.createdAt;
      delete taskData.updatedBy;
      delete taskData.updatedAt;
      delete taskData.meta;
      delete taskData._id;
      delete taskData.__v;
      return taskData;
      // task.
      // TODO: ^ add fields about completion and stuff or something
    }));
    const game = new Game({ rootIO, hostname: user.username, tasks });
    globals.games[game.getIndexVariable()] = game;
    socket.to("lobby").emit("newGame", { game: game.getPublicData(false) });
    return game;
  },
  joinGame: async (rootIO, lobbyIO, socket, callback, gameIndex, passcode, username) => {
    if (!globals.games[gameIndex])
      throw new Error(`No game with id ${gameIndex}!`);
    username = username.trim && username.trim();
    if (!username || !username.length) {
      throw new Error("Invalid username");
    }
    const game = globals.games[gameIndex];
    const existingPlayer = game.getPlayer(username);
    let speedyRejoin = false;
    // TODO: do i still want ignore case??
    if (!passcode || (typeof passcode === "string" && game.passcode !== passcode.toLowerCase()))
      throw new Error("Wrong passcode!");
    // else if (typeof passcode === "object" && passcode.asHost) {
    //   console.log("attempt speedy rejoin!", "host");
    //   speedyRejoin = true;
    //   let { id, username: tokenUsername } = verifyJWTtoken(passcode.asHost.token.slice(passcode.asHost.token.indexOf(' ')+1));
    //   if (tokenUsername !== username) {
    //     throw new Error("Attempt to join with bad host credentials!");
    //   }
    //   if (username !== game.hostname) {
    //     throw new Error("Attempt to join as host with wrong username!");
    //   }
    //   let user = await User.findById(id).maxTime(MONGOOSE_READ_TIMEOUT);
    //   if (!user)
    //     throw new Error("Attempt to join with invalid host credentials!");
    // } else if (typeof passcode === "object" && passcode.rejoining && existingPlayer) {
    //   console.log("attempt speedy rejoin!", existingPlayer && {...existingPlayer, socket:existingPlayer.socket?'socket':'none'});
    //   speedyRejoin = true;
    //   if (existingPlayer.socket && existingPlayer.socketAddress !== socketRemoteIP(socket)) {
    //     if (existingPlayer.socket.connected) {
    //       throw new Error("Attempt speedy rejoin game when user already active in game");
    //     }
    //     // TODO: second chance based on network of other players in game
    //   }
    //   if (existingPlayer.isUnresponsive({strict:true})) {
    //     throw new Error("Attempt speedy rejoin game when user has been inactive in game");
    //   }
    // }
    console.log(`trying to join with existing player u:${username}|player:${existingPlayer}|list:${game.getPlayerUsernames()}|`);
    if (existingPlayer && (existingPlayer.isActive({loose:true})) && !speedyRejoin) {
      throw new Error(`${username} is already in the game!`);
    } else if (existingPlayer) {
      console.log("update player");
      game.updatePlayer({socket, username});
    } else {
      console.log("add player")
      game.addPlayer({socket, username});
    }
    callback({ code: "SUCCESS", message: `Joined game!`, data: { ...game.getPublicData(), gameToken: game.gameToken } });
  }
}
