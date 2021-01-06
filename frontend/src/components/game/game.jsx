import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef
} from 'react';
import {Redirect, useLocation, useRouteMatch} from "react-router-dom";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {confirmAlert} from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import socketIOClient from 'socket.io-client';

import WaitingRoom from './waitingRoom';
import { CrewmateScreen, ImposterScreen, GhostScreen, MeetingRoom } from './gameScreens';
import EndScreen from './endScreen';

import {store} from 'state-management';
import {checkValidAuthToken, Utils} from 'utils';

const fasSignal = ['fas', 'signal'];

const myPlayerReducer = (state = {}, action) => {
  const { field, newValue, reset, globalData } = action;
  if (reset) {
    return reset;
  }
  if (globalData) {
    // console.log('update with global data', state, globalData);
    return { ...state, ...globalData };
  }
  if (field) {
    // console.log('update myplayer field', field, newValue);
    return { ...state, [field]: typeof newValue === "function" ? newValue(state[field]) : newValue };
  }
  console.log("unknown myplayer update action", state, action);
  return state;
};

const playersReducer = (state, action) => {
  const { user, reported, ejected, reset } = action;
  if (reset) {
    return reset;
  }
  if (user) {
    // const { updateUsername } = user;
    return { ...state, [user.updateUsername]: myPlayerReducer(state[user.updateUsername], user) };
  }
  if (reported) {
    return { ...state, [reported]: { ...state[reported], publiclyAlive: false } };
  }
  if (ejected) {
    return ejected in state ? { ...state, [ejected]: { ...state[ejected], publiclyAlive: false } } : state;
  }
  console.log("unknown all players update action", state, action);
  return state;
};

export default function Game() {
  // console.log("render game");
  const {state, dispatch} = useContext(store);
  const location = useLocation();
  // const history = useHistory();
  const match = useRouteMatch("/game/:hostname");
  const username = location.username || localStorage.getItem("username");
  const gameToken = location.gameToken || (JSON.parse(localStorage.getItem("gameToken")) || {}).gameToken;
  const hostname = match.params.hostname;
  const [joinError, setJoinError] = useState('');

  const latencyRef = useRef();

  const socketRef = useRef();
  const pingTimeoutRef = useRef();
  const [leaving, setLeaving] = useState(false);

  const [passcode, setPasscode] = useState('');
  const [ players, updatePlayers ] = useReducer(playersReducer, {});
  const setPlayers = useCallback((newPlayers) => {
    updatePlayers({reset: newPlayers});
  }, []);
  const setPlayerDatum = useCallback((updateUsername, player) => {
    updatePlayers({user: {updateUsername, [updateUsername === username ? 'globalData' : 'reset']: player}});
  }, [username]);
  const myPlayer = useMemo(() => players[username], [players, username]);
  const updateMyPlayer = useCallback((action) => {
    updatePlayers({user: {updateUsername: username, ...action}});
  }, [username]);
  // const [ myPlayer, updateMyPlayer ] = useReducer(myPlayerReducer, {});
  // const [players, setPlayers] = useState({});
  const [ rules, setRules ] = useState({});
  const setRuleDatum = useCallback((ruleName, rule) => {
    setRules(existingData => {
      return {
        ...existingData,
        [ruleName]: rule
      };
    });
  }, []);
  const [ tasksStatus, setTasksStatus ] = useState({});
  const setTasksStatusDatum = useCallback((taskname, taskStatus) => {
    setTasksStatus(existingData => {
      return {
        ...existingData,
        [taskname]: taskStatus
      };
    });
  }, []);
  const [ started, setStarted ] = useState(false);
  const setRole = useCallback((newRole) => {
    updateMyPlayer({field: "role", newValue: newRole});
  }, [updateMyPlayer]);
  const setTasks = useCallback((newTasks) => {
    updateMyPlayer({field: "tasks", newValue: newTasks});
  }, [updateMyPlayer]);
  const setTasksDatum = useCallback((taskname, task) => {
    setTasks(existingData => {
      return {
        ...existingData,
        [taskname]: task
      };
    });
  }, [setTasks]);
  const [ ended, setEnded ] = useState(false);
  const [ inMeeting, setInMeeting ] = useState(false);
  const [ meetingInfo, setMeetingInfo ] = useState({});
  const [ votingTimer, setVotingTimer ] = useState();
  const [ myVote, setMyVote ] = useState();
  const [ castedVotes, setCastedVotes ] = useState();
  const [ votes, setVotes ] = useState();
  const [ ejectedPlayer, setEjectedPlayer ] = useState();
  const [ winners, setWinners ] = useState();
  const [ crewmates, setCrewmates ] = useState();
  const [ imposters, setImposters ] = useState();
  const setGameData = useCallback((gameData) => {
    if (Utils.isDev()) {
      window.gameData = gameData;
    }
    const { hostname: gameHost,
      passcode: gamePasscode,
      players: gamePlayers,
      rules: gameRules,
      tasksStatus: gameTasksStatus,
      started: gameStarted,
      ended: gameEnded,
      inMeeting: gameInMeeting,
      meetingInfo: gameMeetingInfo,
      votingTimer: gameVotingTimer,
      myVote: gameMyVote,
      castedVotes: gameCastedVotes,
      votes: gameVotes,
      ejectedPlayer: gameEjectedPlayer,
      winners: gameWinners,
      crewmates: gameCrewmates,
      imposters: gameImposters } = gameData;
    if (gameHost && gameHost !== hostname) {
      return setJoinError("Bad server data | Please try to rejoin the game");
    }
    gamePasscode !== undefined && setPasscode(gamePasscode);
    gamePlayers !== undefined && setPlayers(gamePlayers);
    gameRules !== undefined && setRules(gameRules);
    gameTasksStatus !== undefined && setTasksStatus(gameTasksStatus);
    gameStarted !== undefined && setStarted(gameStarted);
    gameEnded !== undefined && setEnded(gameEnded);
    gameInMeeting !== undefined && setInMeeting(gameInMeeting);
    gameMeetingInfo !== undefined && setMeetingInfo(gameMeetingInfo);
    gameVotingTimer !== undefined && setVotingTimer(gameVotingTimer);
    gameMyVote !== undefined && setMyVote(gameMyVote);
    gameCastedVotes !== undefined && setCastedVotes(gameCastedVotes);
    gameVotes !== undefined && setVotes(gameVotes);
    gameEjectedPlayer !== undefined && setEjectedPlayer(gameEjectedPlayer);
    gameWinners !== undefined && setWinners(gameWinners);
    gameCrewmates !== undefined && setCrewmates(gameCrewmates);
    gameImposters !== undefined && setImposters(gameImposters);
    // gamePlayers[username] && updateMyPlayer({reset: gamePlayers[username]});
    // gameRole !== undefined ? setRole(gameRole) : (gamePlayers[username] && gamePlayers[username].role && setRole(gamePlayers[username].role));
    // gameTasks !== undefined && setTasks(gameTasks);
  }, [hostname, setPlayers]);

  useEffect(() => {
    if (!hostname || !gameToken) {
      return;
    }

    // console.log("create socket", hostname, username, gameToken);
    // console.log(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } });
    // TODO: use client type -- socketRef.current = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } }).connect();
    if (!socketRef.current)
      socketRef.current = socketIOClient(`/game/${hostname}`, {
        forceNew: true,
        query: {
          gameToken,
          username,
          ...checkValidAuthToken(),
          clientType: "PLAYER"
        }
      });

    socketRef.current.on("connect", data => {
      // console.log("connected to server", data||'');
      // localStorage.setItem("gameToken", JSON.stringify({gameToken, hostname}));
    });
    socketRef.current.on("connect_error", err => {
      localStorage.removeItem("gameToken");
      if (err.data && err.data.code === "NO GAME") {
        // console.log('connect error no game');
        return setLeaving(true);
      };
      setJoinError(`${err.message} | ${err.data && err.data.content}`);
    });

    socketRef.current.on("gameData", data => {
      data && data.game && setGameData(data.game);
    });
    socketRef.current.on('playerJoin', data => {
      setPlayerDatum(data.player.username, data.player);
    });
    socketRef.current.on('allPlayersData', data => {
      setPlayers(data.players);
    });
    socketRef.current.on('playerInfo', data => {
      setPlayerDatum(data.player.username, data.player);
    });
    socketRef.current.on('playerLeave', data => {
      setPlayerDatum(data.player.username, undefined);
    });
    socketRef.current.on('ruleUpdate', data => {
      // console.log('receive rule update', data);
      setRuleDatum(data.ruleName, data.rule);
    });
    socketRef.current.on('taskStatus', data => {
      setTasksStatusDatum(data.taskname, data.taskStatus);
    });
    socketRef.current.on('gameStarted', data => {
      setStarted(true);
      setEnded(false);
      setRole(data.role);
      data.imposters && updateMyPlayer({field: "imposters", newValue: data.imposters});
    });
    socketRef.current.on('allAssignedTasksInfo', data => {
      setTasks(data.tasks);
    });
    socketRef.current.on('taskInfo', data => {
      setTasksDatum(data.taskname, data.task);
    });
    socketRef.current.on('pendingVictim', data => {
      updateMyPlayer({field: 'pendingVictim', newValue: data.pendingVictim});
    });
    socketRef.current.on('killedByImposter', data => {
      updateMyPlayer({globalData: data.player});
    });
    socketRef.current.on('killSuccess', data => {
      updateMyPlayer({field: 'victims', newValue: (currentVictims=[]) => [...currentVictims, data.victim]});
      updateMyPlayer({field: 'pendingVictim', newValue: null});
    });
    socketRef.current.on('killTimer', data => {
      updateMyPlayer({field: 'killTimer', newValue: data.killTimer});
    });
    socketRef.current.on('readyToKill', data => {
      updateMyPlayer({field: 'killTimer', newValue: 0});
    });
    socketRef.current.on('pendingReport', data => {
      updateMyPlayer({field: 'pendingReport', newValue: data.pendingReport});
    });
    socketRef.current.on('deadBodyReported', data => {
      updatePlayers({reported: data.victim});
      updateMyPlayer({field: 'pendingReport', newValue: null});
    });
    socketRef.current.on('meeting', data => {
      setInMeeting(true);
      setMeetingInfo(data.meetingInfo);
      setVotingTimer(data.votingTimer);
      setMyVote();
      setCastedVotes([]);
      setVotes();
    });
    socketRef.current.on('votingTimer', data => {
      setVotingTimer(data.votingTimer);
    });
    socketRef.current.on('iVoted', data => {
      setMyVote(data.choice);
    });
    socketRef.current.on('voteCasted', data => {
      setCastedVotes(alreadyVoted => alreadyVoted.concat(data.voter));
    });
    socketRef.current.on('votes', data => {
      setMyVote();
      setCastedVotes([]);
      setVotes(data.votes);
    });
    socketRef.current.on('eject', data => {
      setVotes();
      setEjectedPlayer(data.ejectedPlayer);
      updatePlayers({ejected: data.ejectedPlayer.name});
    });
    socketRef.current.on('resume', data => {
      updatePlayers({ejected: data.wasEjected.name});
      setEjectedPlayer();
      setInMeeting(false);
      setMeetingInfo({});
      setVotingTimer();
      setCastedVotes();
    });
    socketRef.current.on('gameEnded', data => {
      setStarted(true);
      setEnded(true);
      setWinners(data.winners);
      setCrewmates(data.crewmates);
      setImposters(data.imposters);
    });
    socketRef.current.on('gameReset', data => {
      setStarted(false);
      setEnded(false);
    });
    socketRef.current.on('gameClosed', data => {
      localStorage.removeItem("gameToken");
      setLeaving(true);
    });

    socketRef.current.on('disconnect', reason => {
      console.log("socket disconnected: ", reason);
      switch (reason) {
        case "io server disconnect":
          localStorage.removeItem("gameToken");
          setLeaving(true);
          break;
        case "io client disconnect":
          localStorage.removeItem("gameToken");
          setLeaving(true);
          break;
        case "transport error":
          localStorage.removeItem("gameToken");
          setLeaving(true);
          break;
        default:
          console.log("socket disconnected for unknown reason:", reason);
          break;
      }
    });
    socketRef.current.on("reconnect_failed", reconnectionAttemps => {
      // console.log("reconnect_failed");
      setJoinError(`Failed to contact server! | Please try to rejoin the game`);
    });
    socketRef.current.prependAny((event, ...args) => {
      console.log(`got ${event}`, args);
    });
    return () => {
      // console.log("unrender game!");
      socketRef.current && socketRef.current.disconnect();
      // localStorage.removeItem("gameToken");
    };
  }, [
    hostname,
    username,
    gameToken,
    setGameData,
    setPlayers,
    setPlayerDatum,
    updateMyPlayer,
    setRuleDatum,
    setTasksStatusDatum,
    setRole,
    setTasks,
    setTasksDatum
  ], ['hostname', 'username', 'gameToken']);

  useEffect(() => {
    const checkLatency = () => {
      clearTimeout(pingTimeoutRef.current);
      if (socketRef.current && socketRef.current.connected) {
        // console.log("check latency");
        // console.log(require('util').inspect(socketRef.current, { depth: 1 }));
        // console.log(`socketRef.current nsp:${socketRef.current.nsp}| id:${socketRef.current.id}| conn:${socketRef.current.connected}`);
        socketRef.current.emit('pingus', {
          time: Date.now()
        }, (pingusTime) => {
          const lat = Date.now() - pingusTime;
          latencyRef.current = lat;
          // console.log("LATENCY:", lat);
        });
      } else {
        // console.log("not connected");
      }
      pingTimeoutRef.current = setTimeout(checkLatency, 2000);
    };
    checkLatency();
    return() => {
      clearTimeout(pingTimeoutRef.current);
    };
  }, []);

  const connStateDependent = useCallback((array) => {
    return array[
      (socketRef.current && socketRef.current.connected)
        ? 0
        : (
          (socketRef.current)
          ? 1
          : 2)
    ];
  }, []);

  const updateReadyState = useCallback((ready) => {
    // console.log('set ready state',ready);
    socketRef.current && socketRef.current.emit('updateReadyState', {ready});
  }, []);

  const updateRule = useCallback((ruleName, oldValue, newValue) => {
    // console.log('update rule',ruleName, oldValue, newValue);
    socketRef.current && socketRef.current.emit('updateRule', {ruleName, oldValue, newValue});
  }, []);

  const startGame = useCallback(() => {
    console.log('start game');
    socketRef.current && socketRef.current.emit('startGame', {});
  }, []);

  const leaveGame = useCallback((event) => {
    confirmAlert({
      title: `Leave Game`,
      message: 'Are you sure you want to leave the game?',
      buttons: [
        {
          label: 'Yes, leave',
          onClick: () => {
            // console.log("attempt leave");
            socketRef.current && socketRef.current.emit("leaveGame", {
              username
            }, result => {
              localStorage.removeItem("gameToken");
              // console.log('leave game');
              setLeaving(true);
            });
          }
        }, {
          label: 'Stay here'
        }
      ]
    });
  }, [username]);

  const endGame = useCallback((event) => {
    confirmAlert({
      title: `End Game`,
      message: 'Are you sure you want to end the game for everyone?',
      buttons: [
        {
          label: 'Yes, end game',
          onClick: () => {
            // console.log("attempt end");
            socketRef.current && socketRef.current.emit("endGame", {auth: checkValidAuthToken()});
          }
        }, {
          label: 'Cancel'
        }
      ]
    });
  }, []);

  const resetGame = useCallback(() => {
    socketRef.current && socketRef.current.emit('resetGame', {});
  }, []);

  const sendQrScanResult = useCallback((qrData) => {
    socketRef.current && socketRef.current.emit('qrScan', { qrData });
  }, []);

  const killPlayer = useCallback((crewmateName) => {
    socketRef.current && socketRef.current.emit('killPlayer', { crewmateName });
  }, []);

  const unreadyImposterKill = useCallback(() => {
    socketRef.current && socketRef.current.emit('unreadyImposterKill');
  }, []);

  const iGotKilled = useCallback(() => {
    socketRef.current && socketRef.current.emit('iGotKilled', { username });
  }, [username]);

  const reportPlayer = useCallback((playerName) => {
    socketRef.current && socketRef.current.emit('reportPlayer', { username: playerName });
  }, []);

  const unreadyReport = useCallback(() => {
    socketRef.current && socketRef.current.emit('unreadyReport');
  }, []);

  const iGotReported = useCallback(() => {
    socketRef.current && socketRef.current.emit('iGotReported', { username });
  }, [username]);

  const inGameFunctions = useMemo(() => ({

  }), []);

  const livingPlayerFunctions = useMemo(() => ({
    ...inGameFunctions,
    sendQrScanResult,
    reportPlayer,
    unreadyReport
  }), [inGameFunctions, sendQrScanResult, reportPlayer, unreadyReport]);

  const crewmateFunctions = useMemo(() => ({
    ...livingPlayerFunctions,
    iGotKilled
  }), [livingPlayerFunctions, iGotKilled]);

  const imposterFunctions = useMemo(() => ({
    ...livingPlayerFunctions,
    killPlayer,
    unreadyImposterKill
  }), [livingPlayerFunctions, killPlayer, unreadyImposterKill]);

  const ghostFunctions = useMemo(() => ({
    ...inGameFunctions,
    iGotReported
  }), [inGameFunctions, iGotReported]);

  const castVote = useCallback((choice) => {
    socketRef.current && socketRef.current.emit('castVote', { choice });
  }, []);

  const meetingFunctions = useMemo(() => ({
    castVote
  }), [castVote]);

  if (leaving) {
    // console.log('leaving!');
    localStorage.removeItem("gameToken");
    return <Redirect to={{
        pathname: `/lobby`,
        leftGame: true
      }}/>
  }

  if (joinError || !hostname || !gameToken) {
    // console.log('failure exit');
    return <Redirect to={{
        pathname: `/lobby`,
        hostname,
        username,
        joinError
      }}/>
  }

  return (<div className="h-full flex flex-col items-center">
    <div className="w-full h-fill flex-grow bg-gray-800 text-white">
      <div className="container h-full mx-auto p-5">
        <div className="h-full flex flex-col divide-y divide-white">
          <div className="flex flex-row items-center justify-center -mb-0.5">
            <p className="text-lg font-semibold mr-2">Room code:</p>
            <pre className="text-lg font-semibold">{passcode}</pre>
          </div>
          <div className="w-full h-10 py-1 flex flex-row items-center justify-between">
            <div className={`p-1 rounded-md flex flex-row items-center bg-${connStateDependent(['green', 'yellow', 'red'])}-500`}>
              <FontAwesomeIcon icon={fasSignal} size='lg'/>{
                connStateDependent([
                  <p className={`${typeof latencyRef.current !== "number" && 'hidden'} ml-1 w-12 min-w-max text-right`}>{latencyRef.current && `${latencyRef.current}ms`}</p>,
                  <p className="hidden md:block ml-2">Connecting</p>,
                  <p className="hidden md:block ml-2">Disconnected</p>
                ])
              }
            </div>
            <button className="p-1 rounded-md border" onClick={leaveGame}>LEAVE!</button>
            {state.auth.isAuthenticated && (state.auth.user.username === hostname) && hostname === username && <button className="p-1 rounded-md border" onClick={endGame}>END GAME</button>}
          </div>
          { !started
            ? <WaitingRoom { ...{ players, username, hostname, rules, tasksStatus } } toggleReadyState={() => updateReadyState(!myPlayer.ready)} updateRule={username === hostname && updateRule} startGame={username === hostname && startGame} />
            : (!ended
              ? (inMeeting
                ? <MeetingRoom { ...{ players, username, hostname, myPlayer, meetingInfo, votingTimer, myVote, castedVotes, votes, ejectedPlayer } } functions={meetingFunctions} />
                : <>
                  { myPlayer.role === "CREWMATE" && (
                    myPlayer.alive
                      ? <CrewmateScreen { ...{ players, username, hostname, myPlayer } } functions={crewmateFunctions} />
                    : <GhostScreen { ...{ players, username, hostname, myPlayer } } functions={ghostFunctions} />
                  )}
                  { myPlayer.role === "IMPOSTER" && <ImposterScreen { ...{ players, username, hostname, myPlayer } } functions={imposterFunctions}/> }
                </>)
              : <EndScreen { ...{ winners, crewmates, imposters, username, hostname } } resetGame={username === hostname && resetGame} />)
          }
        </div>
      </div>
    </div>
  </div>);
}
