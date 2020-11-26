const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY } = require('../config/env');
const User = require('../models/User');
const { promiseTimeout } = require('../utils');

const userPayload = user => ({
  username: user.username
});

module.exports = {
  findById: (request, response) => {
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    console.log("findById")
    console.log("\tauthorization", request.headers.authorization.substring(0,20));
    console.log("\tbody", request.body);
    console.log("\tparams", request.params);
    if (request.params.id) {
      promiseTimeout(User.findById(request.params.id))
        .then(user => {
          console.log("FOUND USER", user)
          response.status(200).json(userPayload(user));
        })
        .catch(error => {
          console.log(error);
          response.status(503).json({ error });
        });
    } else {
      response.status(400).json({ error: 'Must provide ID' });
    }
  },
  findByUsername: (request, response) => {
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    console.log("findByUsername")
    console.log("\tauthorization", request.headers.authorization.substring(0,20));
    console.log("\tbody", request.body);
    console.log("\tparams", request.params);
    if (request.params.id) {
      promiseTimeout(User.findByUsername(request.params.username))
        .then(user => {
          console.log("FOUND USER", user)
          response.status(200).json(userPayload(user));
        })
        .catch(error => {
          console.log(error);
          response.status(503).json({ error });
        });
    } else {
      response.status(400).json({ error: 'Must provide ID' });
    }
  },
};
