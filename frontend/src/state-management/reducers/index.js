import { combineReducers } from 'redux';
import authReducer, { initialState as authState } from './authReducer';
import errorReducer, { initialState as errorState } from './errorReducer';
import userReducer, { initialState as userState } from './userReducer';
import lobbyReducer, { initialState as lobbyState } from './lobbyReducer';
import taskManagerReducer, { initialState as taskManagerState } from './taskManagerReducer';

export const initialState = {
  auth: authState,
  errors: errorState,
  user: userState,
  lobby: lobbyState,
  taskManager: taskManagerState,
};

export default combineReducers({
  auth: authReducer,
  errors: errorReducer,
  user: userReducer,
  lobby: lobbyReducer,
  taskManager: taskManagerReducer
});
