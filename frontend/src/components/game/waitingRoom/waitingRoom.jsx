import React, { useMemo } from 'react';

import RuleInput from './ruleInput';

export default function WaitingRoom(props) {
  const { players, username, hostname, rules, tasksStatus, toggleReadyState, updateRule, startGame } = props;
  const allPlayersReady = useMemo(() => {
    const _players = Object.values(players);
    return _players.length > 3 && _players.every(player => player.ready);
  }, [players]);
  const allTasksOnline = useMemo(() => {
    const _tasks = Object.values(tasksStatus);
    return _tasks.every(task => task.online);
  }, [tasksStatus]);
  const readyToStart = useMemo(() => {
    return allPlayersReady && allTasksOnline;
  }, [allPlayersReady, allTasksOnline]);
  return (
    <>
      <div className="w-full divide-y divide-white md:divide-y-0 md:divide-x flex flex-col md:flex-row md:justify-around md:flex-wrap">
        <div className="table table-auto w-full md:w-1/2 p-1">
          { [username].concat(Object.keys(players)).filter((playerName,index) => players[playerName] && (playerName !== username || index === 0)).map(playerName => {
            const player = players[playerName];
            return <div key={playerName} className={`table-row ${playerName === username ? "text-lg font-bold mb-2" : ""}`}>
              <div className="table-cell w-1/2 h-full">
                <p className="mr-1 h-full text-right align-middle">
                  {playerName}<span className="inline-block">{(playerName === hostname ? " (host)" : "") + (playerName === username ? " (you)" : "")}</span>
                </p>
              </div>
              <div className="table-cell w-1/2 h-full">
                <div className="ml-1 h-full flex flex-row items-center justify-start">
                  { playerName === username
                    ? <button className={`my-auto border border-white rounded-md p-0.5 ${player.ready ? 'text-green-500' : 'text-red-500'}`} onClick={toggleReadyState}>{player.ready ? "Unready" : "Ready up!"}</button>
                    : <p className={`my-auto ${player.ready ? 'text-green-500' : 'text-red-500'}`}>{player.ready ? "Ready!" : "Not ready"}</p>
                  }
                </div>
              </div>
            </div>
          })}
        </div>
        <div className="py-1 md:pl-1 w-full md:w-1/2">
          <div className="flex flex-col">
            { Object.keys(rules).map(ruleName => {
              const rule = rules[ruleName];
              return <div key={ruleName} className={`w-full flex flex-row items-center mb-1 last:mb-0`}>
                <div className="w-1/2">
                  <p className="mr-1 text-right align-middle">
                    {ruleName}
                  </p>
                </div>
                <div className="w-1/2">
                  <div className="ml-1">
                    { username === hostname
                      ? <RuleInput {...{ruleName, rule, updateRule}} />
                    : <p>{rule.value}</p>
                    }
                  </div>
                </div>
              </div>
            })}
          </div>
        </div>
      </div>
      { !!Object.keys(tasksStatus).length && <div className="pt-1 md:pt-0 md:pl-1 w-full">
        <div className="flex flex-col">
          { Object.keys(tasksStatus).map(taskname => {
            const task = tasksStatus[taskname];
            return <div key={taskname} className={`w-full flex flex-row items-center mb-1 last:mb-0`}>
              <div className="w-1/2">
                <p className="text-right align-middle">
                  {`${taskname} -`}
                </p>
              </div>
              <div className="w-1/2">
                <div className="ml-1">
                  <p>{`${task.online ? 'Online!' : 'Not connected :('}`}</p>
                </div>
              </div>
            </div>
          })}
        </div>
      </div> }
      <div className="w-full mt-auto"></div>
      { username === hostname && <div className="w-full pt-2 flex flex-row justify-center items-end">
        <button disabled={!readyToStart} className={`pb-3 pt-2.5 px-4 rounded-full border-none bg-gray-${readyToStart ? '300' : '500'} text-3xl font-bold ${readyToStart ? 'text-red-500' : 'text-gray-700'}`} onClick={() => startGame()}>
          Start!
        </button>
      </div> }
    </>
    );
}
