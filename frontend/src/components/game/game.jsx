import React, { useEffect, useState, useCallback, useContext, useRef, useMemo } from 'react';
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import socketIOClient from 'socket.io-client';

import { store } from 'state-management';
import { checkValidAuthToken } from 'utils';

// import { useForceUpdate, useEffectDebugger } from 'hooks';

export default function Game() {
  const { state, dispatch } = useContext(store);
  const location = useLocation();
  // const history = useHistory();
  const match = useRouteMatch("/game/:hostname");
  const { gameToken, username } = location;
  const hostname = match.params.hostname;
  const [ joinError, setJoinError ] = useState('');

  const [ latency, setLatency ] = useState();

  const [ socket, setSocket ] = useState();
  const socketRef = useRef();
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
    // console.log(require('util').inspect(socketIOClient, { depth: null }));
    if (!hostname || !gameToken) {
      // setSocket(null);
      return;
    }
    // if (!forcer) {
    //
    // }
    // if (socket) {
    //   console.log("socket exists");
    //   return () => socket.disconnect();
    // }
    console.log("create socket", hostname, username, gameToken);
    const socketIO = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username } });
    socketIO.on("connect", data => {
      console.log("connected to server", data||'');
      // if (reconnectInterval) {
      //   clearInterval(reconnectInterval);
      //   setReconnectInterval(0);
      // }
    });
    socketIO.on("connect_error", err => {
      // console.log(err instanceof Error);
      // console.log(err.message);
      // console.log(err.data);
      setJoinError(`${err.message} | ${err.data && err.data.content}`);
    });

    setInterval(() => {
      socketIO.emit('pingus', {time: Date.now()}, (pingusTime) => {
          const lat = Date.now() - pingusTime;
          setLatency(lat);
          // console.log("LATENCY:", lat);
      });
    }, 2000);


    socketIO.on("gameData", data => {
      // console.log("received game data: ", Object.keys(data||{})||'NONE');
      data && data.game && setGameData(data.game);
    });
    socketIO.on('playerJoin', data => {
      // console.log('playerJoin', data);
      setPlayerData(data.player.username, data.player);
    });
    socketIO.on('playerData', data => {
      // console.log('playerData', data);
      setPlayers(data.players);
    });
    socketIO.on('playerLeave', data => {
      // console.log('playerLeave', data);
      setPlayerData(data.player.username, undefined);
    });
    socketIO.on('gameStarted', data => {
      // console.log('gameStarted', data);
    });
    socketIO.on('gameEnded', data => {
      // console.log('gameStarted', data);
      setLeaving(true);
    });
    socketIO.on('disconnect', reason => {
      console.log("socket disconnected: ", reason);
      switch (reason) {
        case "io server disconnect":
          setLeaving(true);
          break;
        default:
          break;
      }
    });
    socketIO.on("reconnect_failed", reconnectionAttemps => {
      // console.log("reconnect_failed");
      setJoinError(`Failed to contact server! | Please try to rejoin the game`);
    });
    // socketIO.prependAny((event, ...args) => {
    //   console.log(`got ${event}`);
    // });
    socketIO.onAny((event, ...args) => {
      console.log(`got ${event}`);
    });
    // console.log(socket);
    // socketIO.emit("test", {yeet:"yeet"});
    // setSocket(socketIO);
    return () => socketIO.disconnect();
  }, [hostname, username, gameToken, setGameData, setPlayerData], ['hostname', 'username', 'gameToken']);

  // const disconnectedCB = useCallback(() => {
  //   return disconnected;
  // }, [disconnected]);

  // useEffect(() => {
  // console.log(`check socket: discon:${disconnected}, socket:${socket}, conn:${socket && socket.connected}, reconInt:${reconnectInterval}`);
  // if (disconnected && !reconnectInterval) {
  //   setReconnectInterval(setInterval(() => {
  //     console.log("force socket recreation");
  //     setForcer(prev => prev+1);
  //   }, 1000));
  // } else if (!disconnected && reconnectInterval) {
  //   setReconnectInterval(0);
  // } else if (reconnectInterval) {
  //   clearInterval(reconnectInterval);
  // }
  // }, [disconnected, reconnectInterval]);


  const leaveGame = useCallback((event) => {
    console.log("attempt leave");
    socketRef.current && socketRef.current.emit("leaveGame", { username }, result => {
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

  if (leaving) {
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
