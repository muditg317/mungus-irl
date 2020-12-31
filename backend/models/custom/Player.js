const { globals, randStr } = require('../../utils');


module.exports = class Player {

  constructor({ username, socketAddress, active, wasActive, ready } = {}) {
    this.username = username;
    this.socketAddress = socketAddress;
    this.active = active;
    this.wasActive = wasActive;
    this.ready = ready || false;
  }

  getPublicData() {
    return {username: this.username, active: this.isActive({strict:true})};
  }

  getGamePrivateData() {
    const publicData = this.getPublicData();
    publicData.ready = this.ready;
    return publicData;
  }

  getUserPrivateData() {
    const privateData = this.getGamePrivateData();
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
}
