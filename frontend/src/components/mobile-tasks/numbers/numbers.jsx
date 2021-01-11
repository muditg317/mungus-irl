import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTaskFinish } from 'hooks';
import { shuffled } from 'utils';

const numbers = [1,2,3,4,5,6,7,8,9,10];

const Numbers = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 750);

  const [ order, ] = useState(() => shuffled(numbers));
  const firstHalf = useMemo(() => order.slice(0,5), [order]);
  const secondHalf = useMemo(() => order.slice(5,10), [order]);
  const [ number, setNumber ] = useState(1);

  const [ disabled, setDisabled ] = useState(false);
  const disabledTimeoutRef = useRef();

  const disableButtons = useCallback(() => {
    setDisabled(true);
    disabledTimeoutRef.current = setTimeout(() => setDisabled(false), 1000);
  }, []);

  const clickNumber = useCallback((clickedNumber) => {
    if (clickedNumber === number) {
      setNumber(num => num + 1);
      if (clickedNumber === 10) {
        finishTask();
      }
    } else {
      setNumber(1);
      disableButtons();
    }
  }, [number, finishTask, disableButtons]);

  useEffect(() => {
    return () => {
      clearTimeout(disabledTimeoutRef.current);
    }
  }, []);

  return (
    <>
      <div className={`table table-fixed bg-blue-400 ${disabled ? "animate-jiggle" : ""}`}>
        <div className="table-row">
          { firstHalf.map(num => {
            return <div key={num} className="table-cell w-1/5 p-1">
              <div className={`w-full rounded-md ${disabled ? "animate-spin" : (finished ? "animate-ping" : (num === number ? "animate-pulse" : ""))}`}>
                <button className={`p-2 w-full rounded-md ${disabled ? "bg-red-500" : ((num < number || finished) ? "bg-green-500" : "bg-blue-300")} bg-opacity-70`} disabled={disabled || num < number} onClick={() => clickNumber(num)}>
                  {num}
                </button>
              </div>
            </div>
          })}
        </div>
        <div className="table-row">
          { secondHalf.map(num => {
            return <div key={num} className="table-cell w-1/5 p-1">
              <div className={`w-full rounded-md ${disabled ? "animate-spin" : (finished ? "animate-ping" : (num === number ? "animate-pulse" : ""))}`}>
                <button className={`p-2 w-full rounded-md ${disabled ? "bg-red-500" : ((num < number || finished) ? "bg-green-500" : "bg-blue-300")} bg-opacity-70`} disabled={disabled || num < number} onClick={() => clickNumber(num)}>
                  {num}
                </button>
              </div>
            </div>
          })}
        </div>
      </div>
    </>
  );
};

export default Numbers;
