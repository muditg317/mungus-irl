const router = require('express').Router()
const authController = require('../../controllers/authController');
const usersController = require('../../controllers/usersController');
const userVerificationController = require('../../controllers/userVerificationController');

router
  .route('/info/:id')
  .get(usersController.findById);

router
  .route('/register')
  .post(authController.register);

router
  .route('/login')
  .post(authController.login);

router
  .route('/verify')
  .post(userVerificationController.verify);

router
  .route('/verify/:hash')
  .post(userVerificationController.verify);

module.exports = router;
