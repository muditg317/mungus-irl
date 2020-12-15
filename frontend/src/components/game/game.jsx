import React, { useEffect, useState, useCallback, useContext, useRef, useMemo } from 'react';
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import QRCode from 'qrcode';

import socketIOClient from 'socket.io-client';

import { SonicSender, SonicReceiver } from 'polyfills/sonicnet';

import { store } from 'state-management';
import { checkValidAuthToken } from 'utils';

const qrOpts = {
  errorCorrectionLevel: 'H',
  version: 3,
  scale: 6
};

const sonicCommOpts = {
  // charDuration: 0.25,
  // freqMin: 7500,
  // freqMax: 8000
};

export default function Game() {
  // console.log("render game");
  const { state, dispatch } = useContext(store);
  const location = useLocation();
  // const history = useHistory();
  const match = useRouteMatch("/game/:hostname");
  const username = location.username || localStorage.getItem("username");
  const gameToken = location.gameToken || (JSON.parse(localStorage.getItem("gameToken")) || {}).gameToken;
  const hostname = match.params.hostname;
  const [ joinError, setJoinError ] = useState('');

  const [ latency, setLatency ] = useState();

  const socketRef = useRef();
  const pingTimeoutRef = useRef();
  const [ leaving, setLeaving ] = useState(false);

  const [ qrCodeDataURL, setQrCodeDataURL ] = useState();

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

  const sonicSenderRef = useRef();
  const sonicReceiverRef = useRef();
  window.sonicSenderRef = sonicSenderRef;
  window.sonicReceiverRef = sonicReceiverRef;


  useEffect(() => {
    if (!hostname || !gameToken) {
      return;
    }

    console.log("create socket", hostname, username, gameToken);
    console.log(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } });
    // TODO: use client type -- socketRef.current = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } }).connect();
    if (!socketRef.current)
      socketRef.current = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username, clientType: "PLAYER" } });

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
      // localStorage.removeItem("gameToken");
    };
  }, [hostname, username, gameToken, setGameData, setPlayerData], ['hostname', 'username', 'gameToken']);

  useEffect(() => {
    const checkLatency = () => {
      clearTimeout(pingTimeoutRef.current);
      if (socketRef.current && socketRef.current.connected) {
        // console.log("check latency");
        // console.log(require('util').inspect(socketRef.current, { depth: 1 }));
        // console.log(`socketRef.current nsp:${socketRef.current.nsp}| id:${socketRef.current.id}| conn:${socketRef.current.connected}`);
        socketRef.current.emit('pingus', {time: Date.now()}, (pingusTime) => {
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
    return () => {
      clearTimeout(pingTimeoutRef.current);
    };
  }, []);

  const connStateDependent = useCallback((array) => {
    return array[(socketRef.current && socketRef.current.connected) ? 0 : ((socketRef.current) ? 1 : 2)];
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const qrDataURL = await QRCode.toDataURL(username, qrOpts);
        setQrCodeDataURL(qrDataURL);
      } catch (error) {
        console.error(error);
      } finally {

      }
    })();
  }, [username]);

  useEffect(() => {
    console.log("create sonic socket");
    // console.log(SonicSender,SonicReceiver);


    if (!sonicSenderRef.current)
      sonicSenderRef.current = new SonicSender(sonicCommOpts);

    if (sonicReceiverRef.current)
      return;

    sonicReceiverRef.current = new SonicReceiver(sonicCommOpts);

    sonicReceiverRef.current.on('message', message => {
      console.log(message);
      setPlayerData('audio',{content:message});
    });
    sonicReceiverRef.current.start();

    return () => {
      sonicReceiverRef.current && sonicReceiverRef.current.stop();
    };
  }, [setPlayerData]);

  const leaveGame = useCallback((event) => {
    confirmAlert({
      title: `Leave Game`,
      message: 'Are you sure you want to leave the game?',
      buttons: [
        {
          label: 'Yes, leave',
          onClick: () => {
            // console.log("attempt leave");
            socketRef.current && socketRef.current.emit("leaveGame", { username }, result => {
              localStorage.removeItem("gameToken");
              setLeaving(true);
            });
          }
        },
        {
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
            socketRef.current && socketRef.current.emit("endGame", { auth: checkValidAuthToken() });
          }
        },
        {
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

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full h-fill flex-grow bg-gray-800 text-white">
        <div className="container mx-auto p-5">
          <div className="flex flex-col divide-y divide-white">
            <div className="w-full h-10 flex flex-row items-center justify-between">
              <div className={`p-1 rounded-md flex flex-row items-center bg-${connStateDependent(['green','yellow','red'])}-500`}>
                <FontAwesomeIcon icon={['fas','signal']} size='lg' />{connStateDependent([<p className={`${typeof latency !== "number" && 'hidden'} ml-1 w-12 min-w-max text-right`}>{latency && `${latency}ms`}</p>,<p className="hidden md:block ml-2">'Connecting'</p>,<p className="hidden md:block ml-2">'Disconnected'</p>])}
              </div>
              <button className="p-1 rounded-md border" onClick={leaveGame}>LEAVE!</button>
              { state.auth.isAuthenticated && (state.auth.user.username === hostname) && hostname === username &&
                <button className="p-1 rounded-md border" onClick={endGame}>END GAME</button>
              }
            </div>
            <p>
              host: {hostname}<br/>
              username: {username} <br/>
              latency: {latency}ms <br/>
            passcode: <pre>{passcode}</pre><br/>
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
            <button onClick={() => sonicSenderRef.current && sonicSenderRef.current.send('hello')}>sonic message!</button>
            <input type='number' className="text-black" onChange={(event) => sonicSenderRef.current.codec.freqMin = sonicReceiverRef.current.coder.freqMin = parseInt(event.target.value)}/>
            <input type='number' className="text-black" onChange={(event) => sonicSenderRef.current.codec.freqMax = sonicReceiverRef.current.coder.freqMax = parseInt(event.target.value)}/>
          </div>
        </div>
      </div>
    </div>
    );
}
