import React, { useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import queryString from 'query-string';
import { store } from 'state-management';
import { setCurrentUserAction, verifyUserAction } from 'state-management/actions/authActions';

const VerifyPage = () => {
  const { state, dispatch } = useContext(store);
  // const setCurrentUser = useCallback((...args) => setCurrentUserAction(dispatch)(...args), [dispatch]);
  const verifyUser = useCallback((...args) => verifyUserAction(dispatch)(...args), [dispatch]);
  const [ verifying, setVerifying ] = useState(false);
  const location = useLocation();
  const searchParams = useMemo(() => queryString.parse(location.search), [location.search]);
  const history = useHistory();
  const match = useRouteMatch('/verify/:hash');

  useEffect(() => {
    // console.log(state.auth.user.verified, history);
    if (state.auth.user.verified) {
      // console.log('user is verified');
      history.push('/dashboard');
    }
  }, [state.auth.user.verified, history]);

  // console.log(require('util').inspect(state.auth, { depth: null }));

  useEffect(() => {
    if (state.auth.isAuthenticated && !state.auth.user.verified) {
      verifyUser((match && match.params.hash) || '', searchParams.force);
    }
  }, [match, verifyUser, searchParams.force, state.auth.isAuthenticated, state.auth.user.verified]);

  useEffect(() => {
    setVerifying(state.auth.verifying);
  }, [state.auth.verifying]);

  useEffect(() => {
    if (verifying) {
      const socket = socketIOClient(location.origin);
      socket.on('verification', data => {
        history.push('/dashboard');
      });
      console.log("connect to socket");
      return () => socket.disconnect();
    }
  }, [verifying, location.origin, history]);

  return (
    <div className='container'>
      <p>Hello {state.auth.user.name}!</p>
      <p>Not you? Click here!</p>
      { verifying ?
        <div>
          <p>You should have received an email to confirm your account.</p>
          <p>Haven't recevied an email? Click here!</p>
        </div>
      : <button>Verify!</button>
      }
    </div>
  );
};

export default VerifyPage;
