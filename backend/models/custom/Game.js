const Player = require('./Player');
const { globals, randStr, socketRemoteIP } = require('../../utils');
const { NODE_ENV } = require('../../config/env');

module.exports = class Game {
  static RESPONSELESS_PING_THRESHOLD = NODE_ENV === 'development' ? 10 : 20; // TODO: 20

  constructor({ hostname, tasks, sockets, started, players, passcode, gameToken } = {}) {
    this.hostname = hostname;
    this.tasks = tasks || [];
    this.sockets = sockets || [];
    this.started = started || false;
    this.players = players || [];
    this.passcode = passcode || randStr(5, 'a0');
    this.gameToken = gameToken || randStr(30, 'aA0$');
    this.responselessPings = 0;
    this.pingIntervalID = setInterval(() => {
      const responseless = this.players.map((player, playerIndex) => {
        if (player.wasActive === false && player.active === false) {
          return !this.kickPlayer(player, playerIndex);
        }
        player.wasActive = player.active;
        player.active = player.socket && player.socket.connected;
        return player.wasActive;
      }).every(active => !active);
      (responseless && ++this.responselessPings) || (this.responselessPings = 0);
      if (this.responselessPings > this.constructor.RESPONSELESS_PING_THRESHOLD) {
        this.close();
      }
    }, 5000);
  }

  getPublicData() {
    return {hostname: this.hostname, players: this.players.map(player => player.getPublicData()), gameToken: this.gameToken};
  }

  getPrivateData() {
    return {...this.getPublicData(), passcode: this.passcode};
  }

  close() {
    this.players.forEach(player => {
      player.socket && player.socket.disconnect();
    });
    delete globals.games[this.hostname];
    clearInterval(this.pingIntervalID);
    globals.rootIO.of("/lobby").emit("removeGame", { game:this.getPublicData() });
  }

  addPlayer({socket, username} = {}) {
    if (!socket || !username) {
      throw new Error("Invalid player join attempt!");
    }
    const newPlayer = new Player({
      username, socketAddress: socketRemoteIP(socket)
    })
    // globals.rootIO.of(`/game/${this.hostname}`).emit("playerJoin", newPlayer);
    this.players.push(newPlayer);
  }

  updatePlayer({socket, username} = {}) {
    if (!socket || !username) {
      throw new Error("Invalid player join attempt!");
    }
    const player = this.players.find(_player => _player.username === username);
    player.socketAddress = socketRemoteIP(socket);
  }

  registerPlayerSocket(username, socket) {
    const player = this.players.find(_player => _player.username === username);
    globals.rootIO.of("/debug").emit("debug_info", socket.handshake);
    if (!player) {
      console.log("player register fail -- username not found");
      console.log("\t", username, "|", player.username);
      return false;
    }
    if (player.socketAddress !== socketRemoteIP(socket)) {
      console.log("player register fail -- socket remote address invalid");
      console.log("\t", player.socketAddress, "|", socketRemoteIP(socket));
      return false;
    }
    if (player.active || player.wasActive) {
      console.log("player register fail -- player already active");
      console.log("\t", player.active, "|", player.wasActive);
      return false;
    }
    console.log("player register success -- \n\t", username, "|", player.username, "\n\t", player.socketAddress, "|", socketRemoteIP(socket), "\n\t", player.active, "|", player.wasActive);
    player.socket = socket;
    player.socketID = socket.id;
    return true;
  }

  kickPlayer(player, playerIndex) {
    // if (this.players[playerIndex].username !== player.username) {
    //   playerIndex = this.players.findIndex(_player => _player.username === player.username);
    //   if (playerIndex === -1) {
    //     return false;
    //   }
    // }
    // this.players.splice(playerIndex, 1);
    // player.socket && player.socket.disconnect();
    // return true;
    // TODO: add more kick logic
  }

  numActivePlayers() {
    return this.players.filter(player => player.active).length;
  }
}
