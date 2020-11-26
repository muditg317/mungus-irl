import React, { useContext } from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { checkValidAuthToken } from 'utils';
import { store } from 'state-management';

const PrivateRoute = ({ children, ...rest }) => {
  const { state } = useContext(store);
  const location = useLocation();
  let { authenticated, verified } = checkValidAuthToken();
  authenticated |= state.auth.isAuthenticated;
  verified |= state.auth.user.verified;
  return (
    <Route {...rest}>
      { authenticated && verified ?
        children
      : <Redirect to={{
        pathname: `/${authenticated ? 'verify' : ''}`,
        privateAccessAttemptFrom: location.pathname
      }} />
      }
    </Route>
  );
};

export default PrivateRoute;
