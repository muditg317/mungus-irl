import React, { useMemo, useState, useEffect } from 'react';
import QRCode from 'qrcode';

import { upperFirstCharOnly } from 'utils';

const qrOpts = {
  errorCorrectionLevel: 'H',
  version: 3,
  scale: 6
};

export default function GhostScreen(props) {
  const { players, username, hostname, myPlayer, functions } = props;
  const { role, tasks } = myPlayer;
  const { iGotReported } = functions;
  // TODO: ^^ add params for sending qrscan result to server (asking for task completion)
  const [qrCodeDataURL, setQrCodeDataURL] = useState();

  useEffect(() => {
    (async () => {
      try {
        const qrDataURL = await QRCode.toDataURL(username, qrOpts);
        setQrCodeDataURL(qrDataURL);
      } catch (error) {
        console.error(error);
      } finally {}
    })();
  }, [username]);

  return (
    <>
      <div className={`w-full p-2.5 flex flex-row justify-between items-center`}>
        <p className="text-2xl text-center font-bold text-white">
          Ghostcrew
        </p>
        <button className={`text-base text-center p-2 font-semibold text-red-500 rounded-md border border-red-500 ${!myPlayer.publiclyAlive && "invisible"}`} disabled={!myPlayer.publiclyAlive} onClick={() => myPlayer.publiclyAlive && iGotReported()}>
          I've been reported!
        </button>
      </div>
      <div className="hidden py-1 w-full">
        <div className="flex flex-col">
          { tasks && Object.keys(tasks).map(taskname => {
            const task = tasks[taskname];
            return <div key={taskname} className={`w-full flex flex-row items-center mb-1 last:mb-0 ${task.completed ? 'text-green-300' : (task.active ? 'text-yellow-300' : 'text-white')}`}>
              <div className="w-1/2">
                <p className="text-right align-middle">
                  {`${taskname} (${task.format}) -`}
                </p>
              </div>
              <div className="w-1/2">
                <div className="ml-1">
                  <p>{`${task.completed ? 'Completed!' : 'Not completed'}`}</p>
                </div>
              </div>
            </div>
          })}
        </div>
      </div>
      {/*TODO:add scan task qr code button (fake it for imposter)*/}
    </>
    );
}
