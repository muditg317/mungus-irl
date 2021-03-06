import React, { useCallback, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useNonResettingTimeout } from 'hooks';
import { randOption, randInRange } from 'utils';

const MIN_TIME_TO_FINISH = 6;
const MAX_TIME_TO_FINISH = 9;

const BOARD_SIZE = 250;
const INTERACTION_MARGIN = 0;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_SIZE+INTERACTION_MARGIN];

const PEN_WIDTH = 5;

const OPTIONS = [
  "dog",
  "cat",
  "strawberry",
  "bird",
  "plane",
  "giraffe",
  "spoon",
  "guitar",
  "table",
  "laptop",
  "phone"
];


const Doodle = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 500);

  const [ goalDrawing, ] = useState(() => randOption(OPTIONS));
  const [ timeToFinish, ] = useState(() => 1000*randInRange(MIN_TIME_TO_FINISH,MAX_TIME_TO_FINISH));

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE);
    p5.strokeWeight(PEN_WIDTH);
    p5.background(255);
  }, []);

  const mouseDragged = useP5Event(useCallback((p5, event) => {
    !finished && p5.line(p5.pmouseX, p5.pmouseY, p5.mouseX, p5.mouseY);
  }, [finished]), INTERACTION_BOUNDS);
  const touchMoved = mouseDragged;

  useNonResettingTimeout(finishTask, timeToFinish);

  return (
    <>
      <Sketch className={`${finished ? "animate-ping" : ""}`} { ...{ setup, mouseDragged, touchMoved } } width={`${BOARD_SIZE}`} height={`${BOARD_SIZE}`} />
      <p className={`text-xl font-semibold mx-auto`}>{finished ? `Nice ${goalDrawing} drawing!` : `Draw a ${goalDrawing}! Quick!`}</p>
    </>
  );
};

export default Doodle;
