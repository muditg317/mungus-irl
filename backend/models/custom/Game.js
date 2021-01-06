const Player = require('./Player');
const { globals, randStr, socketRemoteIP, upperFirstCharOnly, getRandomSubarray, clamp, fieldsFromObject } = require('../../utils');
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
  '# Emergency Meetings': numericRule(0,3,1),
  'Emergency Cooldown': numericRule(0,60,20,5),
  'Anonymous Votes': toggleRule(false),
  'Voting Time': numericRule(15,150,120,15),
  'Kill Cooldown': numericRule(5,60,25,5),
  'Task Bar Updates': enumRule(["ALWAYS","MEETINGS","NEVER"],"ALWAYS"),
  'Visual Tasks': toggleRule(false),
  'Common Tasks': numericRule(0,2,1),
  'Short Tasks': numericRule(0,5,2),
  'Long Tasks': numericRule(0,3,2)
};

const parseRuleValue = (rule) => {
  switch (rule.type) {
    case 'NUMERIC':
      return parseInt(rule.value);
    case 'TOGGLE':
      return rule.value ? 'On' : 'Off';
    case 'ENUM':
      return rule.value;
    default:
      return rule.value;
  }
}

const DEFAULT_IMCOMPLETE_TASK = {
  completed: false,
  active: false
};

const POST_VOTING_DELAY = 5000;
const EJECTION_TIME = 5000;

module.exports = class Game {
  static RESPONSELESS_PING_THRESHOLD = NODE_ENV === 'development' ? 2 : 2;

  constructor({ hostname, tasks = [], sockets = [], started = false, ended = false, players = {}, passcode, gameToken } = {}) {
    this.rules = { ...DEFAULT_RULES };
    this.hostname = hostname;
    // this.roomID = randStr(5, 'a0');
    // TODO: add gameIO
    // this.gameRoomIO = globals.rootIO.of(`/game/${hostname}`);
    // TODO: NO! BAD! NEVER MAKE NAMESPACE WITH of() !!!!!!!
    this.tasks = {};
    tasks.forEach(task => {
      task.online = !task.physicalDeviceID;
      task.socket = null;
      task.physicalDeviceID && (task.inUse = false);
      this.tasks[task.qrID] = task;
      // this.tasks[task.format][task.qrID] = task;
    });
    this.updateTaskRuleLimits();
    // this.sockets = sockets;
    this.started = started;
    this.ended = ended;
    this.inMeeting = false;
    this.votes = {};
    this.winners = null;
    this.players = players;
    this.crewmates = {};
    this.imposters = {};
    this.ghosts = {};
    this.passcode = passcode || randStr(5, 'a0');
    this.gameToken = gameToken || randStr(30, 'aA0$');
    this.responselessPings = 0;
    // this.pingIntervalID = setInterval(() => {
    //   this.checkPlayerActivityState();
    // }, 5000);
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
    return Object.fromEntries(Object.entries(this.players).map(entry => [entry[0], entry[1][`get${pubPriv}Data`]()]));
  }

  getPhysicalTasks() {
    const tasks = {};
    Object.values(this.tasks).map(task => {
      // console.log(taskSet);
      // Object.values(taskSet).map(task => {
        if (task.physicalDeviceID) {
          tasks[task.taskname] = task;
        }
      // });
    });
    return tasks;
  }

  getTasksStatus() {
    return Object.fromEntries(Object.entries(this.getPhysicalTasks()).map(entry => [entry[0], {online: entry[1].online}]));
  }

  getPublicTaskInfo(playerTasks) {
    return Object.fromEntries(Object.entries(playerTasks).map(([key,value]) => [
      this.tasks[key].taskname,
      {
        ...value,
        ...fieldsFromObject(this.tasks[key], ['taskname','format'])
      }
    ]));
  }

  getPublicData(fillPlayers = true) {
    const players = fillPlayers ? this.getPlayerData("Public") : this.getPlayerUsernames();
    const rules = Object.fromEntries(Object.entries(this.rules).map(entry => [entry[0], {value: parseRuleValue(entry[1])}]));
    return {hostname: this.hostname, rules, players};
  }

  getGamePrivateData(fillPlayers = true) {
    const publicData = this.getPublicData();
    publicData.players = fillPlayers ? this.getPlayerData("GamePrivate") : this.getPlayerUsernames();
    publicData.tasksStatus = this.getTasksStatus();
    publicData.passcode = this.passcode;
    publicData.started = this.started;
    publicData.ended = this.ended;
    publicData.inMeeting = this.inMeeting;
    publicData.meetingInfo = this.meetingInfo;
    publicData.totalTasks = this.totalTasks;
    publicData.completedTasks = this.completedTasks;
    if (this.inMeeting) {
      if (this.votingTimer <= 0) {
        publicData.votes = this.votes;
        const ejectedPlayer = {name: this.ejectedPlayer};
        if (this.rules["Confirm Ejects"].value) {
          ejectedPlayer.role = this.ejectedPlayer in this.imposters ? "IMPOSTER" : "CREWMATE";
        }
        publicData.ejectedPlayer = ejectedPlayer;
      } else {
        publicData.castedVotes = Object.values(this.players).filter(player => !!player.votingChoice).map(player => player.username);
      }
    }
    if (this.ended) {
       publicData.winners = this.winners;
       publicData.crewmates = Object.keys(this.crewmates);
       publicData.imposters = Object.keys(this.imposters);
    }
    return publicData;
  }

  getUserPrivateData(username) {
    if (this.hasPlayer(username)) {
      const privateData = this.getGamePrivateData();
      const player = this.players[username];
      const userData = privateData.players[username] = player.getUserPrivateData();
      userData.tasks = this.getPublicTaskInfo(player.tasks);
      userData.role = this.started ? (username in this.crewmates ? "CREWMATE" : "IMPOSTER") : "UNSET";
      userData.pendingReport = player.pendingReport;
      if (username in this.imposters) {
        userData.imposters = Object.keys(this.imposters);
        userData.pendingVictim = player.pendingVictim;
        userData.killTimer = player.killTimer;
        userData.victims = player.victims;
      }
      if (this.inMeeting) {
        if (this.votingTimer <= 0) {

        } else {
          privateData.myVote = player.votingChoice;
        }
      }
      return privateData;
    }
  }

  getHostData() {
    const userPrivateData = this.getUserPrivateData(this.hostname);
    userPrivateData.rules = this.rules;
    return userPrivateData;
  }

  close() {
    console.log("GAME CLOSE",this.getIndexVariable());
    this.gameRoomIO && this.gameRoomIO.emit("gameClosed");
    Object.values(this.players).forEach(player => {
      player.socket && player.socket.disconnect();
    });
    Object.values(this.tasks).forEach(task => {
      task.socket && task.socket.disconnect();
    });
    // TODO: more deletion logic for task sockets?
    delete globals.games[this.getIndexVariable()];
    globals.rootIO.of("/lobby").emit("removeGame", { game:this.getPublicData() });
    return true;
  }

  hasPlayer(username) {
    return username && username in this.players;
  }

  getPlayer(username) {
    return this.hasPlayer(username) && this.players[username];
  }

  addPlayer({socket, username} = {}) {
    if (this.started || !socket || !username || this.hasPlayer(username)) {
      throw new Error("Invalid player join attempt!");
    }
    const newPlayer = new Player({
      username, socketAddress: socketRemoteIP(socket)
    });
    this.numActivePlayers() && this.sendPlayerUpdate(newPlayer, "playerJoin");
    this.players[username] = newPlayer;
    this.updateImposterLimit();
  }

  updatePlayerSocket({socket, username} = {}) {
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
    // console.log("player register success -- \n\t", username, "|", player.username, "\n\t", player.socketAddress, "|", socketRemoteIP(socket), "\n\t", player.active, "|", player.wasActive);
    player.socket && player.socket.disconnect();
    player.socket = socket;
    player.socketID = socket.id;
    this.gameRoomIO = socket.nsp;
    player.active = socket && socket.connected;
    if (this.started && !this.ended) {
      if (player.alive) {
        socket.join("alive");
        username in this.crewmates && socket.join("crewmates");
        username in this.imposters && socket.join("imposters");
      } else {
        socket.join("ghosts");
      }
    }
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
    Object.keys(player.tasks).forEach(qrID => {
      const taskState = player.tasks[qrID];
      const task = this.tasks[qrID];
      if (taskState.active) {
        taskState.active = false;
        if (task.physicalDeviceID) {
          task.inUse = false;
        }
      }
    });
    this.setReadyState(player, false);
    if (!this.numActivePlayers()) {
      // console.log(`CLOSE GAME: ${this.getIndexVariable()}| -- all players gone`);
      this.close();
    }
    this.sendPlayerUpdate(player);
    return true;
  }

  removePlayer(username) {
    const player = this.getPlayer(username);
    // console.log("removing player", player);
    if (!player) {
      return false;
    }
    // TODO: add more remove logic (unassigning tasks and stuff, close socket)
    this.started && !this.ended && this.killPlayer(username);
    delete this.players[username];
    delete this.crewmates[username];
    delete this.imposters[username];
    delete this.ghosts[username];
    player.socket && player.socket.disconnect();
    !this.started && this.updateImposterLimit();
    return player;
  }

  sendPlayerUpdate(player, eventName = "playerInfo") {
    this.gameRoomIO && this.gameRoomIO.to("players").emit(eventName, { player: player.getGamePrivateData() });
    player.socket && player.socket.emit("playerInfo", { player: player.getUserPrivateData() });
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
    rule.value = clamp(rule.min, rule.value, rule.max);
    this.emitRuleUpdate(ruleName);
  }

  getSortedTasks() {
    const tasks = Object.values(this.tasks);
    const sorted = {common: [], short: [], long: []};
    tasks.forEach(task => {
      sorted[task.format].push(task);
    });
    return sorted;
  }

  updateTaskRuleLimits() {
    const sorted = this.getSortedTasks();
    ['common', 'short', 'long'].forEach(format => {
      const ruleName = upperFirstCharOnly(format) + " Tasks";
      const rule = this.rules[ruleName];
      rule.max = Math.floor(sorted[format].length / (format === 'common' ? 1 : 2));
      !rule.max && sorted[format].length && (rule.max = 1);
      rule.value = clamp(rule.min, rule.value, rule.max);
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

  registerTaskSocket(task, socket) {
    this.tasks[task.qrID].online = true;
    this.tasks[task.qrID].socket = socket;
    this.gameRoomIO && this.gameRoomIO.to("players").emit("taskStatus", {taskname: task.taskname, taskStatus: {online: true}});
    return true;
  }

  unregisterTaskSocket(task) {
    this.tasks[task.qrID].online = false;
    this.tasks[task.qrID].socket = null;
    this.gameRoomIO && this.gameRoomIO.to("players").emit("taskStatus", {taskname: task.taskname, taskStatus: {online: false}});
    if (task.inUse) {
      const usingPlayers = Object.values(this.players).filter(player => player.tasks[task.qrID].active);
      if (usingPlayers.length !== 1) {
        throw new Error(`Task in use with bad number of active players... ${usingPlayers.map(player => player.username)}`);
      }
      const player = usingPlayers[0];
      task.inUse = false;
      player.tasks[task.qrID].active = false;
      player.socket && player.socket.emit("stopTask", { taskname: task.taskname });
    }
  }

  resetGame() {
    this.started = false;
    this.ended = false;
    this.inMeeting = false;
    this.meetingInfo = null;
    this.winners = null;
    this.crewmates = {};
    this.imposters = {};
    this.ghosts = {};
    Object.values(this.players).forEach(player => {
      player.reset();
      // this.sendPlayerUpdate(player);
    });
    this.clearVotingTimer();
    this.clearEmergencyTimer();
    this.votes = {};
    this.ejectedPlayer = null;
    this.totalTasks = undefined;
    this.completedTasks = undefined;
    Object.values(this.players).forEach(player => {
      player.socket && player.socket.emit("gameReset", { game: player.username === this.hostname ? this.getHostData() : this.getUserPrivateData(player.username) });
    });
  }

  readyToStart() {
    const _players = Object.values(this.players);
    const allPlayersReady = _players.length > 3 && _players.every(player => player.ready);
    const _tasks = Object.values(this.getPhysicalTasks());
    const allTasksOnline = _tasks.every(task => task.online);
    return allPlayersReady && allTasksOnline;
  }

  startGame() {
    if (!this.readyToStart())
      return;
    this.started = true;
    const players = Object.values(this.players);
    this.numPlayers = players.length;
    this.numImposters = this.rules['# imposters'].value;
    this.numCrewmates = this.numPlayers - this.numImposters;
    const imposters = getRandomSubarray(players, this.numImposters);
    this.imposters = Object.fromEntries(imposters.map(player => [player.username, player]));
    const crewmates = players.filter(player => !(player.username in this.imposters));
    this.crewmates = Object.fromEntries(crewmates.map(player => [player.username, player]));

    const commonTasksToAssign = this.distributeTasks();

    const initialKillTimer = this.setupImposters(commonTasksToAssign);

    players.forEach(player => {
      player.socket && player.socket.join("alive");
      player.remainingEmergencies = this.rules["# Emergency Meetings"].value;
    });
    this.emergencyTimer = this.rules["Emergency Cooldown"].value;

    imposters.forEach(imposter => {
      imposter.socket && imposter.socket.join("imposters");
      imposter.killTimer = initialKillTimer;
      imposter.victims = [];
    });

    crewmates.forEach(crewmate => {
      crewmate.socket && crewmate.socket.join("crewmates");
    });

    this.gameRoomIO && this.gameRoomIO.to("crewmates").emit("gameStarted", {role: "CREWMATE"});
    this.gameRoomIO && this.gameRoomIO.to("imposters").emit("gameStarted", {role: "IMPOSTER", imposters: Object.keys(this.imposters), killTimer: initialKillTimer, victims: []});
    crewmates.forEach(player => {
      player.socket && player.socket.emit("allAssignedTasksInfo", { tasks: this.getPublicTaskInfo(player.tasks) });
    });
    imposters.forEach(player => {
      player.socket && player.socket.emit("allAssignedTasksInfo", { tasks: this.getPublicTaskInfo(player.tasks) });
    });
    this.emitTaskBarStatus();
  }

  distributeTasks() {
    const commonTaskCount = this.rules['Common Tasks'].value;
    const shortTaskCount = this.rules['Short Tasks'].value;
    const longTaskCount = this.rules['Long Tasks'].value;
    const tasksPerPlayer = commonTaskCount + shortTaskCount + longTaskCount;
    // this.totalTaskCount = tasksPerPlayer * this.numCrewmates;
    const sortedTasks = this.getSortedTasks();
    const commonTaskQRs = Object.values(sortedTasks.common).map(task => task.qrID);
    const commonTasksToAssign = getRandomSubarray(commonTaskQRs, clamp(0, commonTaskCount, commonTaskQRs.length));
    const shortTaskQRs = Object.values(sortedTasks.short).map(task => task.qrID);
    const shortTasksToAssign = getRandomSubarray(shortTaskQRs, clamp(0, shortTaskCount * this.numCrewmates, shortTaskQRs.length));
    const numShortToAssign = Math.floor(shortTasksToAssign.length / this.numCrewmates);
    const extraShortTasksNeeded = shortTaskCount - numShortToAssign;
    const longTaskQRs = Object.values(sortedTasks.long).map(task => task.qrID);
    const longTasksToAssign = getRandomSubarray(longTaskQRs, clamp(0, longTaskCount * this.numCrewmates, longTaskQRs.length));
    const numLongToAssign = Math.floor(longTasksToAssign.length / this.numCrewmates);
    const extraLongTasksNeeded = longTaskCount - numLongToAssign;


    Object.values(this.crewmates).forEach(player => {
      // player.tasks = {};
      commonTasksToAssign.forEach(qrID => player.tasks[qrID] = { ...DEFAULT_IMCOMPLETE_TASK });
      for (let i = 0; i < numShortToAssign; i++) {
        let shortTaskQR = shortTasksToAssign.pop();
        player.tasks[shortTaskQR] = { ...DEFAULT_IMCOMPLETE_TASK };
      }
      if (extraShortTasksNeeded) {
        for (let i = 0; i < extraShortTasksNeeded; i++) {
          let shortTaskQR = shortTaskQRs[Math.floor(Math.random() * shortTaskQRs.length)];
          while (shortTaskQR in player.tasks) {
            shortTaskQR = shortTaskQRs[Math.floor(Math.random() * shortTaskQRs.length)];
          }
          player.tasks[shortTaskQR] = { ...DEFAULT_IMCOMPLETE_TASK };
        }
      }
      for (let i = 0; i < numLongToAssign; i++) {
        let longTaskQR = longTasksToAssign.pop();
        player.tasks[longTaskQR] = { ...DEFAULT_IMCOMPLETE_TASK };
      }
      if (extraLongTasksNeeded) {
        for (let i = 0; i < extraLongTasksNeeded; i++) {
          let longTaskQR = longTaskQRs[Math.floor(Math.random() * longTaskQRs.length)];
          while (longTaskQR in player.tasks) {
            longTaskQR = longTaskQRs[Math.floor(Math.random() * longTaskQRs.length)];
          }
          player.tasks[longTaskQR] = { ...DEFAULT_IMCOMPLETE_TASK };
        }
      }
    });
    return commonTasksToAssign;
  }

  setupImposters(commonTasksToAssign) {
    const commonTaskCount = this.rules['Common Tasks'].value;
    const shortTaskCount = this.rules['Short Tasks'].value;
    const longTaskCount = this.rules['Long Tasks'].value;
    const sortedTasks = this.getSortedTasks();
    Object.values(this.imposters).forEach(player => {
      commonTasksToAssign.forEach(qrID => player.tasks[qrID] = { ...DEFAULT_IMCOMPLETE_TASK });
      getRandomSubarray(sortedTasks.short, shortTaskCount).forEach(shortTask => player.tasks[shortTask.qrID] = { ...DEFAULT_IMCOMPLETE_TASK });
      getRandomSubarray(sortedTasks.long, longTaskCount).forEach(longTask => player.tasks[longTask.qrID] = { ...DEFAULT_IMCOMPLETE_TASK });
    });
    const initialKillTimer = Math.ceil(this.rules["Kill Cooldown"].value / 10) * 5;
    return initialKillTimer;
  }

  readyForActions() {
    return this.started && !this.ended && !this.inMeeting;
  }

  checkGameEnded() {
    if (!this.started || this.ended) {
      return false;
    }
    const crewmates = Object.values(this.crewmates).filter(crewmate => crewmate.alive);
    const imposters = Object.values(this.imposters).filter(imposter => imposter.alive);
    if (imposters.length === 0 || crewmates.every(crewmate => Object.values(crewmate.tasks).every(task => task.completed))) {
      this.crewmatesWin();
    } else if (crewmates.length <= imposters.length) {
      this.impostersWin();
    }
    if (this.winners) {
      this.ended = true;
      imposters.forEach(imposter => {
        imposter.clearKillTimer();
      });
      this.clearVotingTimer();
      this.clearEmergencyTimer();
      this.gameRoomIO && this.gameRoomIO.emit("gameEnded", {
        winners: this.winners,
        crewmates: Object.keys(this.crewmates),
        imposters: Object.keys(this.imposters)
      });
      return true;
    }
    return false;
  }

  crewmatesWin() {
    this.winners = "CREWMATES";
  }

  impostersWin() {
    this.winners = "IMPOSTERS";
  }

  notifyGhosts(newGhost) {
    this.gameRoomIO && this.gameRoomIO.to("ghosts").emit("newGhost", { ghost: fieldsFromObject(newGhost, ['username']) });
  }

  killPlayer(username) {
    if (!this.hasPlayer(username)) {
      return false;
    }
    const player = this.players[username];
    if (!player.alive) {
      return false;
    }
    let ret;
    username in this.crewmates && (ret = this.killCrewmate(username));
    username in this.imposters && (ret = this.killImposter(username));
    if (!ret) {
      return false;
    }
    return true;
  }

  killCrewmate(username) {
    if (!this.hasPlayer(username)) {
      return false;
    }
    if (!(username in this.crewmates)) {
      return false;
    }
    const crewmate = this.crewmates[username];
    if (!crewmate.alive) {
      return false;
    }
    crewmate.alive = false;
    Object.entries(crewmate.tasks).forEach(taskEntry => {
      const [ qrID, taskStatus ] = taskEntry;
      const gameTask = this.tasks[qrID];
      if (taskStatus.active) {
        if (gameTask.physicalDeviceID) {
          taskStatus.socket && taskStatus.socket.emit("evictPlayer", { username });
        }
        player.socket && player.socket.emit("stopTask", { taskname: gameTask.taskname });
      }
      taskStatus.completed = true;
      taskStatus.active = false;
    });
    if (crewmate.socket) {
      crewmate.socket.leave("alive");
      crewmate.socket.leave("crewmates");
      crewmate.socket.join("ghosts");
      crewmate.socket.emit("killedByImposter", { player: {alive: false, tasks: this.getPublicTaskInfo(crewmate.tasks)} });
      // this.sendPlayerUpdate(crewmate, "killedByImposter");
    }
    this.notifyGhosts(crewmate);
    // delete this.crewmates[username];
    this.ghosts[username] = crewmate;
    this.checkGameEnded();
    return true;
  }

  killImposter(username) {
    if (!this.hasPlayer(username)) {
      return false;
    }
    const imposter = this.imposters[username];
    if (!imposter.alive) {
      return false;
    }
    imposter.alive = false;
    if (imposter.socket) {
      imposter.socket.leave("alive");
      // imposter.socket.leave("imposter");
      imposter.socket.join("ghosts");
      imposter.socket.emit("killedByImposter", { player: {alive: false, tasks: this.getPublicTaskInfo(imposter.tasks)} });
      // this.sendPlayerUpdate(imposter, "killedByImposter");
    }
    this.notifyGhosts(imposter);
    // delete this.imposters[username];
    this.ghosts[username] = imposter;
    this.checkGameEnded();
    return true;
  }

  /**
   * triggered when an imposter attemps to kill a crewmate
   * @param  {[type]} imposterName [description]
   * @param  {[type]} crewmateName [description]
   * @return {[type]}              [description]
   */
  attemptImposterKill(imposterName, crewmateName) {
    const imposter = this.imposters[imposterName];
    const crewmate = this.crewmates[crewmateName];
    if (!imposter || !crewmate || !imposter.alive || !crewmate.alive) {
      return false;
    }
    if (imposter.killTimer > 0) {
      return false;
    }
    imposter.pendingVictim = crewmateName;
    imposter.socket && imposter.socket.emit("pendingVictim", {pendingVictim: crewmateName});
    return true;
  }

  unreadyImposterKill(imposterName) {
    const imposter = this.imposters[imposterName];
    if (!imposter || !imposter.alive) {
     return false;
    }
    if (!imposter.pendingVictim) {
     return false;
    }
    imposter.pendingVictim = null;
    imposter.socket && imposter.socket.emit("pendingVictim", {pendingVictim: null});
    return true;
  }

  receiveImposterKill(crewmateName) {
    const crewmate = this.crewmates[crewmateName];
    if (!crewmate || !crewmate.alive) {
      return false;
    }
    const imposter = Object.values(this.imposters).find(imposter => imposter.pendingVictim === crewmateName);
    if (!imposter || !imposter.alive) {
      return false;
    }
    if (imposter.killTimer > 0) {
      imposter.pendingVictim = null;
      return false;
    }
    if (!this.killCrewmate(crewmateName)) {
      return false;
    }
    imposter.pendingVictim = null;
    imposter.victims.push(crewmateName);
    if (!this.ended) {
      imposter.socket && imposter.socket.emit("killSuccess", {victim: crewmateName});
      imposter.killTimer = this.rules["Kill Cooldown"].value;
    }
    return true;
  }

  attemptReport(reporterName, bodyName) {
    const reporter = this.players[reporterName];
    const body = this.players[bodyName];
    if (!reporter || !body || !reporter.alive) {
      return false;
    }
    reporter.pendingReport = bodyName;
    reporter.socket && reporter.socket.emit("pendingReport", {pendingReport: bodyName});
    return true;
  }

  unreadyReport(reporterName) {
    const reporter = this.players[reporterName];
    if (!reporter || !reporter.alive) {
     return false;
    }
    if (!reporter.pendingReport) {
     return false;
    }
    reporter.pendingReport = null;
    reporter.socket && reporter.socket.emit("pendingReport", { pendingReport: null });
    return true;
  }

  receiveReport(crewmateName) {
    const crewmate = this.crewmates[crewmateName];
    if (!crewmate || crewmate.alive) {
      return false;
    }
    const reporter = Object.values(this.players).find(player => player.pendingReport === crewmateName);
    if (!reporter || !reporter.alive) {
      return false;
    }
    reporter.pendingReport = null;
    // reporter.socket && reporter.socket.emit("reportSuccess", {victim: crewmateName});
    crewmate.publiclyAlive = false;
    this.gameRoomIO && this.gameRoomIO.to("players").emit("deadBodyReported", { victim: crewmateName });
    this.setupMeeting({ reason: "REPORT", victim: crewmateName, reporter: reporter.username });
    return true;
  }

  get emergencyTimer() {
    return this._emergencyTimer;
  }

  set emergencyTimer(newEmergencyTimer) {
    clearInterval(this._emergencyTimerInterval);
    this._emergencyTimer = newEmergencyTimer;
    // this.socket && this.socket.emit("emergencyTimer", {emergencyTimer: this._emergencyTimer});
    const step = 1000;
    const decr = step/1000;
    this._emergencyTimerInterval = setInterval(() => {
      this._emergencyTimer -= decr;
      // this._emergencyTimer % 1 === 0 && this.socket && this.socket.emit("emergencyTimer", {emergencyTimer: this._emergencyTimer});
      if (this._emergencyTimer <= 0) {
        // this.readyToKill();
      }
    }, step);
  }

  clearEmergencyTimer() {
    clearInterval(this._emergencyTimerInterval);
  }

  setupMeeting(meetingInfo) {
    const reason = meetingInfo.reason;
    switch (reason) {
      case "REPORT":
        const { victim, reporter } = meetingInfo;
        break;
      case "EMERGENCY":
        const { caller } = meetingInfo;
        break;
      default:
        break;
    }
    // TODO: send task bar update if rule is meetings
    if (this.rules["Task Bar Updates"].value === "MEETINGS") {
      this.emitTaskBarStatus();
    }
    const newBodies = [];
    Object.values(this.players).forEach(player => {
      Object.keys(player.tasks).forEach(qrID => {
        const taskState = player.tasks[qrID];
        if (taskState.active) {
          taskState.active = false;
          const task = this.tasks[qrID];
          if (task.physicalDeviceID) {
            task.inUse = false;
            task.socket && task.socket.emit("cancelTask");
          }
          player.socket && player.socket.emit("stopTask", { taskname: task.taskname });
        }
      });
      if (!player.alive && player.publiclyAlive) {
        player.publiclyAlive = true;
        newBodies.push(player.username);
      }
    });
    this.inMeeting = true;
    this.meetingInfo = meetingInfo;
    this.votingTimer = this.rules["Voting Time"].value;
    this.votes = Object.fromEntries(Object.values(this.players).filter(player => player.alive).map(player => [
      player.username,
      []
    ]));
    this.votes['**SKIP_VOTE**'] = [];
    this.gameRoomIO && this.gameRoomIO.to("players").emit("meeting", { meetingInfo, votingTimer: this.rules["Voting Time"].value, newBodies });
    // this.votes["**ABSTAIN**"] = Object.keys(this.players).filter(playerName => this.players[playerName].alive);
    return true;
  }

  get votingTimer() {
    return this._votingTimer;
  }

  set votingTimer(newVotingTimer) {
    clearInterval(this._votingTimerInterval);
    this._votingTimer = newVotingTimer;
    this.gameRoomIO && this.gameRoomIO.to("players").emit("votingTimer", {votingTimer: this._votingTimer});
    const step = 1000;
    const decr = step/1000;
    this._votingTimerInterval = setInterval(() => {
      this._votingTimer -= decr;
      this._votingTimer % 1 === 0 && this.gameRoomIO && this.gameRoomIO.to("players").emit("votingTimer", {votingTimer: this._votingTimer});
      if (this._votingTimer === 0) {
        clearInterval(this._votingTimerInterval);
        this.tallyVotes();
      }
    }, step);
  }

  clearVotingTimer() {
    clearInterval(this._votingTimerInterval);
  }

  /**
   * votingChoice used to determine already voted
   * @param  {[type]} voterName  [description]
   * @param  {[type]} choiceName [description]
   * @return {[type]}            [description]
   */
  castVote(voterName, choiceName) {
    const voter = this.players[voterName];
    const choice = this.players[choiceName];
    if (!voter || !voter.alive || voter.votingChoice || (choiceName !== "**SKIP_VOTE**" && (!choice || !choice.alive))) {
      return false;
    }
    //TODO: dont allow double voting/acknowledge vote, finish early
    this.votes[choiceName].push(this.rules["Anonymous Votes"].value ? this.votes[choiceName].length + 1 : voterName);
    // this.votes["**ABSTAIN**"] = this.votes["**ABSTAIN**"].filter(abstainerName => abstainerName !== voterName);
    voter.votingChoice = choiceName;
    voter.socket && voter.socket.emit("iVoted", {choice: choiceName});
    this.gameRoomIO && this.gameRoomIO.to("players").emit("voteCasted", { voter: voterName });
    if (Object.values(this.players).filter(player => player.alive && !player.votingChoice).length === 0) {
      this.tallyVotes();
    }
  }

  tallyVotes() {
    clearInterval(this._votingTimerInterval);
    // console.log('finish voting\n', this.votes);
    Object.values(this.players).forEach(player => {
      player.votingChoice = null;
    });
    this.gameRoomIO && this.gameRoomIO.to("players").emit("votes", {votes: this.votes});
    setTimeout(() => {
      this.votes["**NOBODY**"] = [];
      this.ejectedPlayer = Object.keys(this.votes).reduce((a, b) => this.votes[a].length > this.votes[b].length ? a : b, "**NOBODY**");
      this.ejectedPlayer === "**SKIP_VOTE**" && (this.ejectedPlayer = "**NOBODY**");
      this.votes = {};
      const ejectedPlayerData = {name: this.ejectedPlayer};
      if (this.rules["Confirm Ejects"].value) {
        ejectedPlayerData.role = this.ejectedPlayer in this.imposters ? "IMPOSTER" : "CREWMATE";
        ejectedPlayerData.remaining = Object.values(this.imposters).filter(imposter => imposter.alive).length;
      }
      this.gameRoomIO && this.gameRoomIO.to("players").emit("eject", { ejectedPlayer: ejectedPlayerData });
      setTimeout(() => {
        if (this.ejectedPlayer in this.players) {
          const ejected = this.players[this.ejectedPlayer];
          this.killPlayer(ejected.username);
          ejected.publiclyAlive = false;
        }
        this.inMeeting = false;
        this.ejectedPlayer = null;
        if (!this.ended) {
          this.gameRoomIO && this.gameRoomIO.to("players").emit("resume", { wasEjected: ejectedPlayerData });
          Object.values(this.imposters).filter(imposter => imposter.alive).forEach(imposter => {
            imposter.killTimer = this.rules["Kill Cooldown"].value;
          });
          this.emergencyTimer = this.rules["Emergency Cooldown"].value;
        }
      }, EJECTION_TIME);
    }, POST_VOTING_DELAY);
  }

  acknowledgeQrScan(scannerName, qrData) {
    const player = this.getPlayer(scannerName);
    if (!player) {
      return false;
    }
    if (qrData === "3m3RgEnCy") {
      const issue = player.cannotCallMeeting(this.emergencyTimer);
      if (issue) {
        player.socket && player.socket.emit("badQrScan", { issue });
        return false;
      }
      const ret = this.setupMeeting({ reason: "EMERGENCY", caller: scannerName });
      player.remainingEmergencies--;
      return ret;
    } else if (qrData in this.tasks) {
      const task = this.tasks[qrData];
      const taskState = player.tasks[qrData];
      if (!player.alive) {
        player.socket && player.socket.emit("badQrScan", { issue: "Dead people can't do tasks!" });
        return false;
      }
      if (scannerName in this.crewmates) {
        // console.log('attempting task', qrData, player.username);
        if (!(qrData in player.tasks)) {
          player.socket && player.socket.emit("badQrScan", { issue: `You were not assigned the ${task.taskname} task!` });
          return false;
        }
        if (taskState.completed) {
          player.socket && player.socket.emit("badQrScan", { issue: `You've already completed the ${task.taskname} task! Move on!` });
          return false;
        }
        const alreadyActiveTasks = Object.keys(player.tasks).filter(qrID => player.tasks[qrID].active);
        if (alreadyActiveTasks.length) {
          player.socket && player.socket.emit("badQrScan", { issue: `You're already doing the ${alreadyActiveTasks.map(qrID => this.tasks[qrID].taskname)} task${alreadyActiveTasks.length > 1 ? "s" : ""}! Finish that first!` });
          return false;
        }
        if (task.physicalDeviceID) {
          if (!task.online) {
            player.socket && player.socket.emit("badQrScan", { issue: `The ${task.taskname} task is offline! You gotta fix it bruh` });
            return false;
          }
          if (task.inUse) {
            player.socket && player.socket.emit("badQrScan", { issue: `The ${task.taskname} task is already being done! You gotta wait...` });
            return false;
          }
          const ret = this.startTask(player, task);
          return ret;
        } else {
          // player.socket && player.socket.emit("badQrScan", { issue: `Nice mobile task! ${task.taskname}` });
          // TODO: add logic for requiring rescan on completion of mobile task
          if (taskState.awaitingRescan) {
            this.completeTask(player, task);
            return true;
          }
          if (taskState.active) {
            return false;
          }
          const ret = this.startTask(player, task);
          return ret;
        }
      } else {
        player.socket && player.socket.emit("badQrScan", { issue: "Nice task faking you IMPOSTER" });
        return false;
      }
    } else if (qrData in this.players) {
      // console.log('scan player', qrData, player.username);
      const ret = true;
      return ret;
    } else {
      console.log("Unknown QR code", qrData);
      player.socket && player.socket.emit("badQrScan", { issue: "Unknown QR code. Try scanning again." });
      return false;
    }
  }

  startTask(player, task) {
    if (!player || !(player.username in this.players)) {
      return false;
    }
    if (!task || !(task.qrID in this.tasks) || !(task.qrID in player.tasks)) {
      return false;
    }
    const activePlayerTasks = Object.values(player.tasks).filter(taskState => taskState.active);
    if (activePlayerTasks.length) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    if (task.physicalDeviceID) {
      task.inUse = true;
      task.socket && task.socket.emit("begin", { username: player.username });
    } else {
    }
    taskState.active = true;
    player.socket && player.socket.emit("beginTask", { taskname: task.taskname });
    return true;
  }

  stopMobileTask(username, mobileTask) {
    const player = this.players[username];
    const task = this.tasks[mobileTask.qrID];
    if (!player || !player.alive || !task || task.physicalDeviceID) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    if (!taskState.active) {
      return false;
    }
    taskState.active = false;
    // taskState.awaitingRescan = true;
    player.socket && player.socket.emit("stopTask", { taskname: task.taskname });
    return true;
  }

  finishMobileTask(username, mobileTask) {
    const player = this.players[username];
    const task = this.tasks[mobileTask.qrID];
    if (!player || !player.alive || !task || task.physicalDeviceID) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    if (!taskState.active) {
      return false;
    }
    taskState.active = false;
    taskState.awaitingRescan = true;
    player.socket && player.socket.emit("awaitingRescan", { taskname: task.taskname });
    return true;
  }

  failPhysicalTask(username, task) {
    const player = this.players[username];
    // const task = this.tasks[mobileTask.qrID];
    if (!player || !player.alive || !task || !task.physicalDeviceID || !task.inUse || !(task.qrID in player.tasks)) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    if (!taskState.active) {
      return false;
    }
    task.inUse = false;
    taskState.active = false;
    player.socket && player.socket.emit("stopTask", { taskname: task.taskname });
    return true;
  }

  finishPhysicalTask(username, task) {
    const player = this.players[username];
    // const task = this.tasks[mobileTask.qrID];
    if (!player || !player.alive || !task || !task.physicalDeviceID || !task.inUse || !(task.qrID in player.tasks)) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    if (!taskState.active) {
      return false;
    }
    this.completeTask(player, task);
    return true;
  }

  completeTask(player, task) {
    if (!player || !(player.username in this.players)) {
      return false;
    }
    if (!task || !(task.qrID in this.tasks) || !(task.qrID in player.tasks)) {
      return false;
    }
    const taskState = player.tasks[task.qrID];
    taskState.completed = true;
    taskState.active = false;
    if (!task.physicalDeviceID) {
      delete taskState.awaitingRescan;
    } else {
      task.inUse = false;
    }
    player.socket && player.socket.emit("taskComplete", { taskname: task.taskname });
    if (this.rules["Task Bar Updates"].value === "ALWAYS") {
      this.emitTaskBarStatus();
    }
  }

  emitTaskBarStatus() {
    let totalTasks = 0;
    let completedTasks = 0;
    Object.keys(this.players)
        .filter(playerName => playerName in this.crewmates)
        .forEach(playerName => {
          const player = this.players[playerName];
          Object.values(player.tasks).forEach(task => {
            totalTasks++;
            task.completed && (completedTasks++);
          });
      });
    this.totalTasks = totalTasks;
    this.completedTasks = completedTasks;
    this.gameRoomIO && this.gameRoomIO.to("players").emit("taskBarStatus", { totalTasks, completedTasks });
  }

  // TODO: player disconnect -> make all associated tasks inactive

  // TODO: method for receiving a qrscan
  //        physical task: validate -> tell task it's being worked on
  //        mobile task: validate -> tell user to pull up task ui
  //          must scan again once completed (prove they didn't just leave)
  // TODO: update task bar completion and emit updates (dependent on rule)

}
