import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { Redirect, useHistory, useLocation } from "react-router-dom";
import socketIOClient from 'socket.io-client';

import { addAvailableGameAction, removeAvailableGameAction, setAvailableGamesAction } from 'state-management/actions/lobbyActions';
import { store } from 'state-management';
import { checkValidAuthToken, handleChange } from 'utils';

import JoinModal from './joinModal';

import banner from 'assets/images/mungus-banner.jpg';



export default function Lobby({ openAuthModal }) {
  const { state, dispatch } = useContext(store);
  const addAvailableGame = useCallback((...args) => addAvailableGameAction(dispatch)(...args), [dispatch]);
  const removeAvailableGame = useCallback((...args) => removeAvailableGameAction(dispatch)(...args), [dispatch]);
  const setAvailableGames = useCallback((...args) => setAvailableGamesAction(dispatch)(...args), [dispatch]);
  const [ username, setUsername ] = useState(() => (state.auth.user.username || localStorage.getItem('username') || `Player ${Math.floor(Math.random()*1000)}`));
  const usernameRef = useRef(null);
  const [ games, setGames ] = useState([]);
  const [ socket, setSocket ] = useState();
  const [ showJoinModal, setShowJoinModal ] = useState('');
  const [ gameToken, setGameToken ] = useState(JSON.parse(sessionStorage.getItem("gameToken")));
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    // TODO: FIX THIS: when sent back to list, the thingy shouldn't flash
    return () => {
      setGames([]);
    };
  }, []);

  useEffect(() => {
    const { privateAccessAttemptFrom } = location;
    if (privateAccessAttemptFrom) {
      openAuthModal(true, privateAccessAttemptFrom);
      history.push(location.pathname);
      return;
    }
  }, [openAuthModal, location, history, ]);

  //TODO: Make lobby a higher order component of type public page (move the above effect into there)

  const openJoinModal = useCallback((hostname, joinError) => {
    setShowJoinModal({hostname, joinError});
  }, []);

  const closeJoinModal = useCallback(() => {
    // console.log("closeJoinModal");
    setShowJoinModal('');
  }, []);


  useEffect(() => {
    setGames(state.lobby.games);
  }, [state.lobby.games]);

  useEffect(() => {
    if (state.auth.user.username || !username) {
      setUsername(state.auth.user.username || localStorage.getItem('username') || `Player ${Math.floor(Math.random()*1000)}`);
    }
  }, [state.auth.user.username, username]);

  useEffect(() => {
    if (showJoinModal && showJoinModal.hostname) {
      if (socket && state.lobby.set && !state.lobby.games.map(game => game.hostname).includes(showJoinModal.hostname)) {
        // console.log(socket, state.lobby.set, state.lobby.games.map(game => game.hostname), showJoinModal.hostname);
        closeJoinModal();
      }
    }
  }, [showJoinModal, state.lobby.set, state.lobby.games, socket, closeJoinModal]);

  useEffect(() => {
    const socketIO = socketIOClient('/lobby', { forceNew: true, query: { username: localStorage.getItem('username') } });
    socketIO.on("connect", data => {
      console.log("connect to socket", data||'');
    });
    socketIO.on('newGame', data => {
      console.log('newGame', data);
      addAvailableGame(data.game);
    });
    socketIO.on('removeGame', data => {
      console.log('removeGame', data);
      removeAvailableGame(data.game);
    });
    socketIO.on("games", data => {
      console.log('games', data);
      setAvailableGames(data.games);
    });
    // console.log(socket);
    setSocket(socketIO);
    return () => socketIO.disconnect();
  }, [addAvailableGame, removeAvailableGame, setAvailableGames]);

  const joinGame = useCallback((data) => {
    const { gameToken: newGameToken, hostname } = data;
    localStorage.setItem('username', username);
    console.log(newGameToken);
    setTimeout(() => {
      setGameToken({ gameToken: newGameToken, hostname });
    }, 1000);
  }, [username, setGameToken]);

  const createGame = useCallback(() => {
    socket.emit("createGame", {...checkValidAuthToken()}, result => {
      const { code, message, data } = result;
      if (code === 'ERROR') {
        return console.error("game creation failed!", message);
      }
      console.log("Game created!!", message);
      console.log("game info:",data);
      joinGame(data);
    });
  }, [socket, joinGame]);

  const attemptJoin = useCallback((hostname, passcode) => {
    socket && socket.emit("joinGame", { hostname, passcode, username: state.auth.isAuthenticated ? state.auth.user.username : username }, result => {
      const { code, message, data } = result;
      if (code === 'ERROR') {
        setShowJoinModal(prev => {
          if (prev && prev.hostname) {
            return {...prev, joinError: message};
          }
          return { hostname, joinError: message};
        });
        return console.error("game creation failed!", message);
      }
      console.log("Game joined!!", message);
      console.log("game info:",data);
      joinGame(data);
    });
  }, [socket, username, joinGame, state.auth.isAuthenticated, state.auth.user.username]);

  const onJoinPress = useCallback((event, hostname) => {
    if (username) {
      if (socket && state.auth.isAuthenticated && (state.auth.user.username === hostname) && hostname === username) {
        console.log("speedy host join");
        attemptJoin(hostname, { asHost: checkValidAuthToken() });
      } else if (socket && games.filter(game => game.hostname === hostname && game.players.includes(username.trim())).length) {
        // TODO: add logic for auto joining games that are already started
        console.log("speedy rejoin!", games.filter(game => game.hostname === hostname && game.players.includes(username.trim()))[0]);
        attemptJoin(hostname, { rejoining: true });
      } else {
        openJoinModal(hostname);
        console.log(`|${username}|setShowJoinModal(${hostname});`);
      }
      event.preventDefault();
    } else {
      usernameRef.current.focus();
      usernameRef.current.classList.add("placeholder-red-600");
      usernameRef.current.classList.add("placeholder-opacity-75");
      usernameRef.current.classList.add("animate-jiggle");
      setTimeout(() => {
        usernameRef.current.classList.remove("placeholder-red-600");
        usernameRef.current.classList.remove("placeholder-opacity-75");
        usernameRef.current.classList.remove("animate-jiggle");
      }, 100);
    }
  }, [username, openJoinModal]);



  useEffect(() => {
    const { username: providedUsername, hostname, joinError } = location;
    if (providedUsername) {
      setUsername(state.auth.user.username || providedUsername);
    }
    let timeout;
    if (hostname) {
      location.hostname = '';
      console.log("JOIN FAILED:",hostname,"|",joinError,"|");
      // let manualBreak = false;
      timeout = setTimeout(() => {
        console.log("JOIN FAILED- OPEN MODAL:",hostname,"|",joinError,"|");
        openJoinModal(hostname, joinError);
        // manualBreak = true;
      }, 1000);
      // (async () => {
      //   while ((!socket || !state.lobby.set) && !manualBreak) {
      //     console.log("waiting");
      //   }
      //   if (state.lobby.games.map(game => game.hostname).includes(showJoinModal.hostname)) {
      //     openJoinModal(hostname, joinError);
      //   }
      // })();
    }
    // TODO: consider useREf for timeout variable
    return ((to) => {
      // if (to) {
      //   clearTimeout(to);
      // }
    }).bind(null, timeout);
  }, [openJoinModal, location, state.auth.user.username, showJoinModal.hostname, socket, state.lobby.games, state.lobby.set]);



  if (gameToken && gameToken.gameToken && gameToken.hostname) {
    return <Redirect to={{
      pathname: `/game/${gameToken.hostname}`,
      gameToken: gameToken.gameToken,
      username
    }}/>
  }

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full bg-gray-900 h-40">
        <img src={banner} className="fill-current container h-full m-auto object-cover -z-10" alt="Among Us Banner" />
        {
          // <div className="w-full h-40 absolute inset-x-0 top-16 flex flex-col items-center justify-center p-6">
          //   <h1 className="text-4xl sm:text-6xl text-white text-center">Mungus IRL</h1>
          // </div>
          // garbage garbage garbage im very sad
        }
      </div>
      <div className="w-full h-fill flex-grow bg-gray-800 text-white">
        <div className="container mx-auto p-5">
          <div className="flex flex-row flex-wrap items-center justify-between mb-2 sm:h-12">
            <h2 className="text-3xl font-bold self-start mr-2 mb-1 sm:mb-0">Join a game!</h2>
            <input ref={usernameRef} readOnly={state.auth.isAuthenticated} onChange={handleChange(setUsername, 15)} value={state.auth.user.username || username} className={`mb-2 p-1 rounded-md bg-gray-900 text-purple-500`} id="username" type="username" placeholder="Username" />
            { state.auth.isAuthenticated
              ? <button onClick={createGame} className="self-end justify-self-end ml-auto bg-transparent hover:bg-purple-500 text-purple-500 font-semibold hover:text-white py-2 px-4 border border-purple-500 hover:border-transparent rounded">Host a game!</button>
              : <div className="self-end justify-self-end ml-auto flex flex-col justify-center items-end">
                  <button onClick={() => openAuthModal(false)} className="h-8 bg-transparent hover:bg-purple-500 text-purple-500 font-semibold hover:text-white py-auto px-4 border border-purple-500 hover:border-transparent rounded">Sign up to host a game</button>
                  <button onClick={() => openAuthModal(true)} className="h-4 bg-transparent hover:text-white text-purple-500 text-opacity-60 font-medium text-xs">Already have an account? Log in</button>
                </div>
            }
          </div>
          <div className="flex flex-col divide-y divide-white">
            { games.map(game =>
              <div key={game.hostname} onClick={event => onJoinPress(event, game.hostname)} className="group h-16 flex flex-row justify-between bg-gray-500 odd:bg-gray-200 hover:bg-opacity-75 text-white odd:text-black shadow-inner hover:shadow-md first:rounded-t-md last:rounded-b-md px-2">
                <div className="flex flex-row items-center w-1/2 h-full">
                  <div className="w-10 block group-hover:hidden my-auto mr-2">
                    stuff
                  </div>
                  <div className="w-10 hidden group-hover:block my-auto mr-2">
                    join?
                  </div>
                  <div className="flex flex-col">
                    <p className="text-lg text-semibold">{game.hostname}</p>
                    <p className="text-sm text-light">Players: {game.players.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      { showJoinModal && <JoinModal {...{shown: showJoinModal, username: state.auth.isAuthenticated ? state.auth.user.username : (username || localStorage.getItem('username')), setUsername: state.auth.isAuthenticated ? () => null : setUsername, attemptJoin, onExit: closeJoinModal}} /> }
    </div>
    );
}
