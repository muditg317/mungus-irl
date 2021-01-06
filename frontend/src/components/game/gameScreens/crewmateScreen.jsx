import React, { useMemo } from 'react';
// import QRCode from 'qrcode';

// const qrOpts = {
//   errorCorrectionLevel: 'H',
//   version: 3,
//   scale: 6
// };

export default function CrewmateScreen(props) {
  const { players, username, myPlayer, functions } = props;
  const { alive, tasks, pendingReport } = myPlayer;
  const { sendQrScanResult, reportPlayer, unreadyReport, iGotKilled } = functions;
  // TODO: ^^ add params for sending qrscan result to server (asking for task completion)

  const readyToReport = useMemo(() => !pendingReport, [pendingReport]);
  const potentialDeadBodies = useMemo(() => {
    return players && Object.keys(players)
          .filter(playerName => players[playerName].publiclyAlive && playerName !== username);
  }, [players, username]);


  return (
    <>
      <div className={`w-full p-2.5 flex flex-row justify-between items-center`}>
        <p className="text-2xl text-center font-bold text-white">
          Crewmate
        </p>
        <button className="text-base text-center p-2 font-semibold text-red-500 rounded-md border border-red-500" onClick={iGotKilled}>
          I've been killed!
        </button>
      </div>
      <div className={`py-1 w-full`}>
        <div className="flex flex-col">
          { myPlayer && <div className={`w-full flex flex-row items-center mb-1 last:mb-0 text-white`}>
            <div className="w-1/2">
              <p className="text-right align-middle">
                {`${username} (you) -`}
              </p>
            </div>
            <div className="w-1/2">
              <div className="ml-1">
                <p>{`${alive ? "Alive!" : "Dead!"}`}</p>
              </div>
            </div>
          </div> }
        </div>
      </div>
      <div className="py-1 w-full">
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
      <div className={`py-1 w-full`} onClick={() => pendingReport && unreadyReport()}>
        <p className="mb-1">{`${pendingReport ? `Ready to report ${pendingReport}! (tap to unready)` : "Tap a player to report them!"}`}</p>
        <div className={`w-full relative flex flex-row flex-wrap ${potentialDeadBodies && potentialDeadBodies.length > 2 ? "justify-between" : "justify-around"}`}>
          { potentialDeadBodies && potentialDeadBodies.map(playerName => {
            // const crewmate = players[playerName];
            return <button key={playerName} className={`rounded-lg border border-blue-300 ${!readyToReport ? "bg-gray-300 text-gray-500" : "text-blue-300"} p-3`} disabled={!readyToReport} onClick={() => readyToReport && reportPlayer(playerName)}>
              <p className="text-center align-middle">
                {`${playerName}`}
              </p>
            </button>
          })}
          {!readyToReport && <div className="absolute top-0 bottom-0 left-0 right-0 rounded-lg bg-gray-300 bg-opacity-50 flex flex-row items-center justify-center p-2">
          </div>}
        </div>
      </div>
      {/*TODO:add scan task qr code button (fake it for imposter)*/}
    </>
    );
}
