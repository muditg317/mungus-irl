import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  useRef,
  useMemo
} from 'react';
import {Redirect, useLocation, useRouteMatch} from "react-router-dom";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {confirmAlert} from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import QRCode from 'qrcode';

import socketIOClient from 'socket.io-client';

import WaitingRoom from './waitingRoom';

import {store} from 'state-management';
import {checkValidAuthToken} from 'utils';

const qrOpts = {
  errorCorrectionLevel: 'H',
  version: 3,
  scale: 6
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

  const [latency, setLatency] = useState();

  const socketRef = useRef();
  const pingTimeoutRef = useRef();
  const [leaving, setLeaving] = useState(false);

  const [qrCodeDataURL, setQrCodeDataURL] = useState();

  const [passcode, setPasscode] = useState('');
  const [players, setPlayers] = useState({});
  const setPlayerDatum = useCallback((username, player) => {
    setPlayers(existingData => {
      return {
        ...existingData,
        [username]: player
      };
    });
  }, []);
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
  const setTasksStatusDatum = useCallback((taskname, task) => {
    setTasksStatus(existingData => {
      return {
        ...existingData,
        [taskname]: task
      };
    });
  });
  const [ started, setStarted ] = useState(false);
  const setGameData = useCallback((gameData) => {
    const { hostname: gameHost, passcode: gamePasscode, players: gamePlayers, rules: gameRules, tasks: gameTasks, started: gameStarted } = gameData;
    if (gameHost && gameHost !== hostname) {
      return setJoinError("Bad server data | Please try to rejoin the game");
    }
    gamePasscode && setPasscode(gamePasscode);
    gamePlayers && setPlayers(gamePlayers);
    gameRules && setRules(gameRules);
    gameTasks && setTasksStatus(gameTasks);
    gameStarted !== undefined && setStarted(gameStarted);
  }, [hostname]);

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
    socketRef.current.on('gameStarted', data => {
      setStarted(true);
    });
    socketRef.current.on('gameEnded', data => {
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
        default:
          console.log("socket disconnected for unknown reason:", reason);
          break;
      }
    });
    socketRef.current.on("reconnect_failed", reconnectionAttemps => {
      // console.log("reconnect_failed");
      setJoinError(`Failed to contact server! | Please try to rejoin the game`);
    });
    // socketRef.current.prependAny((event, ...args) => {
    //   console.log(`got ${event}`);
    // });
    socketRef.current.prependAny((event, ...args) => {
      // if (socketRef.current.eventNames().includes(event))
      //   return;
      console.log(`got ${event}`);
    });
    // console.log(socket);
    // socketRef.current.emit("test", {yeet:"yeet"});
    // setSocket(socketRef.current);
    return() => {
      socketRef.current && socketRef.current.disconnect();
      // localStorage.removeItem("gameToken");
    };
  }, [
    hostname,
    username,
    gameToken,
    setGameData,
    setPlayerDatum,
    setRuleDatum
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
          setLatency(lat);
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
    socketRef.current && socketRef.current.emit('startGame', {});
  }, []);

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

  if (leaving) {
    localStorage.removeItem("gameToken");
    return <Redirect to={{
        pathname: `/lobby`,
        leftGame: true
      }}/>
  }

  if (joinError || !hostname || !gameToken) {
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
              <FontAwesomeIcon icon={['fas', 'signal']} size='lg'/>{
                connStateDependent([
                  <p className={`${typeof latency !== "number" && 'hidden'} ml-1 w-12 min-w-max text-right`}>{latency && `${latency}ms`}</p>,
                  <p className="hidden md:block ml-2">Connecting</p>,
                  <p className="hidden md:block ml-2">Disconnected</p>
                ])
              }
            </div>
            <button className="p-1 rounded-md border" onClick={leaveGame}>LEAVE!</button>
            {state.auth.isAuthenticated && (state.auth.user.username === hostname) && hostname === username && <button className="p-1 rounded-md border" onClick={endGame}>END GAME</button>}
          </div>
          { !started
            ? <WaitingRoom { ...{players, username, hostname, rules, tasksStatus} } toggleReadyState={() => updateReadyState(!players[username].ready)} updateRule={username === hostname && updateRule} startGame={username === hostname && startGame}/>
            : <div></div>
          }
        </div>
      </div>
    </div>
  </div>);
}
