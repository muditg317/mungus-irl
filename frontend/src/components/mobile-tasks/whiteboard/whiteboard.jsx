import React, { useEffect, useRef } from 'react';


const Whiteboard = (props) => {
  const { finish, onExit } = props;
  return (
    <>
      <button onClick={() => finish() || onExit(true)}>finish</button>
    </>
  );
};

export default Whiteboard;
