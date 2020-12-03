import {
  ADD_AVAILABLE_GAME,
  REMOVE_AVAILABLE_GAME,
  EMPTY_AVAILABLE_GAMES,
  MARK_SET
} from '../actions/types';
export const initialState = {
  games: [],
  set: false
};
const lobbyReducer = (lobbyState = initialState, action) => {
  switch (action.type) {
    case ADD_AVAILABLE_GAME:
      return {
        games: [...lobbyState.games, action.payload.game],
        set: lobbyState.set
      };
    case REMOVE_AVAILABLE_GAME:
      return {
        games: lobbyState.games.filter(game => game.host !== action.payload.game.host),
        set: lobbyState.set
      };
    case EMPTY_AVAILABLE_GAMES:
      return {
        games: [],
        set: lobbyState.set
      };
    case MARK_SET:
      return {
        games: lobbyState.games,
        set: true
      };
    default:
      return lobbyState;
  }
};

export default lobbyReducer;
