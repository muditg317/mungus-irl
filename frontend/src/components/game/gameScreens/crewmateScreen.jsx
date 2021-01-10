import React, { useMemo } from 'react';
import { useQrScanner } from 'hooks';

import QrScanModal from './qrScanModal';
import TaskModal from './taskModal';

export default function CrewmateScreen(props) {
  const { players, username, myPlayer, totalTasks, completedTasks, qrScanIssue, setQrScanIssue, mobileTask, functions } = props;
  const { alive, tasks, pendingReport } = myPlayer;
  const { sendQrScanResult, reportPlayer, unreadyReport, iGotKilled, stopMobileTask, finishMobileTask } = functions;

  const readyToReport = useMemo(() => !pendingReport, [pendingReport]);
  const potentialDeadBodies = useMemo(() => {
    return players && Object.keys(players)
          .filter(playerName => players[playerName].publiclyAlive && playerName !== username);
  }, [players, username]);


  const { videoRef,
    canvasRef,
    scanning,
    toggleScanning,
    mode,
    toggleMode } = useQrScanner(sendQrScanResult);

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
      <div className={`py-1 w-full`}>
        <div className="flex flex-row items-center justify-between">
          <p className="mr-1">Task progress:</p>
          <div className="flex flex-row">
            {`${completedTasks}/${totalTasks}`}
          </div>
        </div>
      </div>
      <div className="py-1 w-full">
        <div className="flex flex-col">
          { tasks && Object.keys(tasks).map(taskname => {
            const task = tasks[taskname];
            return <div key={taskname} className={`w-full flex flex-row items-center mb-1 last:mb-0 ${task.completed ? 'text-green-300' : (task.active || task.awaitingRescan ? 'text-yellow-300' : 'text-white')}`}>
              <div className="w-1/2">
                <p className="text-right align-middle">
                  {`${taskname} (${task.format}) -`}
                </p>
              </div>
              <div className="w-1/2">
                <div className="ml-1">
                  <p>{task.awaitingRescan ? "Needs rescan!" : `${task.completed ? 'Completed!' : 'Not completed'}`}</p>
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
      <div className="w-full h-fill mt-auto"></div>
      { alive && qrScanIssue && <div className="p-2 flex flex-col items-center justify-center">
        <p className={`p-2 text-lg text-center align-middle text-white`} onClick={() => setQrScanIssue(false)}>
          {qrScanIssue}
        </p>
      </div> }
      { alive && <div className="p-2 flex flex-col items-center justify-center">
        <button className={`pb-3 pt-2.5 px-4 rounded-full border-none bg-gray-${!scanning ? '300' : '500'} text-3xl font-bold text-center align-middle ${!scanning ? 'text-red-500' : 'text-gray-700'}`} disabled={scanning} onClick={() => setQrScanIssue(false) || toggleScanning()}>
          Scan a QR Code!
        </button>
      </div> }
      { <QrScanModal { ...{ videoRef, canvasRef, mode, toggleMode } } shown={alive && scanning} onExit={() => toggleScanning()} /> }
      { <TaskModal { ...{ mobileTask, iGotKilled } } finish={finishMobileTask} shown={alive && !!mobileTask} onExit={(finished = false) => !finished && stopMobileTask()} /> }
    </>
    );
}
