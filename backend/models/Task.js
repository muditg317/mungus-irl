const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schemaToModel = require('.');

const taskSchema = new Schema({
  taskname: {
    type: String,
    required: true
  },
  longName: {
    type: String,
    required: false,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectID,
    ref: 'User',
    required: true
  },
  qrID: {
    type: String,
    required: true
  },
  protected: {
    type: Boolean,
    required: false,
    default: false
  },
  maxTime: {
    type: Number,
    required: true,
    default: 20
  },
  physicalDeviceID: {
    type: String,
    required: false,
    default: ''
  },
  format: {
    type: String,
    required: true,
    enum: ['common','short','long'],//,'multipart'],
    default: 'short'
  },
  predecessorTasks: {
    type: [{
      type: Schema.Types.ObjectID,
      ref: 'Task',
    }],
    required: false,
    default: []
  },
  successorTasks: {
    type: [{
      type: Schema.Types.ObjectID,
      ref: 'Task',
    }],
    required: false,
    default: []
  },
  canBeNonVisual: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

module.exports = schemaToModel(taskSchema, 'Task');
