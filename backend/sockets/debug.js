const { globals, socketRemoteIP } = require('../utils');
const { SECRET_OR_KEY } = require('../config/env');

module.exports = (rootIO, debugIO) => {
  debugIO.use((socket, next) => {
    console.log("DEBUG JOIN ATTEMPT", socket.handshake.query.SECRET);
    const secret = socket.handshake.query.SECRET;
    // console.log("secret extracted",secret);
    if (secret !== SECRET_OR_KEY) {
      console.log("provided secret:",secret);
      const err = new Error("Invalid debug secret!");
      err.data = { content: "Make sure you use command line args with the debugger" }; // additional details
      return next(err);
    }
    // console.log("debug socket test passed", socket.handshake);
    console.log(`SOCKET-DEBUG: ${socket.id}|${socketRemoteIP(socket)}`);
    next();
  });

  debugIO.on("connection", socket => {
    console.log("debugger connected!", socket.id);
    socket.on("debug_request", (data, callback) => {
      console.log("debug data request", data);
      try {
        if (data) {
          if (typeof data === "string") {
            console.log("DEBUG COMMAND:", data);
            const result = eval(data);
            console.log("DEBUG RESULT",result);
            callback([result]);
            return;
          }
          callback(data.map(command => eval(command)));
        }
        const debugInfo = ["GAME INFO:", require('util').inspect(globals.games, { depth: 4 }), "IO info", Object.keys(globals.rootIO.sockets.sockets)];
        globals.rootIO._nsps.forEach(nsp => {
          nsp.sockets.forEach(socket => {
            debugInfo.push(`socket at |${nsp.name}|: id:${socket.id}|`);
          });
        });
        debugInfo.push("GAME IO INFO:")
        Object.values(globals.games).forEach(game => {
          if (!game.gameRoomIO) {
            return debugInfo.push(`no gameRoomIO for game:${game.hostname}`);
          }
          debugInfo.push(`gameRoomIO |${game.gameRoomIO.name}`);
          game.gameRoomIO.sockets.forEach(socket => {
            debugInfo.push(`socket at |${game.gameRoomIO.name}|: id:${socket.id}|`);
          });
        });
        callback(debugInfo);
      } catch (error) {
        console.error("DEBUG COMMAND FAILED");
        console.error(error);
        callback(["COMMAND FAILED", error]);
      } finally {

      }
    }, 10000);
    socket.on("disconnect", reason => {
      console.log(`Debugger leaving (${reason}): ${socket.id}|${socketRemoteIP(socket)}`);
    });
  });
};
