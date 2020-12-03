import {
  ADD_AVAILABLE_GAME,
  REMOVE_AVAILABLE_GAME,
  EMPTY_AVAILABLE_GAMES,
  MARK_SET
} from './types';

export const addAvailableGameAction = dispatch => (game, set = true) => {
  dispatch({
    type: ADD_AVAILABLE_GAME,
    payload: {game}
  });
  if (set) {
    dispatch({
      type: MARK_SET,
      payload: {}
    });
  }
};

export const removeAvailableGameAction = dispatch => (game) => {
  dispatch({
    type: REMOVE_AVAILABLE_GAME,
    payload: {game}
  });
  dispatch({
    type: MARK_SET,
    payload: {}
  });
};

export const setAvailableGamesAction = dispatch => (games) => {
  dispatch({
    type: EMPTY_AVAILABLE_GAMES,
    payload: {}
  });
  games.forEach(game => addAvailableGameAction(dispatch)(game, false));
  dispatch({
    type: MARK_SET,
    payload: {}
  });
};
