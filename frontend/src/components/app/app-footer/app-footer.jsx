import React from 'react';


export default function AppFooter() {
    return (
      <footer className="w-full flex flex-col items-center z-0 bg-black py-3 flex-shrink-0 mt-auto print:hidden">
        <div className="container d-flex flex-column align-items-center">
          <p className="text-gray-500 text-center block sm:hidden">Created by Mudit Gupta.</p>
          <p className="text-gray-500 text-center hidden sm:block md:hidden">Created by Mudit Gupta for him and his friends to have fun together.</p>
          <p className="text-gray-500 text-center hidden md:block lg:hidden">Created with the MERN stack by Mudit Gupta for him and his friends to have fun playing mungus together.</p>
          <p className="text-gray-500 text-center hidden lg:block">Created with the MERN stack by Mudit Gupta for him and his friends to have fun playing mungus together. Updated Jan 27, 2021.</p>
        </div>
      </footer>
    );
}
