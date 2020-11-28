const dotenv = require('dotenv');
const _ = require('lodash');

const result = dotenv.config();

let envs;

if (!('error' in result)) {
  envs = result.parsed;
} else {
  envs = {};
  _.each(process.env, (value, key) => { envs[key] = value; });
}

for (let key in envs) {
  try { envs[key] = JSON.parse(envs[key]); } catch (e) { }
}

module.exports = envs;
