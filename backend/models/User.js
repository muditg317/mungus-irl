const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  verified: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  flo: {
    type: String,
    required: true
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
