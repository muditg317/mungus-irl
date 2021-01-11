import { useEffect, useRef } from 'react';

const useNonResettingTimeout = (callback, time) => {
  const timeoutRef = useRef();
  useEffect(() => {
    const millis = performance.now();
    if (timeoutRef.current) {
      timeoutRef.current = {
        millis,
        timeout: setTimeout(callback, time - (millis - timeoutRef.current.millis))
      };
    } else {
      timeoutRef.current = {
        millis,
        timeout: setTimeout(callback, time)
      };
    }
    return () => {
      clearTimeout(timeoutRef.current && timeoutRef.current.timeout);
    };
  }, [callback, time]);
};

export default useNonResettingTimeout;
