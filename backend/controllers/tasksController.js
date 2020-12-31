const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { SECRET_OR_KEY, MONGOOSE_READ_TIMEOUT, MONGOOSE_WRITE_TIMEOUT } = require('../config/env');
const { promiseTimeout, fieldsFromObject, verifyJWTtoken, randStr } = require('../utils');
const User = require('../models/User');
const Task = require('../models/Task');
const validateTaskInput = require('../validation/task');


const taskPayload = task => ({
  id: task.id,
  taskname: task.taskname,
  enabled: task.enabled || false,
  // owner: task.owner,
  qrID: task.qrID,
  maxTime: task.maxTime,
  physicalDeviceID: task.physicalDeviceID,
  format: task.format,
  predecessorTasks: task.predecessorTasks.map(predTask => predTask.taskname),
  successorTasks: task.successorTasks.map(succTask => succTask.taskname),
  canBeNonVisual: task.canBeNonVisual
});

const extractSettings = task => ({
  taskname: task.taskname,
  maxTime: task.maxTime,
  format: task.format,
  predecessorTasks: task.predecessorTasks.map(predTask => predTask.taskname),
  successorTasks: task.successorTasks.map(succTask => succTask.taskname),
  canBeNonVisual: task.canBeNonVisual
});

const applySettings = (target, settings) => {
  target.taskname = settings.taskname,
  target.maxTime = settings.maxTime,
  target.format = settings.format,
  target.predecessorTasks = settings.predecessorTasks.map(predTask => predTask.taskname),
  target.successorTasks = settings.successorTasks.map(succTask => succTask.taskname),
  target.canBeNonVisual = settings.canBeNonVisual
};

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
      const userTasks = await Task.findByOwner(user.id).maxTime(MONGOOSE_READ_TIMEOUT);
      userTasks.forEach(task => {
        if (user.tasks.includes(task.id)) {
          task.enabled = true;
        }
      });
      const mobileTasks = await Task.find({
        '_id': { $in: [...user.tasks] },
        protected: true,
        physicalDeviceID: ''
      }).maxTime(MONGOOSE_READ_TIMEOUT);
      // const tasks = await Promise.all(user.tasks.map(async (taskID) => {
      //   return await Task.findById(taskID).maxTime(MONGOOSE_READ_TIMEOUT);
      // }));
      // console.log(userTasks);
      // console.log(user);
      // console.log(user.tasks);
      // console.log(tasks.map(task => `${task.owner._id}` === `${user.id}`));
      // console.log(user.id, user._id);
      const userTasksPayload = userTasks.map(task => taskPayload(task));
      const mobileTasksPayload = mobileTasks.map(task => task.id);
      return response.status(200).json({
        userTasks: userTasksPayload,
        mobileTasks: mobileTasksPayload
      });
    } catch (error) {
      console.error(error);
      return response.status(503).json({ error });
    }
  },
  mobileTaskInfo: async (request, response) => {
    try {
      // if (!request.headers.authorization) {
      //   return response.status(403).json({ error: 'No credentials sent!' });
      // }
      // const { id: ownerID, username: tokenUsername } = verifyJWTtoken(request.headers.authorization.slice(request.headers.authorization.indexOf(' ')+1));
      // const user = await User.findById(ownerID).maxTime(MONGOOSE_READ_TIMEOUT);
      // console.log(ownerID, tokenUsername, user);
      // if (!user || user.username !== tokenUsername) {
      //   return response.status(403).json({ authorization: `Invalid auth token` });
      // }
      // const userTasks = await Task.findByOwner(user.id).maxTime(MONGOOSE_READ_TIMEOUT);
      // userTasks.forEach(task => {
      //   if (user.tasks.includes(task.id)) {
      //     task.enabled = true;
      //   }
      // });
      const mobileTasks = await Task.find({
        protected: true,
        physicalDeviceID: ''
      }).maxTime(MONGOOSE_READ_TIMEOUT);
      // const tasks = await Promise.all(user.tasks.map(async (taskID) => {
      //   return await Task.findById(taskID).maxTime(MONGOOSE_READ_TIMEOUT);
      // }));
      // console.log(userTasks);
      // console.log(user);
      // console.log(user.tasks);
      // console.log(tasks.map(task => `${task.owner._id}` === `${user.id}`));
      // console.log(user.id, user._id);
      const mobileTasksPayload = mobileTasks.map(task => taskPayload(task));
      return response.status(200).json({
        mobileTaskInfo: mobileTasksPayload
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

      // console.log("user task data", userTaskData);

      const oldTasks = await Task.findByOwner(user.id).maxTime(MONGOOSE_READ_TIMEOUT);
      // if (tasks.length) {
      //   return response.status(400).json({ qrID: `qrID already exists` });
      // }

      const tasksToCreate = [...userTaskData];
      const updatedTasks = [];
      const tasksToDelete = [];
      oldTasks.forEach(oldTask => {
        const taskDataIndex = tasksToCreate.findIndex(userTask => userTask.id === oldTask.id);
        if (taskDataIndex !== -1) {
          const taskDatum = tasksToCreate.splice(taskDataIndex, 1)[0];
          applySettings(oldTask, taskDatum);
          updatedTasks.push(oldTask);
          // updatedTasks.push({...oldTask, ...extractSettings(userTaskDatum)});
        } else {
          tasksToDelete.push(oldTask);
        }
      }, []);


      // TODO: ADD QR ID AND DEVICE ID TO TASK DATA
      tasksToCreate.forEach(task => {
        task.qrID = task.qrID || randStr(7);
        task.physicalDeviceID = task.physicalDeviceID || randStr(30, 'aA0$');
      });
      const newTasks = tasksToCreate.map(taskDatum => new Task({...taskDatum, owner: user._id}));

      const savedTasks = await Promise.all([...updatedTasks, ...newTasks].map(async (newTask) => await newTask.save({wtimeout: MONGOOSE_WRITE_TIMEOUT})));
      // console.log('saved tasks', savedTasks);

      // TODO: be more efficient than deleting everything lmao
      const deleted = await Task.deleteMany({
        "_id": { $in: tasksToDelete.map(task => task._id) },
        "protected": false
      }, {wtimeout: MONGOOSE_WRITE_TIMEOUT});
      // console.log("TASKS DELETED===", user, deleted, "========Tasks deleted ^^=======");

      // const userTaskDataIDs = userTaskData.oldTasks.map(task => task.id);
      const newUserTasks = savedTasks.reduce((filtered, savedTask) => {
        const userTaskDatum = userTaskData.find(userTask => userTask.taskname === savedTask.taskname && userTask.maxTime === savedTask.maxTime);
        // if (userTaskDatum.enabled) {
          // console.log(filtered, userTaskDatum);
        savedTask.enabled = userTaskDatum.enabled;
        // }
        filtered.push(savedTask);
        return filtered;
      }, []);
      user.tasks = newUserTasks.map(task => task._id);

      let mobileTasks;
      if (request.body.mobileTaskIDs) {
        const mobileTaskIDs = JSON.parse(request.body.mobileTaskIDs);
        // console.log("mobile task IDS!", mobileTaskIDs);
        mobileTasks = await Task.find().where('_id').in(mobileTaskIDs).maxTime(MONGOOSE_READ_TIMEOUT).exec();
        if (!mobileTasks) { // || mobileTasks.length !== mobileTaskIDs.length) {
          return response.status(403).json({ mobileTasks: `ID invalid` });
        }
        user.tasks.push(...mobileTasks.map(mobileTask => mobileTask._id));
      }

      // console.log("presaving", user, "\npresaved tasks:", user.tasks);
      const savedUser = await user.save({wtimeout: MONGOOSE_WRITE_TIMEOUT});
      // console.log("NEW TASKS UPDATED", savedUser, "=========New tasks updated ^^=====");

      const userTasksPayload = newUserTasks.map(savedTask => taskPayload(savedTask));
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
