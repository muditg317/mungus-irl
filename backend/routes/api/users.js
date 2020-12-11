const authController = require('../../controllers/authController');
const usersController = require('../../controllers/usersController');

const usersRouter = require('express').Router()


usersRouter
  .route('/info/:id')
  .get(usersController.findById);

usersRouter
  .route('/register')
  .post(authController.register);

usersRouter
  .route('/login')
  .post(authController.login);

usersRouter
  .route('/:username')
  .get(usersController.findByUsername);

module.exports = (router, app, server, io) => {
  router.use('/users', usersRouter);
};
