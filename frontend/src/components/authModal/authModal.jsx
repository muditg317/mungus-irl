import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isEmpty } from 'utils';
import { loginUserAction, registerUserAction, clearErrorsAction } from 'state-management/actions/authActions';
import { store } from 'state-management';

import LoginForm from './login';
import RegisterForm from './register';

const AuthModal = ({ shown, registered: isRegistered, onExit, authSuccessRedirect }) => {
  const { state, dispatch } = useContext(store);
  const loginUser = useCallback((...args) => loginUserAction(dispatch)(...args), [dispatch]);
  const registerUser = useCallback((...args) => registerUserAction(dispatch)(...args), [dispatch]);
  const clearErrors = useCallback((...args) => clearErrorsAction(dispatch)(...args), [dispatch]);
  const { errors } = state;
  const [ registered, setRegistered ] = useState(true);
  const [ username, setUsername ] = useState(state.user.username || '');
  const [ password, setPassword ] = useState('');
  const [ confirmPassword, setConfirmPassword ] = useState('');
  const modalOverlayRef = useRef(null);
  const modalContainerRef = useRef(null);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    setRegistered(isRegistered);
  }, [isRegistered]);

  const clearFields = useCallback(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  useEffect(() => {
    if (!shown) {
      clearFields();
      clearErrors();
    }
  }, [shown, clearFields, clearErrors]);

  useEffect(() => {
    if (shown && state.auth.isAuthenticated) {
      if (registered) {
        const loginRedirect = authSuccessRedirect || (location.pathname === '/' && '/dashboard');
        loginRedirect && history.push(loginRedirect);
      } else {
        history.push(authSuccessRedirect || '/dashboard');
      }
      onExit();
    }
  }, [shown, history, state, onExit, authSuccessRedirect, registered, location.pathname]);

  const checkOverlayClick = (event) => {
    if (modalOverlayRef.current && modalOverlayRef.current === event.target && shown) {
        onExit();
        event.preventDefault();
    }
  }

  // console.log("autoRedirrect?", authSuccessRedirect, "prev errors", errors);
  const checkGlobalErrors = () => {
    if (authSuccessRedirect) {
      isEmpty(errors) && (errors.globalError = `You will be redirected to ${authSuccessRedirect.slice(1)} once authenticated.`);
    } else {
      delete errors.globalError;
    }
  };
  checkGlobalErrors();

  useEffect(() => {
    const escapePressedHandler = event => {
      event = event || window.event;
      let isEscape = false;
      if ('key' in event) {
        isEscape = (event.key === 'Escape' || event.key === 'Esc')
      } else {
        isEscape = (event.keyCode === 27)
      }
      if (isEscape && shown) {
        onExit();
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', escapePressedHandler);
    return () => {
      document.removeEventListener('keydown', escapePressedHandler);
    }
  }, [onExit, shown]);

  const doRegister = () => {
    clearErrors();
    setRegistered(false);
  };

  const doLogin = () => {
    clearErrors();
    setRegistered(true);
  };

  const sendLoginRequest = useCallback(() => {
    const userData = {
      username, password,
    };
    loginUser(userData, history, authSuccessRedirect);
  }, [history, authSuccessRedirect, loginUser, username, password]);

  const sendRegisterRequest = useCallback(() => {
    const newUser = {
      username, password, confirmPassword
    };
    registerUser(newUser, history, authSuccessRedirect);
  }, [registerUser, history, authSuccessRedirect, username, password, confirmPassword]);

  const submitAuthRequest = useCallback(() => {
    registered ? sendLoginRequest() : sendRegisterRequest();
  }, [registered, sendLoginRequest, sendRegisterRequest]);

  return (
    <div className={`modal ${shown ? 'modal-active' : 'modal-inactive'}`}>
      <div className='modal-overlay' onClick={checkOverlayClick} ref={modalOverlayRef}></div>

      <div className='modal-container' ref={modalContainerRef} >

        <div onClick={onExit} className='modal-window-close'>
          <FontAwesomeIcon icon={['far','times-circle']} size='lg' />
          <span className='text-sm'>(Esc)</span>
        </div>

        <div className='modal-content'>
          <div className='modal-header'>
            <p className='modal-title'>Sign up/Log in</p>
            <div onClick={onExit} className='modal-modal-close'>
              <FontAwesomeIcon icon={['far','times-circle']} size='lg' />
            </div>
          </div>
          <div className='modal-body'>
            <ul className='tabs'>
              <li className={`tab${registered ? ' active' : ''}`}>
                <span className='tab-title' onClick={() => setRegistered(true)}>Log in</span>
              </li>
              <li className={`tab${registered ? '' : ' active'}`}>
                <span className='tab-title' onClick={() => setRegistered(false)}>Sign up</span>
              </li>
            </ul>
            { registered ?
              <LoginForm {...{submitAuthRequest, doRegister, onExit, username, setUsername, password, setPassword, errors}} className={`${registered ? 'block' : 'hidden'}`} />
            : <RegisterForm {...{submitAuthRequest, doLogin, onExit, username, setUsername, password, setPassword, errors, confirmPassword, setConfirmPassword}} className={`${!registered ? 'block' : 'hidden'}`} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
