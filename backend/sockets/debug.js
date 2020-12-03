const { globals } = require('../utils');
const { SECRET_OR_KEY } = require('../config/env');

module.exports = (rootIO, debugIO) => {
  debugIO.use((socket, next) => {
    const secret = socket.handshake.query.SECRET;
    if (secret !== SECRET_OR_KEY) {
      const err = new Error("Invalid debug secret!");
      err.data = { content: "Make sure you use command line args with the debugger" }; // additional details
      return next(err);
    }
    console.log(`SOCKET-DEBUG: ${socket.id}|${socket.request.connection.remoteAddress}`);
    next();
  });

  debugIO.on("connection", socket => {
    console.log("debugger connected!", socket.id);
    socket.on("debug_request", (data, callback) => {
      try {
        if (data) {
          if (typeof data === "string") {
            console.log("DEBUG COMMAND:", data);
            const result = eval(data);
            console.log("DEBUG RESULT",result);
            return callback([result]);
          }
          callback(data.map(command => eval(command)));
        }
        callback(["GAME INFO:", require('util').inspect(globals.games, { depth: 4 })]);
      } catch (error) {
        callback(["COMMAND FAILED", error]);
      } finally {

      }
    }, 10000);
    socket.on("disconnect", reason => {
      console.log(`Debugger leaving (${reason}): ${socket.id}|${socket.request.connection.remoteAddress}`);
    });
  });
};
