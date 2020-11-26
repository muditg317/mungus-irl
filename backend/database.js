const { MONGODB_URI } = require('./config/env');
const mongoose = require('mongoose');

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
  .then(() => console.log('Database Connected Successfully'))
  .catch(err => console.log(err));
