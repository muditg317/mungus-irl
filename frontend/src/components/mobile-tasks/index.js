import Doodle, { doodleInfo } from './doodle';
import Numbers, { numbersInfo } from './numbers';
import Polkadot, { polkadotInfo } from './polkadot';
import Donuts, { donutsInfo } from './donuts';
import Tracer, { tracerInfo } from './tracer';
import GoodShipBadShip, { goodShipBadShipInfo } from './goodShipBadShip';
import RoadCross, { roadCrossInfo } from './roadCross';
import TapTapRevolution, { tapTapRevolutionInfo } from './tapTapRevolution';

// TODO: add more mobile tasks
//          oo maybe just do wiring1, wiring2, wiring3 type thing (silly but eh)
// TODO: GALAGA
// TODO: birds and bugs
// TODO: dance dance revolution - tap buttons at the right times
// TODO: pong style thing


const availableMobileTasks = {
  doodle: doodleInfo,
  numbers: numbersInfo,
  polkadot: polkadotInfo,
  donuts: donutsInfo,
  tracer: tracerInfo,
  goodShipBadShip: goodShipBadShipInfo,
  roadCross: roadCrossInfo,
  tapTapRevolution: tapTapRevolutionInfo,
};
export default availableMobileTasks;
export { availableMobileTasks };
export { availableMobileTasks as mobileTasks };

export { Doodle, doodleInfo };
export { Numbers, numbersInfo };
export { Polkadot, polkadotInfo };
export { Donuts, donutsInfo };
export { Tracer, tracerInfo };
export { GoodShipBadShip, goodShipBadShipInfo };
export { RoadCross, roadCrossInfo };
export { TapTapRevolution, tapTapRevolutionInfo };
