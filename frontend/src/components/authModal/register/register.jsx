import React, { useCallback } from 'react';

import { handleChange } from 'utils';

export default function RegisterForm({ className, username, setUsername, password, setPassword, confirmPassword, setConfirmPassword, errors, doLogin, submitAuthRequest}) {

  const handleEnterPressed = useCallback(event => {
    if (event.key === 'Enter') {
      submitAuthRequest();
      event.preventDefault();
    }
  }, [submitAuthRequest]);

  return (
    <>
      <div className={`container bg-white shadow-md rounded rounded-t-none px-8 pt-6 pb-8 mb-4 ${className}`}>
        <div className='form' role='form'>
          { errors.globalError && <p className="form-error">{errors.globalError}</p> }
          <div className='form-field'>
            <label className='field-label'>
              Username
            </label>
            <input onChange={handleChange(setUsername, 15)} onKeyPress={handleEnterPressed} value={username} className={`field-input field-input-text ${errors.username ? 'error' : ''}`} id='username' type='text' placeholder='Username' />
            { errors.username && <p className='field-error'>{errors.username}</p> }
          </div>
          <div className='form-field'>
            <label className='field-label'>
              Password
            </label>
            <input onChange={handleChange(setPassword)} onKeyPress={handleEnterPressed} value={password} className={`field-input field-input-text ${errors.password ? 'error' : ''}`} id='password' type='password' placeholder='******************' />
            { errors.password && <p className='field-error'>{errors.password}</p>}
          </div>
          <div className='form-field'>
            <label className='field-label'>
              Confirm Password
            </label>
            <input onChange={handleChange(setConfirmPassword)} onKeyPress={handleEnterPressed} value={confirmPassword} className={`field-input field-input-text ${errors.confirmPassword ? 'error' : ''}`} id='confirmPassword' type='password' placeholder='******************' />
            { errors.confirmPassword && <p className='field-error'>{errors.confirmPassword}</p>}
          </div>
          <div className='form-footer'>
            <button onClick={submitAuthRequest} className='form-submit' type='button'>
              Sign Up
            </button>
            <button onClick={doLogin} className='form-unapplicable-text'>
              Already have an account?
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
