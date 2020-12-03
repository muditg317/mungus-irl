const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schemaToModel = require('.');

const taskSchema = new Schema({
  raspberryPi: {
    type: String,
    required: false
  },
  publicID: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = schemaToModel(taskSchema, 'Task');
