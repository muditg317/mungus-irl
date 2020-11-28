const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schemaToModel = require('.');

const gameSchema = new Schema({
  host: {
    type: Schema.Types.ObjectID,
    ref: 'User',
    required: true
  },
  password: {
    type: String,
    required: true
  },
  started: {
    type: Boolean,
    required: true,
    default: false
  },
  players: {
    type: [{
      type: String
    }],
    required: true,
    default: []
  },

}, {
  timestamps: true
});

module.exports = schemaToModel(gameSchema, 'Game');
