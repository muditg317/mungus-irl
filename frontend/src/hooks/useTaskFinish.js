import { useCallback, useEffect, useRef, useState } from 'react';

const useTaskFinish = (finish, onExit, completionTime = 0) => {
  const completeTask = useCallback(() => {
    // console.log('complete');
    finish();
    onExit(true);
  }, [finish, onExit]);
  const [ finished, setFinished ] = useState(false);
  const finishedTimeoutRef = useRef();

  const finishTask = useCallback(() => {
    setFinished(true);
    finishedTimeoutRef.current = setTimeout(() => {
      completeTask();
    }, completionTime);
  }, [completeTask, completionTime]);

  useEffect(() => {
    return () => {
      clearTimeout(finishedTimeoutRef.current);
    };
  }, []);

  return [finished, finishTask];
};

export default useTaskFinish;
