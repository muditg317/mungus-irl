import { combineReducers } from 'redux';
import authReducer, { initialState as authState } from './authReducer';
import errorReducer, { initialState as errorState } from './errorReducer';
import userReducer, { initialState as userState } from './userReducer';

export const initialState = {
  auth: authState,
  errors: errorState,
  user: userState
};

export default combineReducers({
  auth: authReducer,
  errors: errorReducer,
  user: userReducer,
});
