const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY, MONGOOSE_READ_TIMEOUT, MONGOOSE_WRITE_TIMEOUT } = require('../config/env');
const { promiseTimeout, fieldsFromObject } = require('../utils');

// Load input validation
const validateRegisterInput = require('../validation/register');
const validateLoginInput = require('../validation/login');

const User = require('../models/User');

const authPayload = user => ({
  id: user.id,
  username: user.username
});

module.exports = {
  register: async (request, response) => {
    // Form validation
    const { errors, isValid } = validateRegisterInput(request.body);
    // Check validation
    if (!isValid) {
      return response.status(400).json(errors ? {...errors} : {});
    }
    try {
      const users = await User.findByUsername(request.body.username).maxTime(MONGOOSE_READ_TIMEOUT);
      if (users.length) {
        return response.status(400).json({ username: 'Username already exists' });
      }

      const newUser = new User(fieldsFromObject(request.body, User.schema.requiredPaths()));

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;
      // console.log('gen new user', newUser);

      const savedUser = await newUser.save({wtimeout: MONGOOSE_WRITE_TIMEOUT});
      // console.log('registered', savedUser);

      const payload = authPayload(savedUser);

      jwt.sign(payload, SECRET_OR_KEY, { expiresIn: '1y' }, (err, token) => {
          if (err) throw err;
          // console.log('auth token', token);
          response.json({
            success: true,
            token: 'Bearer ' + token
          });
        }
      );
    } catch (error) {
      console.error(error);
      return response.status(503);
    } finally {

    }
  },
  login: async (request, response) => {
    // Form validation
    const { errors, isValid } = validateLoginInput(request.body);
    // Check validation
    if (!isValid) {
      return response.status(400).json(errors ? {...errors} : {});
    }
    const username = request.body.username;
    const password = request.body.password;

    try {
      const user = await User.findOneByUsername(username).maxTime(MONGOOSE_READ_TIMEOUT);
      if (!user) {
        return response.status(404).json({ username: 'Username not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response.status(400).json({ password: 'Password incorrect' });
      }
      // console.log('logged in', user);

      const payload = authPayload(user);

      jwt.sign(payload, SECRET_OR_KEY, { expiresIn: '1y' }, (err, token) => {
          if (err) throw err;
          // console.log('auth token', token);
          response.json({
            success: true,
            token: 'Bearer ' + token
          });
        }
      );

    } catch (error) {
        console.error(error);
        return response.status(503);
    } finally {

    }
  },
};
