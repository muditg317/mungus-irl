import { useCallback, useEffect, useRef } from 'react';
import { randInRange } from 'utils';

const useRandomInterval = (callback, minDelay, maxDelay) => {
  const intervalRef = useRef();
  const func = useCallback(() => {
    clearTimeout(intervalRef.current && intervalRef.current.timeout);
    callback();
    const millis = performance.now();
    const delay = randInRange(minDelay, maxDelay);
    intervalRef.current = {
      millis,
      delay,
      timeout: setTimeout(func, delay)
    };
  }, [callback, minDelay, maxDelay]);
  useEffect(() => {
    if (intervalRef.current) {
      const millis = performance.now();
      const delay = intervalRef.current.delay - (millis - intervalRef.current.millis);
      intervalRef.current = {
        millis,
        delay,
        timeout: setTimeout(func, delay)
      };
    } else {
      func();
    }
    return () => {
      clearTimeout(intervalRef.current && intervalRef.current.timeout);
    };
  }, [func]);
};

export default useRandomInterval;
