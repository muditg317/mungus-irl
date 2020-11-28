import { combineReducers } from 'redux';
import authReducer, { initialState as authState } from './authReducer';
import errorReducer, { initialState as errorState } from './errorReducer';
import userReducer, { initialState as userState } from './userReducer';
import lobbyReducer, { initialState as lobbyState } from './lobbyReducer';

export const initialState = {
  auth: authState,
  errors: errorState,
  user: userState,
  lobby: lobbyState
};

export default combineReducers({
  auth: authReducer,
  errors: errorReducer,
  user: userReducer,
  lobby: lobbyReducer
});
