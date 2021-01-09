import React, { useEffect, useRef } from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

const farTimesCircle = ['far','times-circle'];

export default function QrScanModal(props) {
  const {
    videoRef,
    canvasRef,
    toggleMode,
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
          <FontAwesomeIcon icon={farTimesCircle} size='lg' />
          <span className='text-sm'>(Esc)</span>
        </div>

        <div className='modal-content'>
          <div className='modal-header'>
            <p className='modal-title'>Scan a QR Code</p>
            <div onClick={onExit} className='modal-modal-close'>
              <FontAwesomeIcon icon={farTimesCircle} size='lg' />
            </div>
          </div>
          <div className='modal-body'>
            <div className="w-full flex flex-col items-center justify-center">
              <video className="hidden" ref={videoRef}></video>
              <canvas className="m-auto w-full h-48" ref={canvasRef}></canvas>
              <button className="mt-2 w-fit p-1 border border-black rounded-md" onClick={toggleMode}>
                Flip camera!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
