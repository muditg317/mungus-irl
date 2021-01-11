import axios from 'axios';
import {
  SET_MOBILE_TASK_INFO,
  SET_TASK_MANAGER_DATA,
  SET_TASK_MANAGER_ERROR
} from './types';

export const pullTaskManagerDataAction = dispatch => (clearErrors = false) => {
  if (clearErrors) {
    dispatch({
      type: SET_TASK_MANAGER_ERROR,
      payload: {}
    });
  }
  axios
    .get(`/api/tasks/mobile-task-info`)
    .then(response => {
      // console.log(response);
      dispatch({
        type: SET_MOBILE_TASK_INFO,
        payload: response.data
      });
    })
    .catch(err => {
      console.log(err.response.data);
    });
  axios
    .get(`/api/tasks/info`)
    .then(response => {
      response.data.userTasks.forEach(task => (task.saved = true));
      // response.data.userTasks.sort((t1, t2) => t1.taskname.localeCompare(t2.taskname));
      // console.log(response);
      dispatch({
        type: SET_TASK_MANAGER_DATA,
        payload: response.data
      });
    })
    .catch(err => {
      console.log(err.response.data);
    });
};

export const updateTaskManagerDataAction = dispatch => (taskData, successCallback) => {
  // console.log(taskData);
  // console.log(JSON.stringify(taskData));
  for (let key in taskData) {
    taskData[key] = JSON.stringify(taskData[key]);
  }
  // console.log(taskData);
  // console.log(JSON.stringify(taskData));
  axios
    .post(`/api/tasks/update`, taskData)
    .then(response => {
      // console.log(response);
      response.data.userTasks.forEach(task => (task.saved = true));
      dispatch({
        type: SET_TASK_MANAGER_DATA,
        payload: response.data
      });
      dispatch({
        type: SET_TASK_MANAGER_ERROR,
        payload: {}
      });
      successCallback();
    })
    .catch(err => {
      console.log(err);
      dispatch({
        type: SET_TASK_MANAGER_ERROR,
        payload: err.response.data
      });
      console.log(err.response.data);
    });
};
