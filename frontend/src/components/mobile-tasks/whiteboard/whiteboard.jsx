import React, {  } from 'react';

import { useTaskFinish } from 'hooks';

// TODO: GALAGA
// TODO: Good ship bad ship
// TODO: birds and bugs
// TODO: crossy road

const Whiteboard = (props) => {
  const { finish, onExit } = props;
  const [ , finishTask ] = useTaskFinish(finish, onExit);



  return (
    <>
      <button onClick={finishTask}>finish</button>
    </>
  );
};

export default Whiteboard;
