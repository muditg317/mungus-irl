import React, {  } from 'react';

import { useTaskFinish } from 'hooks';


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
