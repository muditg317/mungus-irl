import {
  ADD_AVAILABLE_GAME,
  EMPTY_AVAILABLE_GAMES
} from './types';

export const addAvailableGameAction = dispatch => (hostUsername) => {
  dispatch({
    type: ADD_AVAILABLE_GAME,
    payload: {hostUsername}
  });
};

export const setAvailableGamesAction = dispatch => (hostUsernames) => {
  if (hostUsernames.length === 0) {
    dispatch({
      type: EMPTY_AVAILABLE_GAMES,
      payload: {}
    });
  }
  hostUsernames.forEach(hostUsername => addAvailableGameAction(dispatch)(hostUsername));
};
