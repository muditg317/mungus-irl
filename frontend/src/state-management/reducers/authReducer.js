import {
  SET_CURRENT_USER,
  USER_LOADING,
  VERIFYING
} from '../actions/types';
import isEmpty from 'is-empty';
export const initialState = {
  isAuthenticated: false,
  verifying: false,
  user: {},
  loading: false
};
export default function(authState = initialState, action) {
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
    case VERIFYING:
      return {
        ...authState,
        verifying: action.payload
      };
    default:
      return authState;
  }
}
