import React, { useEffect, useMemo, useRef } from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import { isMobile } from 'utils';

const farTimesCircle = ['far','times-circle'];
const farCheckCircle = ['far','check-circle'];

export default function PreviewModal(props) {
  const {
    mobileTask,
    finish,
    shown,
    onExit,
    experimental = false,
    selected, selectTask, unselectTask
  } = props;
  const color = useMemo(() => selected ? 'green' : 'red', [selected]);


  const modalOverlayRef = useRef(null);
  const modalContainerRef = useRef(null);

  const checkOverlayClick = (event) => {
    if (modalOverlayRef.current && modalOverlayRef.current === event.target && shown) {
        onExit();
        event.preventDefault();
    }
  }

  useEffect(() => {
    const escapePressedHandler = event => {
      event = event || window.event;
      let isEscape = false;
      if ('key' in event) {
        isEscape = (event.key === 'Escape' || event.key === 'Esc')
      } else {
        isEscape = (event.keyCode === 27)
      }
      if (isEscape && shown) {
        onExit();
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', escapePressedHandler);
    return () => {
      document.removeEventListener('keydown', escapePressedHandler);
    }
  }, [onExit, shown]);

  // if (!shown) {
  //   return;
  // }

  return (
    <div className={`modal ${shown ? 'modal-active' : 'modal-inactive'} text-black`}>
      <div className='modal-overlay' onClick={checkOverlayClick} ref={modalOverlayRef}></div>
      <div className='modal-container' ref={modalContainerRef} >

        <div onClick={onExit} className='modal-window-close'>
          <FontAwesomeIcon icon={farTimesCircle} size='lg' />
          <span className='text-sm'>(Esc)</span>
        </div>

        <div className='modal-content'>
          <div className='modal-header'>
            <p className='modal-title'>{ !!mobileTask && mobileTask.longName }</p>
            <div onClick={onExit} className='modal-modal-close'>
              <FontAwesomeIcon icon={farTimesCircle} size='lg' />
            </div>
          </div>
          <div className='modal-body'>
            <div className="flex flex-col items-center justify-between">
              { !!mobileTask && <mobileTask.component { ...{ finish, onExit } } /> }
              <div className="w-full flex flex-row items-center justify-around">
                <button className="m-1 p-2 text-base text-center font-semibold text-red-500 rounded-md border border-red-500" onClick={onExit}>
                  Exit Preview
                </button>
                { !experimental && <button onClick={selected ? unselectTask : selectTask} className={`ml-2 flex flex-row items-center rounded-full text-${color}-500 ${isMobile() ? `focus:outline-none focus:bg-transparent focus:text-${color}-500` : `hover:bg-${color}-500 hover:text-white`}`}>
                  <FontAwesomeIcon icon={selected ? 'check-circle' : farCheckCircle} size='2x' />
                </button> }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
