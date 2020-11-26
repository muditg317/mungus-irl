import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom";

import logo from 'assets/images/EL-logo.png';

import { store } from 'state-management';


export default function NavBar({ onAuthButtonPress }) {
  const { state } = useContext(store);
  const [ responsive, setResponsive ] = useState(false);
  const isAuthenticated = useMemo(() => state.auth.isAuthenticated, [state.auth.isAuthenticated]);
  const isVerified = useMemo(() => isAuthenticated && state.auth.user.verified, [isAuthenticated, state.auth.user.verified]);
  const navBarRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const documentClickHandler = event => {
      if (responsive && navBarRef.current && event.target !== navBarRef.current) {
        setResponsive(false);
      }
    }
    document.addEventListener("click", documentClickHandler);
    return () => {
      document.removeEventListener("click", documentClickHandler);
    }
  }, [responsive]);

  return (
    <nav ref={navBarRef} className="flex items-center justify-between flex-wrap bg-teal-500 p-3">
      <Link to="/" className="flex items-center flex-shrink-0 text-white mr-6">
        <img src={logo} className="fill-current h-12 mr-2" alt="Emerging Leaders logo" />
        <span className="font-semibold text-xl tracking-tight">GT FLOw Control</span>
      </Link>
      <div className="block lg:hidden">
        <button onClick={() => setResponsive(!responsive)} className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
        </button>
      </div>
      <div className={`w-full ${responsive ? "block" : "hidden"} flex-grow lg:flex lg:items-center lg:w-auto absolute lg:relative top-full lg:top-0 bg-teal-500 -ml-3 lg:ml-0 p-3 lg:p-0 pt-0`}>
        <div className="text-sm lg:flex-grow">
          { isVerified && <>
            <Link to="/dashboard" className="block mt-4 mb-4 lg:mb-0 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
              Dashboard
            </Link>
          </> }
          <Link to="/about" className="block mt-4 mb-4 lg:mb-0 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
            About
          </Link>
        </div>
        <div>
          {isAuthenticated && !isVerified && !location.pathname.startsWith('/verify') && <button onClick={(event) => onAuthButtonPress(event, "VERIFY")} className="bg-transparent hover:bg-white text-white font-semibold hover:text-teal-500 py-2 px-4 border border-white hover:border-transparent rounded">
            Verify Account
          </button> }
          <button onClick={(event) => onAuthButtonPress(event, (isVerified || isAuthenticated) ? "SIGN OUT" : "LOG IN")} className="ml-3 bg-transparent hover:bg-white text-white font-semibold hover:text-teal-500 py-2 px-4 border border-white hover:border-transparent rounded">
            {(isVerified || isAuthenticated) ? "Sign out" : "Log in / Sign up"}
          </button>
        </div>
      </div>
    </nav>
  );
}
