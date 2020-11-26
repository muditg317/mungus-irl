import React, { useContext } from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { checkValidAuthToken } from 'utils';
import { store } from 'state-management';

const PrivateRoute = ({ children, ...rest }) => {
  const { state } = useContext(store);
  const location = useLocation();
  let { authenticated } = checkValidAuthToken();
  authenticated |= state.auth.isAuthenticated;
  return (
    <Route {...rest}>
      { authenticated ?
        children
      : <Redirect to={{
        pathname: '/',
        privateAccessAttemptFrom: location.pathname
      }} />
      }
    </Route>
  );
};

export default PrivateRoute;
