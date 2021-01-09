import React, { useCallback, useEffect, useRef } from 'react';


const Whiteboard = (props) => {
  const { finish, onExit } = props;
  const completeTask = useCallback(() => {
    finish();
    onExit(true);
  }, [finish, onExit]);



  return (
    <>
      <button onClick={completeTask}>finish</button>
    </>
  );
};

export default Whiteboard;
