const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { SECRET_OR_KEY, MONGOOSE_READ_TIMEOUT, MONGOOSE_WRITE_TIMEOUT } = require('../config/env');
const { promiseTimeout, fieldsFromBody, verifyJWTtoken, randStr } = require('../utils');
const User = require('../models/User');
const Task = require('../models/Task');
const validateTaskInput = require('../validation/task');


const taskPayload = task => ({
  id: task.id,
  taskname: task.taskname,
  // owner: task.owner,
  qrID: task.qrID,
  maxTime: task.maxTime,
  physical: task.physical,
  format: task.format,
  predecessorTasks: task.predecessorTasks.map(predTask => predTask.taskname),
  successorTasks: task.successorTasks.map(succTask => succTask.taskname),
  canBeNonVisual: task.canBeNonVisual
});

module.exports = {
  info: async (request, response) => {
    try {
      if (!request.headers.authorization) {
        return response.status(403).json({ error: 'No credentials sent!' });
      }
      const { id: ownerID, username: tokenUsername } = verifyJWTtoken(request.headers.authorization.slice(request.headers.authorization.indexOf(' ')+1));
      const user = await User.findById(ownerID).maxTime(MONGOOSE_READ_TIMEOUT);
      // console.log(ownerID, tokenUsername, user);
      if (!user || user.username !== tokenUsername) {
        return response.status(403).json({ authorization: `Invalid auth token` });
      }
      const tasks = await Promise.all(user.tasks.map(async (taskID) => {
        return await Task.findById(taskID).maxTime(MONGOOSE_READ_TIMEOUT);
      }));
      console.log(tasks);
      console.log(user);
      console.log(user.tasks);
      // console.log(tasks.map(task => `${task.owner._id}` === `${user.id}`));
      // console.log(user.id, user._id);
      const userTasks = tasks.filter(task => `${task.owner._id}` === `${user.id}`).map(task => taskPayload(task));
      const mobileTasks = tasks.filter(task => `${task.owner._id}` !== `${user.id}`).map(task => task.id);
      return response.status(200).json({
        userTasks,
        mobileTasks
      });
    } catch (error) {
      console.error(error);
      return response.status(503).json({ error });
    }
  },
  update: async (request, response) => {
    try {
      if (!request.headers.authorization) {
        return response.status(403).json({ error: 'No credentials sent!' });
      }
      let { id: ownerID, username: tokenUsername } = verifyJWTtoken(request.headers.authorization.slice(request.headers.authorization.indexOf(' ')+1));
      if (!request.body.userTaskData) {
        // console.log(require('util').inspect(request.body, { depth: null }));
        return response.status(403).json({ tasks: 'No task data sent!' });
      }
      // console.log("USER TASK DATA",typeof request.body.userTaskData, request.body.userTaskData);
      // console.log(require('util').inspect(request.body.userTaskData, { depth: null }));
      const userTaskData = JSON.parse(request.body.userTaskData);
      const errorResults = userTaskData.map(validateTaskInput);
      const errors = errorResults.map(errorResult => errorResult.errors);
      const isValids = errorResults.map(errorResult => errorResult.isValid);
      if (isValids.some(isValid => !isValid)) {
        return response.status(403).json({ tasks: errors });
      }
      const user = await User.findById(ownerID).maxTime(MONGOOSE_READ_TIMEOUT);
      if (!user || user.username !== tokenUsername) {
        return response.status(403).json({ authorization: `Invalid auth token` });
      }

      const oldTasks = await Task.findByOwner(user.id).maxTime(MONGOOSE_READ_TIMEOUT);
      // if (tasks.length) {
      //   return response.status(400).json({ qrID: `qrID already exists` });
      // }

      // TODO: ADD QR ID AND DEVICE ID TO TASK DATA
      userTaskData.forEach(task => {
        task.qrID = task.qrID || randStr(7);
        task.physicalDeviceID = task.physicalDeviceID || randStr(30, 'aA0$');
      });
      const newTasks = userTaskData.map(taskDatum => new Task({...taskDatum, owner: user._id}));

      const savedTasks = await Promise.all(newTasks.map(async (newTask) => await newTask.save({wtimeout: MONGOOSE_WRITE_TIMEOUT})));
      console.log('registered', savedTasks);

      // TODO: be more efficient than deleting everything lmao
      const deleted = await Task.deleteMany({
        "_id": { $in: oldTasks.map(task => task._id) },
        "protected": false
      }, {wtimeout: MONGOOSE_WRITE_TIMEOUT});
      console.log("TASKS DELETED===", user, deleted, "========Tasks deleted ^^=======");


      user.tasks = savedTasks.map(savedTask => savedTask._id);

      let mobileTasks;
      if (request.body.mobileTaskIDs) {
        const mobileTaskIDs = JSON.parse(request.body.mobileTaskIDs);
        mobileTasks = await Task.find().where('_id').in(mobileTaskIDs).maxTime(MONGOOSE_READ_TIMEOUT).exec();
        if (!mobileTasks || mobileTasks.length !== mobileTaskIDs.length) {
          return response.status(403).json({ mobileTasks: `ID invalid` });
        }
        user.tasks = user.tasks.concat(mobileTaskIDs.map(mobileTaskID => mongoose.Types.ObjectId(mobileTaskID)));
      }

      const savedUser = await user.save({wtimeout: MONGOOSE_WRITE_TIMEOUT});
      console.log("NEW TASKS UPDATED", savedUser, "=========New tasks updated ^^=====");

      const userTasksPayload = savedTasks.map(savedTask => taskPayload(savedTask));
      const mobileTasksPayload = mobileTasks && mobileTasks.map(mobileTask => mobileTask.id);
      response.json({
        userTasks: userTasksPayload,
        mobileTasks: mobileTasksPayload
      });
    } catch (error) {
      console.error(error);
      return response.status(503);
    } finally {

    }
  }
};
