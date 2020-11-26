const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationHashSchema = new Schema({
  user: {
    type: Schema.Types.ObjectID,
    ref: 'User',
    required: true
  },
  hash: {
    type: String,
    required: true
  },
}, {
  timestamps: true
});

const VerificationHashModel = mongoose.model('VerificationHash', verificationHashSchema, 'verificationHashes');

module.exports = VerificationHashModel;
