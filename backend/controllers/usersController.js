const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY, MONGOOSE_READ_TIMEOUT } = require('../config/env');
const User = require('../models/User');
const { promiseTimeout } = require('../utils');

const userPayload = user => ({
  username: user.username
});

module.exports = {
  findById: async (request, response) => {
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    // console.log("findById")
    // console.log("\tauthorization", request.headers.authorization.substring(0,20));
    // console.log("\tbody", request.body);
    // console.log("\tparams", request.params);
    if (!request.params.id) {
      return response.status(400).json({ error: 'Must provide ID' });
    }
    try {
      const user = await User.findById(request.params.id).maxTime(MONGOOSE_READ_TIMEOUT);
      // console.log("FOUND USER", user);
      return response.status(200).json(userPayload(user));
    } catch (error) {
      console.error(error);
      return response.status(503).json({ error });
    } finally {

    }
  },
  findByUsername: async (request, response) => {
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    // console.log("findByUsername")
    // console.log("\tauthorization", request.headers.authorization.substring(0,20));
    // console.log("\tbody", request.body);
    // console.log("\tparams", request.params);
    if (!request.params.username) {
      return response.status(400).json({ error: 'Must provide username' });
    }
    try {
      const user = await User.findByUsername(request.params.username).maxTime(MONGOOSE_READ_TIMEOUT);
      // console.log("FOUND USER", user);
      return response.status(200).json(userPayload(user));
    } catch (error) {
      console.error(error);
      return response.status(503).json({ error });
    } finally {

    }
  },
};
