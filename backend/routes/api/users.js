const router = require('express').Router()
const authController = require('../../controllers/authController');
const usersController = require('../../controllers/usersController');

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
  .route('/:username')
  .get(usersController.findByUsername);

module.exports = router;
