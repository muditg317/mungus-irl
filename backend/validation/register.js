const Validator = require('validator');
const isEmpty = require('is-empty');
module.exports = function validateRegisterInput(data) {
  let errors = {};
  // Convert empty fields to an empty string so we can use validator functions
  data.username = !isEmpty(data.username) ? data.username : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.confirmPassword = !isEmpty(data.confirmPassword) ? data.confirmPassword : '';
  // Username checks
  if (Validator.isEmpty(data.username)) {
    errors.username = 'Username field is required';
  } else if (data.username.search(/^[a-zA-Z0-9-_]+$/) === -1) {
    errors.username = 'Username is invalid (must contain only a-z A-Z 0-9 _ -)';
  }
  // Password checks
  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }
  if (Validator.isEmpty(data.confirmPassword)) {
    errors.confirmPassword = 'Confirm password field is required';
  }
  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = data.password.length <= 30 ? 'Password must be at least 6 characters' : 'Password must be at most 30 characters';
  }
  if (!Validator.equals(data.password, data.confirmPassword)) {
    errors.confirmPassword = 'Passwords must match';
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
