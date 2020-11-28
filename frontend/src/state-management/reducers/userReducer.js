import { SET_USER_DATA } from '../actions/types';
export const initialState = {};
const userReducer = (userState = initialState, action) => {
  switch (action.type) {
    case SET_USER_DATA:
      return {
        ...action.payload
      };
    default:
      return userState;
  }
};

export default userReducer;
