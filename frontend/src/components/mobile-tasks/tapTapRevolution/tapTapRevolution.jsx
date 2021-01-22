import React, { useCallback, useReducer, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useRandomInterval } from 'hooks';
import { randInRange, randOption } from 'utils';

const SCORE_TO_WIN = 5;

const BOARD_SIZE = 250;
const INTERACTION_MARGIN = 30;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_SIZE+INTERACTION_MARGIN];

const MAX_ARROWS = 4;
const MIN_ARROW_SPAWN_RATE = 2;
const MAX_ARROW_SPAWN_RATE = 8;
const ARROW_SPEED = 2.5;
const ARROW_SIZE = 18;
const HIT_MARGIN = ARROW_SIZE * 1.5;
const ARROW_SPACING = ARROW_SIZE * 1.75;
const ARROW_LANE_X = ARROW_SPACING * 1.9;
const ARROW_LANE_Y = BOARD_SIZE - ARROW_LANE_X + ARROW_SPACING;

const BACKGROUND_COLOR = [223, 234, 245];
const ARROW_COLOR_OPTIONS = [
  [66, 245, 221],
  [219, 62, 240],
  [84, 250, 37],
  [242, 235, 39]
];
const BUTTON_COLOR = [169, 187, 204];

const arrowsReducer = (state, action) => {
  const { spawnArrow, updateID, newData, removeKey, reset, stepAll } = action;
  if (reset) {
    return reset === true ? [] : reset;
  }
  if (spawnArrow) {
    if (state.length >= MAX_ARROWS) {
      return state;
    }
    const newArrow = typeof spawnArrow === 'object' ? spawnArrow : {
      key: Math.random().toString().substring(2),
      direction: randInRange(4, {integer: true}),
      x: ARROW_LANE_X - ARROW_SPACING / 2,
      y: -ARROW_SIZE,
      color: randOption(ARROW_COLOR_OPTIONS),
      vy: ARROW_SPEED,
      size: ARROW_SIZE,
      prevUpdate: performance.now()
    };
    // newArrow.color = ARROW_COLOR_OPTIONS[newArrow.direction];
    newArrow.x += ARROW_SPACING * (2 - (newArrow.direction === 3 ? newArrow.direction : ((newArrow.direction + 2) % 3)));
    return [...state, newArrow];
  }
  if (updateID) {
    return state.map(arrow => arrow.key !== updateID ? arrow : { ...arrow, ...newData });
  }
  if (removeKey) {
    return state.filter(arrow => arrow.key !== removeKey);
  }
  if (stepAll) {
    return state.filter(arrow => {
      const time = performance.now();
      const deltaT = (time - arrow.prevUpdate) * 60/1000;
      arrow.prevUpdate = time;
      if (arrow.hit) {
        arrow.y = ARROW_LANE_Y;
        arrow.size *= 1.08;
        arrow.opacity ? (arrow.opacity *= 0.7) : (arrow.opacity = 255);
        return arrow.opacity > 10;
      }
      arrow.y += arrow.vy * deltaT;
      if (arrow.y > (BOARD_SIZE + ARROW_SIZE*1.5)) {
        return false;
      }
      return true;
    });
  }
  console.log('unkown arrows update', state, action);
  return state;
};


const TapTapRevolution = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 500);

  const [ score, setScore ] = useState(0);

  const [ arrows, updateArrows ] = useReducer(arrowsReducer, []);

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE);
    p5.noStroke();
    p5.background(...BACKGROUND_COLOR);
  }, []);

  const update = useCallback((p5) => {
    updateArrows({ stepAll: true });
  }, []);

  const drawBackground = useCallback((p5) => {
    p5.background(...BACKGROUND_COLOR);
    p5.stroke(0);
    // p5.line(ARROW_LANE_X,0,ARROW_LANE_X,BOARD_SIZE);
    // p5.line(ARROW_LANE_X-ARROW_SPACING,0,ARROW_LANE_X-ARROW_SPACING,BOARD_SIZE);
    // p5.line(0,BOARD_SIZE - ARROW_LANE_X,BOARD_SIZE,BOARD_SIZE-ARROW_LANE_X);
    // p5.line(0,BOARD_SIZE - ARROW_LANE_X-ARROW_SPACING,BOARD_SIZE,BOARD_SIZE-ARROW_LANE_X-ARROW_SPACING);
    p5.push();
    p5.stroke(...BUTTON_COLOR);
    p5.push();
    p5.strokeWeight(1);
    p5.fill(...BUTTON_COLOR);
    p5.translate(BOARD_SIZE - ARROW_LANE_X,BOARD_SIZE/2);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      p5.rotate(angle)
      p5.push();
      p5.translate(0,ARROW_SPACING);
      p5.rect(-ARROW_SIZE / 4, -ARROW_SIZE / 2, ARROW_SIZE / 2, ARROW_SIZE / 2);
      p5.triangle(-ARROW_SIZE / 2, 0, ARROW_SIZE / 2, 0, 0, ARROW_SIZE / 2);
      p5.noFill();
      p5.strokeWeight(3);
      p5.rect(-ARROW_SIZE * 0.75, -ARROW_SIZE * 0.75, ARROW_SIZE * 1.5, ARROW_SIZE * 1.5);
      p5.pop();
    }
    p5.pop();
    p5.strokeWeight(2);
    p5.translate(ARROW_LANE_X - 1.5 * ARROW_SPACING, ARROW_LANE_Y);
    p5.push();
    p5.rotate(Math.PI / 2);
    p5.rect(-ARROW_SIZE / 4, -ARROW_SIZE / 2, ARROW_SIZE / 2, ARROW_SIZE / 2);
    p5.triangle(-ARROW_SIZE / 2, 0, ARROW_SIZE / 2, 0, 0, ARROW_SIZE / 2);
    p5.noStroke();
    p5.rect(-ARROW_SIZE / 4 + 1, -ARROW_SIZE / 4, ARROW_SIZE / 2 - 2, ARROW_SIZE / 2);
    p5.pop();
    p5.translate(ARROW_SPACING, 0);
    p5.push();
    p5.rect(-ARROW_SIZE / 4, -ARROW_SIZE / 2, ARROW_SIZE / 2, ARROW_SIZE / 2);
    p5.triangle(-ARROW_SIZE / 2, 0, ARROW_SIZE / 2, 0, 0, ARROW_SIZE / 2);
    p5.noStroke();
    p5.rect(-ARROW_SIZE / 4 + 1, -ARROW_SIZE / 4, ARROW_SIZE / 2 - 2, ARROW_SIZE / 2);
    p5.pop();
    p5.translate(ARROW_SPACING, 0);
    p5.push();
    p5.rotate(Math.PI);
    p5.rect(-ARROW_SIZE / 4, -ARROW_SIZE / 2, ARROW_SIZE / 2, ARROW_SIZE / 2);
    p5.triangle(-ARROW_SIZE / 2, 0, ARROW_SIZE / 2, 0, 0, ARROW_SIZE / 2);
    p5.noStroke();
    p5.rect(-ARROW_SIZE / 4 + 1, -ARROW_SIZE / 4, ARROW_SIZE / 2 - 2, ARROW_SIZE / 2);
    p5.pop();
    p5.translate(ARROW_SPACING, 0);
    p5.push();
    p5.rotate(-Math.PI / 2);
    p5.rect(-ARROW_SIZE / 4, -ARROW_SIZE / 2, ARROW_SIZE / 2, ARROW_SIZE / 2);
    p5.triangle(-ARROW_SIZE / 2, 0, ARROW_SIZE / 2, 0, 0, ARROW_SIZE / 2);
    p5.noStroke();
    p5.rect(-ARROW_SIZE / 4 + 1, -ARROW_SIZE / 4, ARROW_SIZE / 2 - 2, ARROW_SIZE / 2);
    p5.pop();
    p5.pop();
  }, []);

  const drawArrow = useCallback((p5, arrow) => {
    p5.push();
    p5.translate(arrow.x, arrow.y);
    p5.rotate(-Math.PI / 2 * arrow.direction);
    p5.noStroke();
    const color = arrow.color;
    arrow.opacity && color.push(arrow.opacity);
    p5.fill(...color);
    p5.rect(-arrow.size / 4, -arrow.size / 2, arrow.size / 2, arrow.size / 2);
    p5.triangle(-arrow.size / 2, 0, arrow.size / 2, 0, 0, arrow.size / 2);
    p5.pop();
  }, []);

  const draw = useCallback((p5) => {
    drawBackground(p5);
    update();
    arrows.forEach(drawArrow.bind(null, p5));
  }, [arrows, update, drawBackground, drawArrow]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    const availableArrows = arrows.filter(arrow => Math.abs(arrow.y - (ARROW_LANE_Y)) < HIT_MARGIN && !arrow.hit);
    const relX = p5.mouseX - (BOARD_SIZE - ARROW_LANE_X);
    const relY = (BOARD_SIZE / 2) - p5.mouseY;
    if (Math.abs(relX) < ARROW_SPACING * 1.75 && Math.abs(relY) < ARROW_SPACING * 1.75) {
      const trig = Math.sqrt(2) / 2;
      const tiltedX = relX*trig + relY*trig;
      const tiltedY = -relX*trig + relY*trig;
      let hitArrow;
      if (tiltedX > 0) {
        if (tiltedY > 0) { // up
          hitArrow = availableArrows.find(arrow => arrow.direction === 2);
        } else { // right
          hitArrow = availableArrows.find(arrow => arrow.direction === 1);
        }
      } else {
        if (tiltedY > 0) { // left
          hitArrow = availableArrows.find(arrow => arrow.direction === 3);
        } else { // down
          hitArrow = availableArrows.find(arrow => arrow.direction === 0);
        }
      }
      if (hitArrow) {
        hitArrow.hit = true;
        setScore(curr => {
          if (curr >= (SCORE_TO_WIN - 1)) {
            finishTask();
          }
          return curr + 1;
        });
      }
    }
  }, [arrows, finishTask]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;

  useRandomInterval(useCallback(() => {
    updateArrows({spawnArrow: true});
  }, []), 1000 / MIN_ARROW_SPAWN_RATE, 1000 / MAX_ARROW_SPAWN_RATE);

  return (
    <>
      <Sketch className={`${finished ? "animate-ping" : ""}`} { ...{ setup, draw, mousePressed, touchStarted } } width={`${BOARD_SIZE}`} height={`${BOARD_SIZE}`} />
      <div className="w-full flex">
        <p className="my-2 mx-auto text-2xl font-bold">
          {score < SCORE_TO_WIN ? `Score: ${score}/${SCORE_TO_WIN}` : "SUCCESS!!"}
        </p>
      </div>
    </>
  );
};

export default TapTapRevolution;
