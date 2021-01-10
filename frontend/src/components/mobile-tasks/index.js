import Whiteboard, { whiteboardInfo } from './whiteboard';
import Numbers, { numbersInfo } from './numbers';
import Polkadot, { polkadotInfo } from './polkadot';
import Donuts, { donutsInfo } from './donuts';
import Tracer, { tracerInfo } from './tracer';

// TODO: add more mobile tasks
//          oo maybe just do wiring1, wiring2, wiring3 type thing (silly but eh)

const availableMobileTasks = {
  whiteboard: whiteboardInfo,
  numbers: numbersInfo,
  polkadot: polkadotInfo,
  donuts: donutsInfo,
  tracer: tracerInfo,
};
export default availableMobileTasks;
export { availableMobileTasks as mobileTasks };

export { Whiteboard, whiteboardInfo };
export { Numbers, numbersInfo };
export { Polkadot, polkadotInfo };
export { Donuts, donutsInfo };
export { Tracer, tracerInfo };
