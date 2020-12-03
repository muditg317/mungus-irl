const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  hosting: {
    type: Boolean,
    required: true,
    default: false
  },
  tasks: {
    type: [{
      type: Schema.Types.ObjectID,
      ref: 'Task',
    }],
    required: true,
    default: []
  },
}, {
  timestamps: true
});

Array.prototype.forEach.call(userSchema.requiredPaths(), requiredField => {
  let capitalizedFieldName = requiredField.charAt(0).toUpperCase() + requiredField.slice(1);
  userSchema.static(`findBy${capitalizedFieldName}`, function(fieldValue) { return this.find({ [requiredField]: fieldValue }); });
  userSchema.static(`findOneBy${capitalizedFieldName}`, function(fieldValue) { return this.findOne({ [requiredField]: fieldValue }); });
});

const UserModel = mongoose.model('User', userSchema, 'users');

module.exports = UserModel;
