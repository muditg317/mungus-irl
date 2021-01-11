import React, { useCallback, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useNonResettingTimeout } from 'hooks';
import { randOption, randInRange } from 'utils';

const TIME_TO_FINISH = 7;
const TIME_MARGIN = 1;

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


const Whiteboard = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 500);

  const [ goalDrawing, ] = useState(() => randOption(OPTIONS));
  const [ timeToFinish, ] = useState(() => 1000*randInRange(TIME_TO_FINISH-TIME_MARGIN,TIME_TO_FINISH+TIME_MARGIN));

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

export default Whiteboard;
