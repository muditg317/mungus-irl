const Player = require('./Player');
const { globals, randStr, socketRemoteIP } = require('../../utils');
const { NODE_ENV } = require('../../config/env');

module.exports = class Game {
  static RESPONSELESS_PING_THRESHOLD = NODE_ENV === 'development' ? 10 : 20; // TODO: 20

  constructor({ hostname, tasks, sockets, started, players, passcode, gameToken } = {}) {
    this.hostname = hostname;
    // TODO: add gameIO
    this.tasks = tasks || [];
    this.sockets = sockets || [];
    this.started = started || false;
    this.players = players || {};
    this.passcode = passcode || randStr(5, 'a0');
    this.gameToken = gameToken || randStr(30, 'aA0$');
    this.responselessPings = 0;
    this.pingIntervalID = setInterval(() => {
      const responseless = Object.keys(this.players).map(username => {
        const player = this.players[username];
        if (player.socket && player.isUnresponsive()) {
          return !this.unregisterPlayerSocket(username);
        }
        player.wasActive = player.active;
        player.active = player.socket && player.socket.connected;
        // TODO: add debug log for activity check
        return player.wasActive;
      }).every(active => !active);
      (responseless && ++this.responselessPings) || (this.responselessPings = 0);
      if (this.responselessPings > this.constructor.RESPONSELESS_PING_THRESHOLD) {
        this.close();
      }
      // TODO: add gameroomio emit player data
    }, 5000);
  }

  getPlayerUsernames() {
    return Object.keys(this.players);
  }

  getPlayerData(pubPriv) {
    return Object.fromEntries(Object.entries(this.players).map(entry => [entry[0], entry[1][`get${pubPriv}Data`]()]))
  }

  getPublicData(fillPlayers = true) {
    const players = fillPlayers ? this.getPlayerData("Public") : this.getPlayerUsernames();
    return {hostname: this.hostname, players};
  }

  getGamePrivateData(fillPlayers = true) {
    const publicData = this.getPublicData();
    publicData.players = fillPlayers ? this.getPlayerData("GamePrivate") : this.getPlayerUsernames();
    publicData.passcode = this.passcode;
    return publicData;
  }

  getUserPrivateData(username) {
    const privateData = this.getGamePrivateData();
    this.hasPlayer(username) && (privateData.players[username] = this.players[username].getUserPrivateData());
    return privateData;
  }

  close() {
    Object.values(this.players).forEach(player => {
      player.socket && player.socket.disconnect();
    });
    // TODO: emit ending this.gameRoomIO.emit("gameEnded");
    // TODO: more deletion logic for task sockets?
    delete globals.games[this.hostname];
    clearInterval(this.pingIntervalID);
    globals.rootIO.of("/lobby").emit("removeGame", { game:this.getPublicData() });
  }

  hasPlayer(username) {
    return username && username in this.players;
  }

  getPlayer(username) {
    return username && (username in this.players) && this.players[username];
  }

  addPlayer({socket, username} = {}) {
    if (!socket || !username || this.hasPlayer(username)) {
      throw new Error("Invalid player join attempt!");
    }
    const newPlayer = new Player({
      username, socketAddress: socketRemoteIP(socket)
    })
    // TODO: globals.rootIO.of(`/game/${this.hostname}`).emit("playerJoin", newPlayer);
    this.players[username] = newPlayer;
  }

  updatePlayer({socket, username} = {}) {
    if (!socket || !username || !this.hasPlayer(username)) {
      throw new Error("Invalid player join attempt!");
    }
    const player = this.players[username];
    player.socketAddress = socketRemoteIP(socket);
  }

  registerPlayerSocket(username, socket) {
    // TODO: globals.rootIO.of("/debug").emit("debug_info", socket.handshake);
    if (!this.hasPlayer(username)) {
      console.log("player register fail -- username not found");
      console.log("\t", username, "|", player.username);
      return false;
    }
    const player = this.players[username];
    if (player.socketAddress !== socketRemoteIP(socket)) {
      console.log("player register fail -- socket remote address invalid");
      console.log("\t", player.socketAddress, "|", socketRemoteIP(socket));
      return false;
    }
    if (player.isActive({strict:true})) {
      console.log("player register fail -- player already active");
      console.log("\t", player.active, "|", player.wasActive);
      return false;
    }
    console.log("player register success -- \n\t", username, "|", player.username, "\n\t", player.socketAddress, "|", socketRemoteIP(socket), "\n\t", player.active, "|", player.wasActive);
    // TODO:  player.socket && player.socket.disconnect();
    player.socket = socket;
    player.socketID = socket.id;
    // TODO:  player.active = socket && socket.connected;
    return true;
  }

  unregisterPlayerSocket(username) {
    // globals.rootIO.of("/debug").emit("debug_info", socket.handshake);
    if (!this.hasPlayer(username)) {
      console.log("player unregister fail -- username not found");
      console.log("\t", username, "|", this.getPlayerUsernames());
      return false;
    }
    const player = this.players[username];
    console.log("player unregister success -- \n\t", username, "|", player.username);
    // TODO:  player.socket && player.socket.disconnect();
    delete player.socket;
    delete player.socketID;
    // TODO:  player.active = false;
    if (!this.numActivePlayers()) {
      this.close();
    }
    return true;
  }

  removePlayer(username) {
    const player = this.getPlayer(username);
    console.log("removing player", player);
    if (!player) {
      return false;
    }
    // TODO: add more remove logic (unassigning tasks and stuff, close socket)
    delete this.players[username];
    return player;
  }

  numActivePlayers() {
    return Object.values(this.players).filter(player => player.isActive({strict:true})).length;
  }
}
