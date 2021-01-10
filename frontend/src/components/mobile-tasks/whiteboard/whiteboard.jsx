import React, { useCallback } from 'react';

// TODO: GALAGA
// TODO: Good ship bad ship
// TODO: birds and bugs
// TODO: crossy road

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
