const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY } = require('../config/env');
const { promiseTimeout, fieldsFromBody } = require('../utils');

// Load input validation
const validateRegisterInput = require('../validation/register');
const validateLoginInput = require('../validation/login');

const User = require('../models/User');

const authPayload = user => ({
  id: user.id,
  username: user.username
});

module.exports = {
  register: (request, response) => {
    // Form validation
    const { errors, isValid } = validateRegisterInput(request.body);
    // Check validation
    if (!isValid) {
      return response.status(400).json(errors ? {...errors} : {});
    }
    promiseTimeout(User.findByUsername(request.body.username))
      .then(users => {
        if (users.length) {
          return response.status(400).json({ username: 'Username already exists' });
        }

        const newUser = new User(fieldsFromBody(request.body, User.schema.requiredPaths()));
        // Hash password before saving in database
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            console.log('gen new user', newUser);
            promiseTimeout(newUser.save(), 50000)
              .then(user => {
                // if (!user.verified) {
                //   return response.status(400).json({ verification: false });
                // }
                console.log('registered', user);
                // Create JWT Payload
                const payload = authPayload(user);
                // Sign token
                jwt.sign(
                  payload,
                  SECRET_OR_KEY,
                  {
                    expiresIn: 31556926 // 1 year in seconds
                  },
                  (err, token) => {
                    console.log('auth token', token);
                    response.json({
                      success: true,
                      token: 'Bearer ' + token
                    });
                  }
                );
              })
              .catch(error => {
                console.log(error);
                response.status(503);
              });
            console.log('saved');
          });
        });
      })
      .catch(error => {
        console.log(error);
        response.status(503);
      });
  },
  login: (request, response) => {
    // Form validation
    const { errors, isValid } = validateLoginInput(request.body);
    // Check validation
    if (!isValid) {
      return response.status(400).json(errors ? {...errors} : {});
    }
    const username = request.body.username;
    const password = request.body.password;

    promiseTimeout(User.findOneByUsername(username))
      .then(user => {
        if (!user) {
          return response.status(404).json({ username: 'Username not found' });
        }
        // console.log("logging in", user);
        // if (!user.verified) {
        //   return response.status(400).json({ verification: 'This account isn\'t verified! Please check your username.' });
        // }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
          if (!isMatch) {
            return response.status(400).json({ password: 'Password incorrect' });
          }
          // User matched
          // Create JWT Payload
          const payload = authPayload(user);
          // Sign token
          jwt.sign(
            payload,
            SECRET_OR_KEY,
            {
              expiresIn: 31556926 // 1 year in seconds
            },
            (err, token) => {
              response.json({
                success: true,
                token: 'Bearer ' + token
              });
            }
          );
        })
        .catch(error => {
          console.log(error);
          response.status(503);
        });
      })
      .catch(error => {
        console.log(error);
        response.status(503);
      });
  },
};
