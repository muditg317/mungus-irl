import React, { useContext, useCallback, useState, useEffect } from 'react';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { checkValidAuthToken, setAuthToken, isDev } from 'utils';
import { RESTRICTED_PAGES } from 'utils';
import { setCurrentUserAction, logoutUserAction } from 'state-management/actions/authActions';

import { store } from 'state-management';

import AppHeader from './app-header';
import AppFooter from './app-footer';
import AuthModal from 'components/authModal';

import About from 'components/about';
import Lobby from 'components/lobby';
import Game from 'components/game';

import PrivateRoute from 'components/private-route';
import TaskManager from 'components/task-manager';
import ViewQrCodes from 'components/setup-tasks';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
library.add(fas, far, fab);


export default function App(props) {
  const { state, dispatch } = useContext(store);
  if (isDev()) {
    window.dispatch = dispatch;
  }
  const setCurrentUser = useCallback((...args) => setCurrentUserAction(dispatch)(...args), [dispatch]);
  const logoutUser = useCallback((...args) => logoutUserAction(dispatch)(...args), [dispatch]);
  const [ registered, setRegistered ] = useState(true);
  const [ showAuthModal, setShowAuthModal ] = useState(false);
  const [ authSuccessRedirect, setAuthSuccessRedirect ] = useState("");
  const history = useHistory();

  useEffect(() => {
    // Check for token to keep user logged in
    const { token, decoded, authenticated } = checkValidAuthToken();
    if (token && decoded) {
      if (authenticated) {
        setAuthToken(token);
        setCurrentUser(decoded);
      } else {
        logoutUser();  // Logout user
        setShowAuthModal(true);
      }
    }
  }, [dispatch, setCurrentUser, logoutUser, setShowAuthModal]);

  const onAuthButtonPress = useCallback((event, authType) => {
    switch (authType) {
      case "SIGN OUT":
        logoutUser(RESTRICTED_PAGES.includes(history.location.pathname) ? history : undefined);
        break;
      case "LOG IN":
        setShowAuthModal(true);
        break;
      default:
        if (state.auth.isAuthenticated) {
          logoutUser(RESTRICTED_PAGES.includes(history.location.pathname) ? history : undefined);
        } else {
          setShowAuthModal(true);
        }
    }
    event.preventDefault();
  }, [state.auth.isAuthenticated, history, logoutUser]);

  const openAuthModal = useCallback((isRegistered, redirectPath) => {
    console.log("open auth modal");
    setRegistered(isRegistered);
    setShowAuthModal(true);
    setAuthSuccessRedirect(redirectPath || "");
  }, []);

  const closeAuthModal = useCallback(() => {
    // console.log("closeAuthModal");
    setAuthSuccessRedirect("");
    setShowAuthModal(false);
  }, []);

  return (
    <div className='h-full flex flex-col' id='app'>
      <Helmet>
        <title>Mungus IRL</title>
      </Helmet>
      <AppHeader {...{onAuthButtonPress}} />
      <main className='flex-grow z-10'>
        <Switch>
          <Route path='/about'>
            <About />
          </Route>
          <Route exact path={['/', '/lobby']}>
            <Lobby {...{openAuthModal}} />
          </Route>
          <Route path='/game'>
            <Game />
          </Route>
          <PrivateRoute path='/task-manager'>
            <TaskManager />
          </PrivateRoute>
          <PrivateRoute path='/setup-tasks'>
            <ViewQrCodes />
          </PrivateRoute>
          <Route path='/'>
            <Redirect to='/' />
          </Route>
        </Switch>
      </main>
      { showAuthModal && <AuthModal {...{shown: showAuthModal, registered, authSuccessRedirect, onExit: closeAuthModal}} /> }
      <AppFooter />
    </div>
  );
}
