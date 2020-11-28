import {
  SET_CURRENT_USER,
  USER_LOADING
} from '../actions/types';
import isEmpty from 'is-empty';
export const initialState = {
  isAuthenticated: false,
  user: {},
  loading: false
};
const authReducer = (authState = initialState, action) => {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...authState,
        isAuthenticated: !isEmpty(action.payload),
        user: action.payload
      };
    case USER_LOADING:
      return {
        ...authState,
        loading: true
      };
    default:
      return authState;
  }
};

export default authReducer;
