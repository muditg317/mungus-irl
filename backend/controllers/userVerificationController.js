const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY } = require('../config/env');
const User = require('../models/User');
const VerificationHash = require('../models/VerificationHash');
const { promiseTimeout } = require('../utils');

const authPayload = user => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  verified: user.verified,
});

const sendEmail = (user, hash) => {
  console.log('send email', user.email, hash);
  return true;
};

const sendVerificationEmail = (user, verificationHash, response) => {
  console.log("SEND EMAIL", user);
  if (verificationHash) {
    return response.status(200).json({ pendingVerification: sendEmail(user, verificationHash.hash) });
  }
  bcrypt.hash(String(user._id), 10, (error, hash) => {
    if (error) {
      return response.status(503).json({ error });
    }
    (new VerificationHash({ user, hash })).save()
      .then(verificationHash => {
        response.status(200).json({ pendingVerification: sendEmail(user, verificationHash.hash) });
      })
      .catch(error => {
        response.status(503).json({ error });
      });
  });
};

const verifyUserHash = (user, verificationHash, response) => {
  bcrypt.compare(String(user._id), verificationHash.hash, (error, valid) => {
    console.log("validate verification hash", { error, valid });
    if (error) {
      return response.status(503).json({ error });
    }
    if (!valid) {
      return response.status(403).json({ error: 'Invalid verification hash' });
    }
    console.log('valid verification', { user, verificationHash });
    user.verified = true;
    user.save()
      .then(user => {
        verificationHash.remove()
          .then(hashes => {
            console.log('verified', user);
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
            return response.status(503).json({ error });
          });
      })
      .catch(error => {
        return response.status(503).json({ error });
      });
  });
};


module.exports = {
  verify: (request, response) => {
    // console.log("headers",request.headers);
    if (!request.headers.authorization) {
      return response.status(403).json({ error: 'No credentials sent!' });
    }
    // console.log("authorization",request.headers.authorization);
    const token = request.headers.authorization.slice(request.headers.authorization.indexOf(' ') + 1);
    // console.log("token", token);
    jwt.verify(token, SECRET_OR_KEY, (err, decoded) => {
      console.log("verify auth token",{err,decoded});
      if (err) {
        return response.status(400).json({ error: 'Bad credentials!' });
      }
      const hash = request.params.hash;
      const hashQueryParams = { user: decoded.id };
      if (hash) {
        hashQueryParams.hash = hash;
      }
      VerificationHash.findOne(hashQueryParams)
        .then(verificationHash => {
          console.log("verificationHash", verificationHash);
          User.findById(decoded.id)
            .then(user => {
              console.log("user", user);
              if (!user) {
                return response.status(403).json({ error: 'Invalid authorization' });
              }
              if (user.verified) {
                console.log('user already verified');
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
                return;
              }
              if (hash) {
                if (verificationHash && verificationHash.hash === hash) {
                  return verifyUserHash(user, verificationHash, response);
                } else {
                  console.log(hash, verificationHash);
                  return response.status(403).json({ error: 'Cannot verify user' });
                }
              } else {
                let emailSuccess = !!verifyUserHash;
                if (!verificationHash || request.body.force) {
                  return sendVerificationEmail(user, verificationHash, response);
                }
                return response.status(200).json({ pendingVerification: emailSuccess });
              }
            })
            .catch(error => {
              console.log("verification error", error);
              return response.status(503).json({ error });
            });
        })
        .catch(error => {
          console.log("verification error", error);
          return response.status(503).json({ error })
        });
    });
  },
};
