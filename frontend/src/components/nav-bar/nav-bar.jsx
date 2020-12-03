import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";

import logo from 'assets/images/mungus-logo.png';

import { store } from 'state-management';


export default function NavBar({ onAuthButtonPress }) {
  const { state } = useContext(store);
  const [ responsive, setResponsive ] = useState(false);
  const isAuthenticated = useMemo(() => state.auth.isAuthenticated, [state.auth.isAuthenticated]);
  const navBarRef = useRef(null);
  // const location = useLocation();

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
    <nav ref={navBarRef} className="flex items-center justify-between flex-wrap bg-black p-3">
      <Link to="/" className="flex items-center flex-shrink-0 text-white hover:text-red-700 mr-6">
        <img src={logo} className="fill-current h-12 mr-2" alt="Emerging Leaders logo" />
        <span className="font-semibold text-xl tracking-tight">Mungus IRL</span>
      </Link>
      <div className="block md:hidden">
        <button onClick={() => setResponsive(!responsive)} className="flex items-center z-50 px-3 py-2 border rounded text-white border-white hover:text-red-700 hover:border-red-700 outline-none">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
        </button>
      </div>
      <div className={`w-full ${responsive ? "block z-70" : "hidden"} flex-grow md:flex md:items-center md:w-auto absolute md:relative top-full md:top-0 bg-black -ml-3 md:ml-0 p-3 md:p-0 pt-0`}>
        <div className="text-sm md:flex-grow">
          { isAuthenticated && <>
            <Link to="/dashboard" className="block mt-4 mb-4 md:mb-0 md:inline-block md:mt-0 text-white hover:text-red-700 mr-4">
              Dashboard
            </Link>
          </> }
          <Link to="/about" className="block mt-4 mb-4 md:mb-0 md:inline-block md:mt-0 text-white hover:text-red-700 mr-4">
            About
          </Link>
        </div>
        <div>
          <button onClick={(event) => onAuthButtonPress(event, (isAuthenticated) ? "SIGN OUT" : "LOG IN")} className="ml-3 bg-transparent hover:bg-red-700 text-white font-semibold hover:text-white py-2 px-4 border border-white hover:border-transparent rounded">
            {(isAuthenticated) ? "Sign out" : "Log in / Sign up"}
          </button>
        </div>
      </div>
    </nav>
  );
}
