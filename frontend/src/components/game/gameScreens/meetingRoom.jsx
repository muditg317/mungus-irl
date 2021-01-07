import React, { useMemo, useState, useEffect } from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export default function MeetingRoom(props) {
  const { players, username, myPlayer, totalTasks, completedTasks, meetingInfo, votingTimer, myVote, castedVotes, votes, ejectedPlayer, functions } = props;
  const { alive } = myPlayer;
  const { reason, victim, reporter, caller } = meetingInfo;
  const { castVote } = functions;

  const meetingTitle = useMemo(() => {
    switch (reason) {
      case "REPORT":
        return `Body (${victim}) Reported (by ${reporter})!`
      case "EMERGENCY":
        return `Emergency Meeting (called by ${caller})!`
      default:
        return "Emergency Meeting"
    }
  }, [reason, victim, reporter, caller]);

  const [ selectedPlayer, setSelectedPlayer ] = useState("");

  const voteReady = useMemo(() => alive && !myVote && votingTimer >= 0, [alive, myVote, votingTimer]);

  useEffect(() => {
    if (!voteReady) {
      setSelectedPlayer("");
    }
  }, [voteReady]);


  return (
    <>
      { !ejectedPlayer && <div className={`w-full p-2.5 flex flex-row`}>
        <p className={`text-2xl text-center font-bold text-white`}>
          {meetingTitle}
        </p>
      </div> }
      <div className={`py-1 w-full`}>
        <div className="flex flex-row items-center justify-between">
          <p className="mr-1">Task progress:</p>
          <div className="flex flex-row">
            {`${completedTasks}/${totalTasks}`}
          </div>
        </div>
      </div>
      { !ejectedPlayer && <div className={`w-full p-2.5 flex flex-col`}>
        <div className="flex flex-row justify-between">
          <p className="text-xl text-center font-bold text-white mb-2">
            {voteReady ? "Cast Your Vote!" : "Votes are being cast"}
          </p>
          { !!votingTimer && <p className="text-xl text-center font-bold text-white mb-2">
            {votingTimer}
          </p> }
        </div>
        <div className={`w-full flex flex-col`}>
          { players && Object.keys(players).concat("**SKIP_VOTE**").map(playerName => {
            const player = playerName === "**SKIP_VOTE**" ? {publiclyAlive: true} : players[playerName];
            const canVote = player.publiclyAlive && voteReady;
            // votes && console.log('votes', playerName, votes[playerName]);
            const hasVotes = votes && votes[playerName] && votes[playerName].length;
            return <div className={`p-1 w-full`}>
              <div className={`w-full ${hasVotes ? "h-20 justify-between" : "h-12 justify-center"} p-1 flex flex-col rounded-lg ${!player.publiclyAlive ? "bg-gray-600 text-gray-800" : "bg-gray-200 text-black"}`} disabled={!canVote} onClick={() => canVote && setSelectedPlayer(existing => existing === playerName ? "" : playerName)}>
                <div className="w-full flex flex-row items-center justify-between">
                  <p className="m-1 text-lg flex-grow">{playerName === "**SKIP_VOTE**" ? "Skip Vote" : ((castedVotes && castedVotes.includes(playerName) ? "(V) " : "    ") + playerName + (playerName === username ? " (you)" : ""))}</p>
                  { playerName === selectedPlayer && <div className={`flex flex-row`}>
                    <button className="text-green-500 bg-green-300 w-8 h-8 p-1 mr-1 rounded-lg" onClick={() => canVote && castVote(selectedPlayer)}><FontAwesomeIcon icon='check' size='lg'/></button>
                    <button className="text-red-500 bg-red-300 w-8 h-8 p-1 rounded-lg"><FontAwesomeIcon icon='times' size='lg'/></button>
                  </div> }
                </div>
                { !!hasVotes && <div className="flex flex-row p-1 mt-1 divide-x divide-black">
                  { votes[playerName].map((voterName, i, arr) => {
                    return <p className={`text-sm px-1 first:pl-0 last:pr-0`}>{`${voterName}`}</p>
                  })}
                </div> }
              </div>
            </div>
          })}
        </div>
      </div> }
      { ejectedPlayer && <>
        <div className={`w-full h-fill p-2.5 flex flex-row items-center justify-center`}>
          <p className={`text-2xl text-center font-bold text-white`}>
            {`${ejectedPlayer.name === "**NOBODY**" ? "Nobody" : ejectedPlayer.name} was ${ejectedPlayer.role ? (`${ejectedPlayer.role === "CREWMATE" ? "not" : ""} an imposter`) : "ejected"}.${ejectedPlayer.role ? ` There are ${ejectedPlayer.remaining} imposters remaining.` : ""}`}
          </p>
        </div>
      </> }
    </>
    );
}
