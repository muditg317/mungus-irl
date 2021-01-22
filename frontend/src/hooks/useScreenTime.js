import { useEffect, useRef } from 'react';

const useScreenTime = (alert) => {
  const shownRef = useRef();
  useEffect(() => {
    !shownRef.current && (shownRef.current = performance.now());
    const shown = shownRef.current;
    return () => {
      const gone = performance.now();
      const diff = gone - shown;
      console.log({shown,gone,diff});
      alert && window.alert(JSON.stringify({shown,gone,diff}));
    };
  }, [alert]);
};

export default useScreenTime;
