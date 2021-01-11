import { useEffect, useRef } from 'react';

const useInterval = (callback, time) => {
  const intervalRef = useRef();
  useEffect(() => {
    // const millis = performance.now();
    if (intervalRef.current) {
      // intervalRef.current = {
      //   millis,
      //   interval: setInterval(callback, time - (millis - intervalRef.current.millis))
      // };
    } else {
      intervalRef.current = {
        // millis,
        interval: setInterval(callback, time)
      };
    }
    return () => {
      clearInterval(intervalRef.current && intervalRef.current.interval);
    };
  }, [callback, time]);
};

export default useInterval;
