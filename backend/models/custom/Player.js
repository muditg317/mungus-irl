const { globals, randStr, fieldsFromObject } = require('../../utils');


module.exports = class Player {

  constructor({ username, socketAddress, active, wasActive, ready } = {}) {
    this.username = username;
    this.socketAddress = socketAddress;
    this.active = active;
    this.wasActive = wasActive;
    this.ready = ready || false;
    this.tasks = {};
    this.publiclyAlive = true;
    this.alive = true;
  }

  getPublicData() {
    return {username: this.username, active: this.isActive({strict:true})};
  }

  getGamePrivateData() {
    const publicData = this.getPublicData();
    publicData.ready = this.ready;
    publicData.publiclyAlive = this.publiclyAlive;
    return publicData;
  }

  getUserPrivateData() {
    const privateData = this.getGamePrivateData();
    privateData.alive = this.alive;
    return privateData;
  }

  isActive({strict, loose, socketOnly} = {}) {
    const activeState = this.active || (loose && this.wasActive);
    const socketState = this.socket && this.socket.connected && (socketOnly || !strict || this.active);
    return socketState || (!strict && activeState);
  }

  isUnresponsive({strict} = {}) {
    return strict ? (!this.active && !this.wasActive) : (this.active === false && this.wasActive === false);
  }

  reset() {
    const socket = this.socket;
    if (socket) {
      socket.leave("alive");
      socket.leave("crewmates");
      socket.leave("imposters");
      socket.leave("ghosts");
    }
    this.ready = false;
    this.tasks = {};
    this.alive = true;
    this.publiclyAlive = true;
    this.votingChoice = null;
    this.pendingReport = null;
    this.pendingVictim = null;
    this.victims = null;
    this.clearKillTimer();
  }

  get killTimer() {
    return this._killTimer;
  }

  set killTimer(newKillTimer) {
    clearInterval(this._killTimerInterval);
    this._killTimer = newKillTimer;
    this.socket && this.socket.emit("killTimer", {killTimer: this._killTimer});
    const step = 1000;
    const decr = step/1000;
    this._killTimerInterval = setInterval(() => {
      this._killTimer -= decr;
      this._killTimer % 1 === 0 && this.socket && this.socket.emit("killTimer", {killTimer: this._killTimer});
      if (this._killTimer <= 0) {
        this.readyToKill();
      }
    }, step);
  }

  clearKillTimer() {
    clearInterval(this._killTimerInterval);
  }

  readyToKill() {
    this._killTimer = 0;
    clearInterval(this._killTimerInterval);
    this.socket && this.socket.emit("readyToKill");
  }

  /**
   * returns a string representing the reason a meeting cannot be called
   * @return {[type]} [description]
   */
  cannotCallMeeting(emergencyTimer) {
    if (!this.alive)
      return "Dead people can't call emergency meetings!";
    if (this.remainingEmergencies <= 0)
      return "You can't call any more emergency meetings this game!";
    if (emergencyTimer > 0)
      return `You must wait ${emergencyTimer}s before calling an emergency meeting.`;
    return "";
  }

  toJSON(parentKey) {
    return JSON.stringify(this, (key, value) => {
      if (key === 'socket') {
        return fieldsFromObject(value, ['id','rooms','handshake']);
      }
      return value;
    });
  }

  toString() {
    return JSON.stringify(this, (key, value) => {
      if (key === 'socket') {
        return fieldsFromObject(value, ['id','rooms','handshake']);
      }
      return value;
    });
  }

}
