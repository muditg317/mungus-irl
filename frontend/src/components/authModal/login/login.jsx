import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';

const handleChange = setter => event => {
  setter(event.target.value);
}

export default function LoginForm({ className, email, setEmail, password, setPassword, errors, doRegister, onExit, submitAuthRequest}) {

  const handleEnterPressed = useCallback(event => {
    if (event.key === 'Enter') {
      submitAuthRequest();
      event.preventDefault();
    }
  }, [submitAuthRequest]);

  return (
    <>
      <div className={`container bg-white shadow-md rounded rounded-t-none px-8 pt-6 pb-8 mb-4 ${className}`}>
        <div className="form" role="form">
          { errors.verification !== undefined && <div className="flex flex-row items-center">
            <p className="form-error">{errors.verification}</p><Link to="/verify" onClick={onExit} className="bg-purple-500 text-white font-bold py-2 px-4 rounded">Verify</Link>
          </div> }
          { errors.globalError && <p className="form-error">{errors.globalError}</p> }
          <div className="form-field">
            <label className="field-label">
              Email
            </label>
            <input onChange={handleChange(setEmail)} onKeyPress={handleEnterPressed} value={email} className={`field-input field-input-text ${errors.email ? "error" : ""}`} id="email" type="text" placeholder="Email" />
            { errors.email && <p className="field-error">{errors.email}</p> }
          </div>
          <div className="form-field">
            <label className="field-label">
              Password
            </label>
            <input onChange={handleChange(setPassword)} onKeyPress={handleEnterPressed} value={password} className={`field-input field-input-text ${errors.password ? "error" : ""}`} id="password" type="password" placeholder="******************" />
            { errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="form-footer">
            <button onClick={submitAuthRequest} className="form-submit" type="button">
              Log In
            </button>
            <button onClick={doRegister} className="form-unapplicable-text">
              Don't have an account?
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
