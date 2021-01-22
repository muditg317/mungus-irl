import { useEffect, useRef } from 'react';

const useInterval = (callback, time) => {
  const intervalRef = useRef();
  useEffect(() => {
    if (intervalRef.current) {
      intervalRef.current = {
        interval: setInterval(callback, time)
      };
    } else {
      intervalRef.current = {
        interval: setInterval(callback, time)
      };
    }
    return () => {
      clearInterval(intervalRef.current && intervalRef.current.interval);
    };
  }, [callback, time]);
};

export default useInterval;
