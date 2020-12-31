const Player = require('./Player');
const { globals, randStr, socketRemoteIP, upperFirstCharOnly } = require('../../utils');
const { NODE_ENV } = require('../../config/env');

const numericRule = (min, max, value, increment = 1) => {
  return {
    type: 'NUMERIC',
    min,
    max,
    value,
    increment
  }
};
const toggleRule = (initialValue) => {
  return {
    type: 'TOGGLE',
    value: initialValue
  }
};
const enumRule = (options, value) => {
  return {
    type: 'ENUM',
    options,
    value
  }
}

const DEFAULT_RULES = {
  '# imposters': numericRule(1,3,2),
  'Confirm Ejects': toggleRule(false),
  '# Emergency Meetings': numericRule(1,3,1),
  'Emergency Cooldown': numericRule(0,60,20,5),
  'Anonymous Votes': toggleRule(false),
  'Voting Time': numericRule(15,150,120,15),
  'Kill Cooldown': numericRule(0,60,25,5),
  'Task Bar Updates': enumRule(["ALWAYS","MEETINGS","NEVER"],"ALWAYS"),
  'Visual Tasks': toggleRule(false),
  'Common Tasks': numericRule(0,2,1),
  'Short Tasks': numericRule(0,5,2),
  'Long Tasks': numericRule(0,3,2)
};

const parseRuleValue = (rule) => {
  switch (rule.type) {
    case 'NUMERIC':
      return rule.value;
    case 'TOGGLE':
      return rule.value ? 'On' : 'Off';
    case 'ENUM':
      return rule.value;
    default:
      return rule.value;
  }
}

module.exports = class Game {
  static RESPONSELESS_PING_THRESHOLD = NODE_ENV === 'development' ? 2 : 2;

  constructor({ hostname, tasks = [], sockets = [], started = false, players = {}, passcode, gameToken } = {}) {
    this.rules = { ...DEFAULT_RULES };
    this.hostname = hostname;
    // this.roomID = randStr(5, 'a0');
    // TODO: add gameIO
    // this.gameRoomIO = globals.rootIO.of(`/game/${hostname}`);
    // TODO: NO! BAD! NEVER MAKE NAMESPACE WITH of() !!!!!!!
    this.tasks = {common: {}, short: {}, long: {}};
    tasks.forEach(task => {
      task.online = !task.physicalDeviceID;
      this.tasks[task.format][task.qrID] = task;
    });
    this.updateTaskRuleLimits();
    this.sockets = sockets;
    this.started = started;
    this.players = players;
    this.passcode = passcode || randStr(5, 'a0');
    this.gameToken = gameToken || randStr(30, 'aA0$');
    this.responselessPings = 0;
    this.pingIntervalID = setInterval(() => {
      this.checkPlayerActivityState();
    }, 5000);
  }

  /**
   * [checkPlayerActivityState description]
   * @return boolean true if any players are active, false otherwise
   */
  checkPlayerActivityState() {
    const responseless = Object.keys(this.players).map(username => {
      const player = this.players[username];
      if (player.socket && player.isUnresponsive()) {
        return !this.unregisterPlayerSocket(username);
      }
      player.wasActive = player.active;
      player.active = player.socket && player.socket.connected;
      // globals.rootIO.of("/debug").emit(`activityCheckAt:${this.getIndexVariable()}`, {username, active:`${player.active}`, was:`${player.wasActive}`});
      return player.wasActive;
    }).every(active => !active);
    (responseless && ++this.responselessPings) || (this.responselessPings = 0);
    if (this.responselessPings >= this.constructor.RESPONSELESS_PING_THRESHOLD) {
      return !this.close();
    }
    if (!responseless) {
      // remove lmao i should be sending live updates not timed updates
      // this.gameRoomIO && this.gameRoomIO.to("players").emit("allPlayersData", { players: this.getPlayerData("GamePrivate") });
    }
    return;
  }

  getIndexVariable() {
    return this.hostname;
  }

  getPlayerUsernames() {
    return Object.keys(this.players);
  }

  getPlayerData(pubPriv) {
    return Object.fromEntries(Object.entries(this.players).map(entry => [entry[0], entry[1][`get${pubPriv}Data`]()]))
  }

  getTasksStatus() {
    const statuses = {};
    Object.values(this.tasks).map(taskSet => {
      Object.values(taskSet).map(task => {
        if (task.physicalDeviceID) {
          statuses[task.taskname] = {online: task.online};
        }
      });
    });
    return statuses;
  }

  getPublicData(fillPlayers = true) {
    const players = fillPlayers ? this.getPlayerData("Public") : this.getPlayerUsernames();
    const rules = Object.fromEntries(Object.entries(this.rules).map(entry => [entry[0], {value: parseRuleValue(entry[1])}]));
    return {hostname: this.hostname, rules, players};
  }

  getGamePrivateData(fillPlayers = true) {
    const publicData = this.getPublicData();
    publicData.players = fillPlayers ? this.getPlayerData("GamePrivate") : this.getPlayerUsernames();
    publicData.tasks = this.getTasksStatus();
    publicData.passcode = this.passcode;
    return publicData;
  }

  getUserPrivateData(username) {
    const privateData = this.getGamePrivateData();
    this.hasPlayer(username) && (privateData.players[username] = this.players[username].getUserPrivateData());
    return privateData;
  }

  getHostData() {
    const userPrivateData = this.getUserPrivateData(this.hostname);
    userPrivateData.rules = this.rules;
    return userPrivateData;
  }

  close() {
    let anySockets = false;
    Object.values(this.players).forEach(player => {
      player.socket && (anySockets = true) && player.socket.disconnect();
    });
    console.log("GAME CLOSE",this.getIndexVariable());
    // anySockets && this.gameRoomIO.emit("gameEnded");
    // TODO: ^ emit ending unnecessary ?? because disconnected
    // TODO: more deletion logic for task sockets?
    delete globals.games[this.getIndexVariable()];
    clearInterval(this.pingIntervalID);
    globals.rootIO.of("/lobby").emit("removeGame", { game:this.getPublicData() });
    return true;
  }

  hasPlayer(username) {
    return username && username in this.players;
  }

  getPlayer(username) {
    return username && (username in this.players) && this.players[username];
  }

  addPlayer({socket, username} = {}) {
    if (this.started || !socket || !username || this.hasPlayer(username)) {
      throw new Error("Invalid player join attempt!");
    }
    const newPlayer = new Player({
      username, socketAddress: socketRemoteIP(socket)
    })
    this.numActivePlayers() && this.sendPlayerUpdate(newPlayer, "playerJoin");
    this.players[username] = newPlayer;
    this.updateImposterLimit();
  }

  updatePlayer({socket, username} = {}) {
    if (!socket || !username || !this.hasPlayer(username)) {
      throw new Error("Invalid player join attempt!");
    }
    const player = this.players[username];
    player.socketAddress = socketRemoteIP(socket);
  }

  registerPlayerSocket(username, socket) {
    // globals.rootIO.of("/debug").emit("debug_info", socket.handshake);
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
    player.socket && player.socket.disconnect();
    player.socket = socket;
    player.socketID = socket.id;
    this.gameRoomIO = socket.nsp;
    player.active = socket && socket.connected;
    return true;
  }

  unregisterPlayerSocket(username) {
    if (!this.hasPlayer(username)) {
      console.log("player unregister fail -- username not found");
      console.log("\t", username, "|", this.getPlayerUsernames());
      return false;
    }
    const player = this.players[username];
    console.log("player unregister success -- \n\t", username, "|", player.username);
    player.socket && player.socket.disconnect();
    delete player.socket;
    delete player.socketID;
    player.active = false;
    this.setReadyState(player, false);
    if (!this.numActivePlayers()) {
      console.log(`CLOSE GAME: ${this.getIndexVariable()}| -- all players gone`);
      this.close();
    }
    this.sendPlayerUpdate(player);
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
    !this.started && this.updateImposterLimit();
    return player;
  }

  sendPlayerUpdate(player, eventName = "playerInfo") {
    this.gameRoomIO && this.gameRoomIO.to("players").emit(eventName, { player: player.getGamePrivateData() });
  }

  numActivePlayers() {
    return Object.values(this.players).filter(player => player.isActive({strict:true})).length;
  }

  setReadyState(player, ready) {
    if (player !== this.players[player.username]) {
      throw new Error("Invalid player ready state update!");
    }
    // console.log('set player ready:',player.username,"|",ready);
    player.ready = ready;
    this.sendPlayerUpdate(player);
  }

  emitRuleUpdate(ruleName) {
    const rule = this.rules[ruleName];
    this.gameRoomIO && this.gameRoomIO.to("nonHostPlayers").emit("ruleUpdate", {ruleName, rule:{value:parseRuleValue(rule)}});
    this.gameRoomIO && this.gameRoomIO.to("host").emit("ruleUpdate", {ruleName, rule});
  }

  updateImposterLimit() {
    const ruleName = '# imposters';
    const rule = this.rules[ruleName];
    rule.max = Math.floor(Object.keys(this.players).length / 3) || 1;
    rule.value = Math.min(Math.max(rule.value, rule.min), rule.max);
    this.emitRuleUpdate(ruleName);
  }

  updateTaskRuleLimits() {
    ['common', 'short', 'long'].forEach(format => {
      const ruleName = upperFirstCharOnly(format) + " Tasks";
      const rule = this.rules[ruleName];
      rule.max = Math.min(rule.max, this.tasks[format].length);
      rule.value = Math.min(Math.max(rule.value, rule.min), rule.max);
      this.emitRuleUpdate(ruleName);
    });
  }

  updateRule(ruleName, newValue) {
    const rule = this.rules[ruleName];
    const oldValue = rule.value;
    // console.log('updating rule', ruleName, oldValue, newValue);
    // console.log(require('util').inspect(rule, { depth: null }));
    switch (rule.type) {
      case 'NUMERIC':
        if (newValue >= rule.min && newValue <= rule.max) {
          rule.value = newValue;
        }
        break;
      case 'TOGGLE':
        rule.value = newValue;
        break;
      case 'ENUM':
        if (rule.options.includes(newValue)) {
          rule.value = newValue;
        }
      default:
        break;
    }
    rule.value !== oldValue && this.emitRuleUpdate(ruleName);
  }

  startGame() {
    this.started = true;
    const commonTaskCount = this.rules['Common Tasks'].value;
    const shortTaskCount = this.rules['Short Tasks'].value;
    const longTaskCount = this.rules['Long Tasks'].value;
    const tasksPerPlayer = commonTaskCount + shortTaskCount + longTaskCount;
    this.numPlayers = Object.keys(this.players).length;
    this.totalTaskCount = tasksPerPlayer * this.numPlayers;
    Object.values(this.players).forEach(player => {
      player.assignedTasks = [];

    });
  }
}
