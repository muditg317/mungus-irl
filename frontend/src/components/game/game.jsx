import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { Redirect, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import socketIOClient from 'socket.io-client';

import { store } from 'state-management';
import { checkValidAuthToken, handleChange } from 'utils';

import { useForceUpdate, useEffectDebugger } from 'hooks';

export default function Game() {
  const { state, dispatch } = useContext(store);
  const location = useLocation();
  const history = useHistory();
  const match = useRouteMatch("/game/:hostname");
  const { gameToken, username } = location;
  const hostname = match.params.hostname;
  // const [ socket, setSock ] = useState();
  // const setSocket = (value) => {
  //   window.socket = value;
  //   setSock(value);
  // };
  //TODO: remove ^!!
  // const [ showPasscodeModal, setShowPasscodeModal ] = useState('');
  const [ gameData, setGameData ] = useState({});
  const [ joinError, setJoinError ] = useState('');

  const [ latency, setLatency ] = useState();

  // const disconnected = !socket || socket.disconnected;
  // const [ reconnectInterval, setReconnectInterval ] = useState();

  // const forceUpdate = useForceUpdate();
  // const [ forcer, setForcer ] = useState(0);

  useEffectDebugger(() => {
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
    console.log("create socket");
    const socketIO = socketIOClient(`/game/${hostname}`, { forceNew: true, query: { gameToken, username } });
    socketIO.on("connect", data => {
      console.log("connected to server", data||'');
      // if (reconnectInterval) {
      //   clearInterval(reconnectInterval);
      //   setReconnectInterval(0);
      // }
    });
    socketIO.on("connect_error", err => {
      console.log(err instanceof Error);
      console.log(err.message);
      console.log(err.data);
      // setSocket(null);
      setJoinError(`${err.message} | ${err.data.content}`);
    });
    // socketIO.on('ping', (data, callback) => {
    //   console.log("PING:",data,"|");
    //   callback(username);
    // });
    setInterval(() => {
      socketIO.emit('pingus', {time: Date.now()}, (pingusTime) => {
          const lat = Date.now() - pingusTime;
          setLatency(lat);
          // console.log("LATENCY:", lat);
      });
    }, 2000);

    socketIO.on("gameData", data => {
      console.log("received game data: ", Object.keys(data||{})||'NONE');
      data && data.game && setGameData(data.game);
    });
    socketIO.on('playerJoin', data => {
      console.log('playerJoin', data);
    });
    socketIO.on('gameStarted', data => {
      console.log('gameStarted', data);
    });
    socketIO.on('disconnect', reason => {
      console.log("socket disconnected");
      // socketIO.disconnect();
      // setSocket(null);
      // forceUpdate();
      // setReconnectInterval(setInterval(() => {
      //   console.log("force socket recreation");
      //   setForcer(prev => prev+1);
      // }, 1000));
    });
    socketIO.on("reconnect_failed", reconnectionAttemps => {
      console.log("reconnect_failed");
      setJoinError(`Failed to contact server! | Please try to rejoin the game`);
    });
    socketIO.prependAny((event, ...args) => {
      console.log(`got ${event}`);
    });
    socketIO.onAny((event, ...args) => {
      console.log(`got ${event}`);
    });
    // console.log(socket);
    // socketIO.emit("test", {yeet:"yeet"});
    // setSocket(socketIO);
    return () => socketIO.disconnect();
  }, [hostname, username, gameToken], ['hostname', 'username', 'gameToken']);

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

  // const openPasscodeModal = useCallback((hostname) => {
  //   setShowPasscodeModal(hostname);
  // }, []);
  //
  // const closePasscodeModal = useCallback(() => {
  //   // console.log("closePasscodeModal");
  //   setShowPasscodeModal('');
  // }, []);

  if (joinError || !hostname || !gameToken) {
    return <Redirect to={{
      pathname: `/lobby`,
      hostname,
      username,
      joinError
    }}/>
  }
  // if (!gameToken && !showPasscodeModal) {
  //   console.log("no token");
  //   openPasscodeModal(hostname);
  // }

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full h-fill flex-grow bg-gray-800 text-white">
        <div className="container mx-auto p-5">
          <div className="flex flex-col divide-y divide-white">
            <p>
              host: {hostname}<br/>
              username: {username} <br/>
              latency: {latency} <br/>
              gameData: {JSON.stringify(gameData)}<br/>
            </p>
          </div>
        </div>
      </div>
      {
        // showPasscodeModal && <PasscodeModal {...{shown: showPasscodeModal, username, onExit: closePasscodeModal}} />
      }
    </div>
    );
}
