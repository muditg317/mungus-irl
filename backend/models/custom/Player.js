const { globals, randStr } = require('../../utils');


module.exports = class Player {

  constructor({ username, socketAddress, active, wasActive } = {}) {
    this.username = username;
    this.socketAddress = socketAddress;
    this.active = active;
    this.wasActive = wasActive;
  }

  getPublicData() {
    return {username: this.username, active: this.active};
  }
}
