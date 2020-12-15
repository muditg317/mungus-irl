const tasksController = require('../../controllers/tasksController');

const tasksRouter = require('express').Router()


tasksRouter
  .route('/info')
  .get(tasksController.info);

tasksRouter
  .route('/mobile-task-info')
  .get(tasksController.mobileTaskInfo);

tasksRouter
  .route('/update')
  .post(tasksController.update);

module.exports = (router, app, server, io) => {
  router.use('/tasks', tasksRouter);
};
