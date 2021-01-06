const jwt = require('jsonwebtoken');
const { SECRET_OR_KEY } = require('../config/env');

const DEFAULT_TIMEOUT = 5000;

module.exports = {
  DEFAULT_TIMEOUT,
  globals: {},
  promiseTimeout: (promise, ms = DEFAULT_TIMEOUT) => {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject({message: 'Timed out in '+ ms + 'ms.'});
      }, ms)
    })

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ]);
  },
  fieldsFromObject: (body, fieldNames) => {
    let fields = {};
    fieldNames.forEach((field) => {
      fields[field] = body[field];
    });
    return fields;
  },
  verifyJWTtoken: (token) => {
    return jwt.verify(token, SECRET_OR_KEY);
  },
  randStr: (length, valid='aA0', { noQuotes = false } = {}) => {
    let result             = '';
    const characters       = (/[A-Z]/g.test(valid) ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '')
        + (/[a-z]/g.test(valid) ? 'abcdefghijklmnopqrstuvwxyz' : '')
        + (/[0-9]/g.test(valid) ? '0123456789' : '')
        + (/[$-/:-?{-~!"^_`\[\]]/g.test(valid) ? '!$%^&*()_+|~-=`{}[]:";\'<>?,./' : '');
    if (noQuotes) {
      characters = characters.replace(/'"`/g, '');
    }
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
  socketRemoteIP: (socket) => {
    let remoteAddress;
    try {
      remoteAddress = socket.handshake.headers["x-forwarded-for"].split(",")[0];
    } catch (error) {
      remoteAddress = socket.handshake.address;
    }
    return remoteAddress;
  },
  upperFirstCharOnly: (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  },
  getRandomSubarray: (arr, size) => {
    let shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  },
  clamp: (min, value, max) => {
    return Math.min(Math.max(value, min), max);
  }
};
