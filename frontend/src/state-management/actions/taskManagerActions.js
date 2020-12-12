import axios from 'axios';
import {
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
    .get(`/api/tasks/info`)
    .then(response => {
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
      dispatch({
        type: SET_TASK_MANAGER_ERROR,
        payload: err.response.data
      });
      console.log(err.response.data);
    });
};
