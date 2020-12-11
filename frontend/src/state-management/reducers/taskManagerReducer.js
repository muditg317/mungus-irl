import { SET_TASK_MANAGER_DATA, SET_TASK_MANAGER_ERROR } from '../actions/types';
export const initialState = {
  userTasks: [],
  mobileTasks: [],
  errors: {}
};
const userReducer = (userState = initialState, action) => {
  switch (action.type) {
    case SET_TASK_MANAGER_DATA:
      return {
        ...userState,
        ...action.payload
      };
    case SET_TASK_MANAGER_ERROR:
      return {
        ...userState,
        errors: action.payload || {}
      };
    default:
      return userState;
  }
};

export default userReducer;
