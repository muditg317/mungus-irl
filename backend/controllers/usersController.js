const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY } = require('../config/env');
const User = require('../models/User');
const VerificationHash = require('../models/VerificationHash');
const { promiseTimeout } = require('../utils');

module.exports = {
  findById: (request, response) => {
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    console.log("authorization", request.headers.authorization);
    console.log("body", request.body);
    console.log("params", request.params);
    if (request.params.id) {
      promiseTimeout(User.findById(request.params.id))
        .then(user => {
          response.status(200).json({...user});
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
