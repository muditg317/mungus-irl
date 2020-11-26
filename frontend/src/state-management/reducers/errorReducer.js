import { GET_ERRORS } from '../actions/types';
export const initialState = {};
export default function(errorState = initialState, action) {
  switch (action.type) {
    case GET_ERRORS:
      return {
        ...action.payload
      };
    default:
      return errorState;
  }
}
