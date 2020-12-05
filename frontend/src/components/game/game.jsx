import React, { useEffect, useState, useCallback, useContext, useRef, useMemo } from 'react';
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import socketIOClient from 'socket.io-client';

import { store } from 'state-management';
import { checkValidAuthToken } from 'utils';

// import { useForceUpdate, useEffectDebugger } from 'hooks';

export default function Game() {
  // console.log("render game");
  const { state, dispatch } = useContext(store);
  const location = useLocation();
  // const history = useHistory();
  const match = useRouteMatch("/game/:hostname");
  const username = location.username || localStorage.getItem("username");
  const gameToken = location.gameToken || (JSON.parse(sessionStorage.getItem("gameToken")) || {}).gameToken;
  const hostname = match.params.hostname;
  const [ joinError, setJoinError ] = useState('');

  const [ latency, setLatency ] = useState();

  // const [ socket, setSocket ] = useState();
  const socketRef = useRef();
  window.socketRef = socketRef;
  const [ leaving, setLeaving ] = useState(false);

  const [ players, setPlayers ] = useState({});
  const [ passcode, setPasscode ] = useState('');
  const setPlayerData = useCallback((username, player) => {
    setPlayers(existingData => {
      if (player) {
        existingData[username] = player;
      }
      return existingData;
    });
  }, []);

  const setGameData = useCallback((gameData) => {
    const { hostname: gameHost, players: gamePlayers, passcode: gamePasscode } = gameData;
    if (gameHost && gameHost !== hostname) {
      return setJoinError("Bad server data | Please try to rejoin the game");
    }
    gamePlayers && setPlayers(gamePlayers);
    gamePasscode && setPasscode(gamePasscode);
  }, [hostname]);

  useEffect(() => {
    if (!hostname || !gameToken) {
      return;
    }

    console.log("create socket", hostname, username, gameToken);
    console.log(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } });
    // const socketIO = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } }).connect();
    if (!socketRef.current)
      socketRef.current = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username } });
    socketRef.current.on("connect", data => {
      console.log("connected to server", data||'');
      // sessionStorage.setItem("gameToken", JSON.stringify({gameToken, hostname}));
      // if (reconnectInterval) {
      //   clearInterval(reconnectInterval);
      //   setReconnectInterval(0);
      // }
    });
    socketRef.current.on("connect_error", err => {
      // console.log(err instanceof Error);
      // console.log(err.message);
      // console.log(err.data);
      // sessionStorage.removeItem("gameToken");
      setJoinError(`${err.message} | ${err.data && err.data.content}`);
    });

    setInterval(() => {
      socketRef.current.emit('pingus', {time: Date.now()}, (pingusTime) => {
          const lat = Date.now() - pingusTime;
          setLatency(lat);
          // console.log("LATENCY:", lat);
      });
    }, 2000);


    socketRef.current.on("gameData", data => {
      data && data.game && setGameData(data.game);
    });
    socketRef.current.on('playerJoin', data => {
      setPlayerData(data.player.username, data.player);
    });
    socketRef.current.on('playerData', data => {
      setPlayers(data.players);
    });
    socketRef.current.on('playerLeave', data => {
      setPlayerData(data.player.username, undefined);
    });
    socketRef.current.on('gameStarted', data => {
    });
    socketRef.current.on('gameEnded', data => {
      // sessionStorage.removeItem("gameToken");
      setLeaving(true);
    });

    socketRef.current.on('disconnect', reason => {
      console.log("socket disconnected: ", reason);
      switch (reason) {
        case "io server disconnect":
          // sessionStorage.removeItem("gameToken");
          setLeaving(true);
          break;
        case "io client disconnect":
          // sessionStorage.removeItem("gameToken");
          setLeaving(true);
          break;
        default:
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
    socketRef.current.onAny((event, ...args) => {
      console.log(`got ${event}`);
    });
    // console.log(socket);
    // socketRef.current.emit("test", {yeet:"yeet"});
    // setSocket(socketRef.current);
    return () => {
      socketRef.current && socketRef.current.disconnect();
      // // sessionStorage.removeItem("gameToken");
    };
  }, [hostname, username, gameToken, setGameData, setPlayerData], ['hostname', 'username', 'gameToken']);

  const leaveGame = useCallback((event) => {
    console.log("attempt leave");
    socketRef.current && socketRef.current.emit("leaveGame", { username }, result => {
      // sessionStorage.removeItem("gameToken");
      setLeaving(true);
    });
  }, [username]);

  const endGame = useCallback((event) => {
    console.log("attempt end");
    socketRef.current && socketRef.current.emit("endGame", { auth: checkValidAuthToken() });
  }, []);

  const bueno = socketRef.current && socketRef.current.connected;
  useEffect(() => {
    if (!bueno) {
      console.log("sad");
    }
  }, [bueno]);

  useEffect(() => {
    return ((leav) => {
      if (leav || leaving) {
        console.log("leaving! clear token");
        // sessionStorage.removeItem("gameToken");
      }
    }).bind(null, leaving);
  }, [leaving]);

  if (leaving) {
    // sessionStorage.removeItem("gameToken");
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

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full h-fill flex-grow bg-gray-800 text-white">
        <div className="container mx-auto p-5">
          <div className="flex flex-col divide-y divide-white">
            <div className={`w-full h-20 ${(socketRef.current && socketRef.current.connected) ? 'bg-green' : ((socketRef.current) ? 'bg-yellow' : 'bg-red')}-500`}>
              {socketRef.current && `socketRef.current nsp:${socketRef.current.nsp}| id:${socketRef.current.id}| conn:${socketRef.current.connected}`}
            </div>
            <button onClick={leaveGame}>LEAVE!</button>
            { state.auth.isAuthenticated && (state.auth.user.username === hostname) && hostname === username &&
              <button onClick={endGame}>END GAME</button>
            }
            <p>
              host: {hostname}<br/>
              username: {username} <br/>
              latency: {latency}ms <br/>
              passcode: {passcode}<br/>
              Players:
            </p>
            <ul>
              {
                Object.entries(players).map(entry => {
                  const [ username, player ] = entry;
                  return <li key={username}>{`${username}: ${JSON.stringify(player)}`}</li>
                })
              }
            </ul>
          </div>
        </div>
      </div>
      {
        // showPasscodeModal && <PasscodeModal {...{shown: showPasscodeModal, username, onExit: closePasscodeModal}} />
      }
    </div>
    );
}
