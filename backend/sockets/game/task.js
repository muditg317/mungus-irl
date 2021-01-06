const { globals, socketRemoteIP } = require('../../utils');
const Task = require('../../models/Task');

module.exports = {
  use: async (socket, next) => {
    try {
      console.log(`SOCKET-GAME-${socket.nsp.name}: TASK - ${socket.id}|${socketRemoteIP(socket)}`);
      const gameIndex = socket.nsp.gameIndex || socket.nsp.name.substring(6);
      if (!globals.games[gameIndex]) {
        const err = new Error("Invalid game host!");
        err.data = { content: `There is no game: ${gameIndex}` };
        return next(err);
      }
      // console.log('game exists');
      const game = globals.games[gameIndex];
      const providedDeviceID = socket.handshake.query.physicalDeviceID;
      const physicalTask = await Task.findOne({physicalDeviceID: providedDeviceID});
      if (!physicalTask) {
        const err = new Error("Invalid physical device ID!");
        err.data = { content: "Check the /setup-tasks to get the exact device ID for your physical task!" };
        return next(err);
      }
      // console.log('db entry exists', physicalTask);
      // const providedTaskname = socket.handshake.query.taskname;
      const gamePhysicalTasks = game.getPhysicalTasks();
      // console.log(gamePhysicalTasks);
      // console.log(Object.values(gamePhysicalTasks).find(task => task.physicalDeviceID === providedDeviceID));
      if (!gamePhysicalTasks[physicalTask.taskname] || !Object.values(gamePhysicalTasks).find(task => task.physicalDeviceID === providedDeviceID)) {
        const err = new Error("Task not in use for game!");
        err.data = { content: "Update your task manager, or restart your game to use latest changes!" };
        return next(err);
      }
      // console.log('task is in game');
      socket.physicalTask = physicalTask;
      socket.nsp.gameIndex = gameIndex;
      let socketSuccess = game.registerTaskSocket(physicalTask, socket);
      if (!socketSuccess) {
        const err = new Error("Failed to register task in game");
        err.data = { content: "Please check configurations" };
        return next(err);
      }
      console.log(`SOCKET-GAME-${socket.nsp.gameIndex}|SUCCESS: TASK - ${socket.id}|${socketRemoteIP(socket)}`);
      next();
    } catch (error) {
      console.log("UNEXPECTED ERROR");
      console.log(error);
      const err = new Error("Unexpected server error");
      err.data = { content: "Contact Mudit for help" };
      return next(err);
    }
  },
  onConnection: (socket) => {
    const gameRoomIO = socket.nsp;
    const gameIndex = gameRoomIO.gameIndex = gameRoomIO.gameIndex || socket.nsp.name.substring(6);
    socket.join("tasks");
    const providedDeviceID = socket.handshake.query.physicalDeviceID;
    const game = globals.games[gameIndex];
    if (!game) {
      throw new Error("Invalid game!");
    }
    const task = game.tasks[socket.physicalTask.qrID];
    console.log(`new task(${task.taskname}) connected to game ${gameIndex}: ${socket.id}`);

    socket.onAny((event, ...args) => {
      if (socket.eventNames().includes(event))
        return;
      console.log(`got ${event}`, ...args);
    });

    socket.on("disconnect", reason => {
      console.log(`SOCKET-GAME-${gameRoomIO.name} EXIT (${reason}): TASK ${socket.id}`);
      game.unregisterTaskSocket(task);
      // socket.leave("players");
    });


  }
};
