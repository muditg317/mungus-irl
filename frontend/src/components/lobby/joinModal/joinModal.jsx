import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { useHistory, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { handleChange } from 'utils';
// import { loginUserAction, registerUserAction, clearErrorsAction } from 'state-management/actions/authActions';
// import { store } from 'state-management';

const JoinModal = ({ shown, username, setUsername, attemptJoin, onExit }) => {
  const { hostname, joinError } = (typeof shown) === "string" ? { hostname: shown } : shown;
  console.log(`joinError: ${joinError}\nusername:${username}`);
  shown = !!shown;
  // const { state, dispatch } = useContext(store);
  // const loginUser = useCallback((...args) => loginUserAction(dispatch)(...args), [dispatch]);
  // const registerUser = useCallback((...args) => registerUserAction(dispatch)(...args), [dispatch]);
  // const clearErrors = useCallback((...args) => clearErrorsAction(dispatch)(...args), [dispatch]);
  // const { errors } = state;
  // const [ username, setUsername ] = useState(providedUsername || '');
  const [ passcode, setPasscode ] = useState('');
  const passcodeRef = useRef(null);
  const modalOverlayRef = useRef(null);
  const modalContainerRef = useRef(null);
  // const history = useHistory();
  // const location = useLocation();

  const clearFields = useCallback(() => {
    setPasscode('');
  }, []);

  useEffect(() => {
    if (!shown) {
      clearFields();
    } else {
      passcodeRef.current && passcodeRef.current.focus();
    }
  }, [shown, clearFields, passcodeRef]);

  const checkOverlayClick = (event) => {
    if (modalOverlayRef.current && modalOverlayRef.current === event.target && shown) {
        onExit();
        event.preventDefault();
    }
  }


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

  const submitJoinRequest = useCallback(() => {
    attemptJoin(hostname, passcode);
  }, [attemptJoin, hostname, passcode]);

  const handleEnterPressed = useCallback(event => {
    if (event.key === 'Enter') {
      submitJoinRequest();
      event.preventDefault();
    }
  }, [submitJoinRequest]);

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
            <p className='modal-title'>Join {`${hostname}'s`} game</p>
            <div onClick={onExit} className='modal-modal-close'>
              <FontAwesomeIcon icon={['far','times-circle']} size='lg' />
            </div>
          </div>
          <div className='modal-body'>
            <div className={`container bg-white shadow-md rounded rounded-t-none px-8 pt-6 pb-8 mb-4 block`}>
              <div className="form" role="form">
                { joinError && <p className="form-error">{joinError}</p> }
                <div className="form-field">
                  <label className="field-label">
                    Username
                  </label>
                  <input onChange={handleChange(setUsername, 15)} onKeyPress={handleEnterPressed} value={username} className={`field-input field-input-text`} id="username" type="text" placeholder="Username" />
                </div>
                <div className="form-field">
                  <label className="field-label">
                    Passcode
                  </label>
                  <input ref={passcodeRef} onChange={handleChange(setPasscode, 5)} onKeyPress={handleEnterPressed} value={passcode} className={`field-input field-input-text`} id="passcode" type="passcode" placeholder="******************" />
                </div>
                <div className="form-footer">
                  <button onClick={submitJoinRequest} className="form-submit" type="button">
                    Join Game!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinModal;
