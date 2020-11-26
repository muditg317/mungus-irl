import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { setAuthToken } from 'utils';
import {
  GET_ERRORS,
  SET_CURRENT_USER,
  USER_LOADING,
  VERIFYING
} from './types';
import { setLoggedInUserDataAction } from './userActions';


// Register User
export const registerUserAction = dispatch => (userData, history, authSuccessRedirect) => {
  axios
    .post('/api/users/register', userData)
    .then(response => {
      // Save to localStorage
      // Set token to localStorage
      const { token } = response.data;
      localStorage.setItem('jwtToken', token);
      // Set token to Auth header
      setAuthToken(token);
      // Decode token to get user data
      const decoded = jwt_decode(token);
      // Set current user
      setCurrentUserAction(dispatch)(decoded);
      clearErrorsAction(dispatch)();
      history.push(authSuccessRedirect || '/dashboard');
    }) // re-direct to login on successful register
    .catch(err =>
      console.log(err) ||
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};
// Login - get user token
export const loginUserAction = dispatch => (userData, history, authSuccessRedirect) => {
  axios
    .post('/api/users/login', userData)
    .then(response => {
      // Save to localStorage
      // Set token to localStorage
      const { token } = response.data;
      localStorage.setItem('jwtToken', token);
      // Set token to Auth header
      setAuthToken(token);
      // Decode token to get user data
      const decoded = jwt_decode(token);
      // Set current user
      setCurrentUserAction(dispatch)(decoded);
      clearErrorsAction(dispatch)();
      authSuccessRedirect && history.push(authSuccessRedirect);
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};
// Log user out
export const logoutUserAction = dispatch => (history) => {
  localStorage.removeItem('jwtToken');  // Remove token from local storage
  setAuthToken(false);  // Remove auth header for future requests
  setCurrentUserAction(dispatch)({});  // Set current user to empty object {} which will set isAuthenticated to false
  if (history) {
    history.push('/');
  }
};

// Set logged in user
export const setCurrentUserAction = dispatch => decoded => {
  dispatch({
    type: SET_CURRENT_USER,
    payload: decoded
  });
  setLoggedInUserDataAction(dispatch)(decoded);
};
// User loading
export const setUserLoadingAction = dispatch => () => {
  dispatch({
    type: USER_LOADING
  });
};

// Clear error state
export const clearErrorsAction = dispatch => () => {
  dispatch({
    type: GET_ERRORS,
    payload: {}
  });
}


export const verifyUserAction = dispatch => (hash, force) => {
  console.log("attempt verify");
  if (hash) {
    axios
      .post(`/api/users/verify/${hash}`)
      .then(response => {
        // Save to localStorage
        // Set token to localStorage
        const { token } = response.data;
        localStorage.setItem('jwtToken', token);
        // Set token to Auth header
        setAuthToken(token);
        // Decode token to get user data
        const decoded = jwt_decode(token);
        // Set current user
        setCurrentUserAction(dispatch)(decoded);
      })
      .catch(err => {
        console.log(err.response.data);
      });
  } else {
    axios
      .post(`/api/users/verify?force=${force}`)
      .then(response => {
        // console.log("verification request success", response.data);
        if (response.data.success) {
          // console.log('already verified');
          const { token } = response.data;
          localStorage.setItem('jwtToken', token);
          // Set token to Auth header
          setAuthToken(token);
          // Decode token to get user data
          const decoded = jwt_decode(token);
          // Set current user
          return setCurrentUserAction(dispatch)(decoded);
        }
        dispatch({
          type: VERIFYING,
          payload: response.data.pendingVerification
        });
      })
      .catch(err => {
        // console.log(err);
        console.log(err.response.data);
      })
  }
};
