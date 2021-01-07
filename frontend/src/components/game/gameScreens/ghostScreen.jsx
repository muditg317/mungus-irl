import React, {  } from 'react';

export default function GhostScreen(props) {
  const { username, myPlayer, totalTasks, completedTasks, functions } = props;
  const { alive, tasks } = myPlayer;
  const { iGotReported } = functions;

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
    </>
    );
}
