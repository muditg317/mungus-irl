import axios from 'axios';
import { isEmpty } from 'utils';
import {
  SET_USER_DATA
} from './types';
import { logoutUserAction } from './authActions';

export const setLoggedInUserDataAction = dispatch => (userAuthToken) => {
  if (isEmpty(userAuthToken)) {
    dispatch({
      type: SET_USER_DATA,
      payload: {}
    });
  }
  const { id: userID, exp: authExpirationTime } = userAuthToken;
  let currentTime = Date.now() / 1000;
  if (authExpirationTime < currentTime) {
    return logoutUserAction(dispatch)();  // Logout user
  }
  axios
    .get(`/api/users/info/${userID}`)
    .then(response => {
      dispatch({
        type: SET_USER_DATA,
        payload: response.data
      });
    })
    .catch(err => {
      console.log(err.response.data);
    });
};
