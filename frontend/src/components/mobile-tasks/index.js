import Whiteboard, { whiteboardInfo } from './whiteboard';
import Numbers, { numbersInfo } from './numbers';
import Polkadot, { polkadotInfo } from './polkadot';
import Donuts, { donutsInfo } from './donuts';
import Tracer, { tracerInfo } from './tracer';
import GoodShipBadShip, { goodShipBadShipInfo } from './goodShipBadShip';

// TODO: add more mobile tasks
//          oo maybe just do wiring1, wiring2, wiring3 type thing (silly but eh)
// TODO: GALAGA
// TODO: Good ship bad ship
// TODO: birds and bugs
// TODO: crossy road


const availableMobileTasks = {
  whiteboard: whiteboardInfo,
  numbers: numbersInfo,
  polkadot: polkadotInfo,
  donuts: donutsInfo,
  tracer: tracerInfo,
  goodShipBadShip: goodShipBadShipInfo,
};
export default availableMobileTasks;
export { availableMobileTasks };
export { availableMobileTasks as mobileTasks };

export { Whiteboard, whiteboardInfo };
export { Numbers, numbersInfo };
export { Polkadot, polkadotInfo };
export { Donuts, donutsInfo };
export { Tracer, tracerInfo };
export { GoodShipBadShip, goodShipBadShipInfo };
