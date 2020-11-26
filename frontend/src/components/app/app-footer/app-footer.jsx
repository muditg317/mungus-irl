import React from 'react';


export default function AppFooter() {
    return (
      <footer className="w-full flex flex-col items-center -z-10 bg-black py-3 flex-shrink-0 mt-auto">
        <div className="container d-flex flex-column align-items-center">
          <p className="text-gray-500 text-center block sm:hidden">Created by Mudit Gupta.</p>
          <p className="text-gray-500 text-center hidden sm:block md:hidden">Created by Mudit Gupta for GT First-Year Leadership Organizations.</p>
          <p className="text-gray-500 text-center hidden md:block lg:hidden">Created with the MERN stack by Mudit Gupta for The Georgia Tech First-Year Leadership Organizations.</p>
          <p className="text-gray-500 text-center hidden lg:block">Created with the MERN stack by Mudit Gupta for The Georgia Tech First-Year Leadership Organizations. Updated Aug 17, 2020.</p>
        </div>
      </footer>
    );
}
