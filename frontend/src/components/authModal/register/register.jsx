import React, { useCallback } from 'react';

const handleChange = setter => event => {
  setter(event.target.value);
}

export default function RegisterForm({ className, email, setEmail, firstName, setFirstName, lastName, setLastName, flo, setFlo, password, setPassword, confirmPassword, setConfirmPassword, errors, doLogin, submitAuthRequest}) {

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
          <div className='form-row'>
            <div className='form-field'>
              <label className='field-label'>
                First Name
              </label>
              <input onChange={handleChange(setFirstName)} onKeyPress={handleEnterPressed} value={firstName} className={`field-input field-input-text ${errors.firstName ? 'error' : ''}`} id='firstName' type='text' placeholder='First Name' />
              { errors.firstName && <p className='field-error'>{errors.firstName}</p> }
            </div>
            <div className='form-field'>
              <label className='field-label'>
                Last Name
              </label>
              <input onChange={handleChange(setLastName)} onKeyPress={handleEnterPressed} value={lastName} className={`field-input field-input-text ${errors.lastName ? 'error' : ''}`} id='lastName' type='text' placeholder='Last Name' />
              { errors.lastName && <p className='field-error'>{errors.lastName}</p> }
            </div>
          </div>
          <div className='form-field'>
            <label className='field-label'>
              Email
            </label>
            <input onChange={handleChange(setEmail)} onKeyPress={handleEnterPressed} value={email} className={`field-input field-input-text ${errors.email ? 'error' : ''}`} id='email' type='text' placeholder='Email' />
            { errors.email && <p className='field-error'>{errors.email}</p> }
          </div>
          <div className='form-field'>
            <label className='field-label'>
              FLO
            </label>
            <select onChange={handleChange(setFlo)} value={flo || ''} className={`field-input field-input-text ${errors.flo ? 'error' : ''}`} id='flo'>
              <option value='' hidden> select an option </option>
              <option value='EL'>Emerging Leaders</option>
              <option value='FAB'>First-Year Activities Board</option>
              <option value='FLI'>First-Year Leadership Initiative</option>
            </select>
            { errors.flo && <p className='field-error'>{errors.flo}</p> }
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
