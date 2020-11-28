// const { MONGOOSE_READ_TIMEOUT } = require('../config/env');
const User = require('../../models/User');

module.exports = (rootIO, gameIO) => {
  gameIO.use((socket, next) => {
    console.log(`\tGAME: ${socket.id}`);
    next();
  });

  gameIO.on("connection", socket => {
    console.log(`new user joined game: ${socket.id}`);

    socket.on("joinGame", async (data) => {
      const { gameID } = data;
      console.log(`user joining game: ${gameID}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected (${reason}):\n\t- Leaving game:${socket.id}`);
    });
  });
};
