import React, { useEffect } from 'react';
import { useHistory, useLocation } from "react-router-dom";

export default function Landing({ openAuthModal }) {
  const location = useLocation();
  const history = useHistory();
  useEffect(() => {
    const { privateAccessAttemptFrom } = location;
    if (privateAccessAttemptFrom) {
      openAuthModal(true, privateAccessAttemptFrom);
      history.push(location.pathname);
    }
  }, [openAuthModal, location, history]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-blue-100 p-6">
        <h1 className="text-4xl text-center">Georgia Tech FLOw Control</h1>
      </div>
      <div className="container p-5">
        <h2 className="text-xl font-bold mb-2">Manage your FLO!</h2>
        <p className="mb-1">Use this platform for your FLO to easily manage various things including:</p>
        <ul className="mb-4 ml-3">
          <li>Buddy dates</li>
          <li>Family groups</li>
          <li>Member points</li>
        </ul>
        <h2 className="text-xl font-bold mb-2">Supported FLOs</h2>
        <p className="">The following FLOs currently have support on this website:</p>
        <p className="mb-1 ml-6 text-xs text-gray-500">Contact me @mgupta303@gatech.edu if your FLO wants to use this website!</p>
        <ul className="mb-4 ml-3">
          <li>Emerging Leaders</li>
        </ul>
        <h2 className="text-xl font-bold mb-2">Sign up</h2>
        <div className="flex flex-row items-center mb-2">
          <p className="mr-2">If you're an advisor for a supported FLO: </p>
          <button onClick={() => openAuthModal(false)} className="bg-transparent hover:bg-purple-500 text-purple-500 font-semibold hover:text-white py-2 px-4 border border-purple-500 hover:border-transparent rounded">Sign up!</button>
        </div>
        <div className="flex flex-row items-center">
          <p className="mr-2">Already have an account? </p>
          <button onClick={() => openAuthModal(true)} className="bg-transparent hover:bg-purple-500 text-purple-500 font-semibold hover:text-white py-2 px-4 border border-purple-500 hover:border-transparent rounded">Log in</button>
        </div>
      </div>
    </div>
    );
}
