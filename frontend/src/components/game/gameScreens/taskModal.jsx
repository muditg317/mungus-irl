import React, { useEffect, useRef } from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';


export default function TaskModal(props) {
  const {
    mobileTask,
    iGotKilled,
    finish,
    shown,
    onExit
  } = props;

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
          <FontAwesomeIcon icon={['far','times-circle']} size='lg' />
          <span className='text-sm'>(Esc)</span>
        </div>

        <div className='modal-content'>
          <div className='modal-header'>
            <p className='modal-title'>{ !!mobileTask && mobileTask.taskname }</p>
            <div onClick={onExit} className='modal-modal-close'>
              <FontAwesomeIcon icon={['far','times-circle']} size='lg' />
            </div>
          </div>
          <div className='modal-body'>
            <div className="flex flex-col items-center justify-between">
              { !!mobileTask && <mobileTask.component { ...{ finish, onExit } } /> }
              <button className="m-1 p-2 text-base text-center font-semibold text-red-500 rounded-md border border-red-500" onClick={iGotKilled}>
                I've been killed!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
