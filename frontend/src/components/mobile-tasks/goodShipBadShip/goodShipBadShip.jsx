import React, { useCallback, useReducer, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useInterval } from 'hooks';
import { map, randInRange } from 'utils';

const SCORE_TO_WIN = 10;

const BOARD_SIZE = 250;
const INTERACTION_MARGIN = 10;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_SIZE+INTERACTION_MARGIN];

const MAX_SIZE = 0;
const MIN_SIZE = 2;
const HIT_MARGIN = 5;

const MAX_SHIPS = 25;
const SHIP_SPAWN_RATE = 4.5;
const ENEMY_PROBABILITY = 0.4;
const MIN_SPEED = 1.5;
const MAX_SPEED = 2.5;

const BACKGROUND_COLOR = [65, 145, 242];
// const PLAYER_COLOR = [229, 136, 247];
const FRIEND_COLOR = [181, 181, 181];
const ENEMY_COLOR = [120, 11, 11];

const SHIP_ANGLE_BELL = 2;
const SHIP_UNIT_SIZE = 20;

const drawShip = (p5, ship) => {
  p5.push();
  p5.noStroke();
  p5.fill(...ship.color);
  p5.translate(ship.x,ship.y);
  p5.rotate(Math.atan2(ship.vy, ship.vx));
  p5.rectMode(p5.CENTER);
  p5.rect(0,0, ship.size * SHIP_UNIT_SIZE, SHIP_UNIT_SIZE);
  p5.translate(ship.size * SHIP_UNIT_SIZE / 2, 0);
  p5.ellipse(0,0, SHIP_UNIT_SIZE*2,SHIP_UNIT_SIZE);
  p5.translate(-ship.size * SHIP_UNIT_SIZE, 0);
  p5.ellipse(0,0, SHIP_UNIT_SIZE*2,SHIP_UNIT_SIZE);
  p5.pop();
};

const shipsReducer = (state, action) => {
  const { spawnShip, randomShip, updateID, newData, removeKey, reset, stepAll } = action;
  if (reset) {
    return reset;
  }
  if (spawnShip) {
    if (state.length >= MAX_SHIPS) {
      return state;
    }
    const newShip = {
      key: Math.random().toString().substring(2),
      size: randInRange(MIN_SIZE,MAX_SIZE),
      x: Math.random() * BOARD_SIZE,
      y: Math.random() * BOARD_SIZE,
      isEnemy: spawnShip.isEnemy !== undefined ? spawnShip.isEnemy : Math.random() < ENEMY_PROBABILITY
    };
    newShip.color = newShip.isEnemy ? ENEMY_COLOR : FRIEND_COLOR;
    let speed = map(newShip.size, MIN_SIZE, MAX_SIZE, MIN_SPEED, MAX_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
    // let speed = map(newShip.size, MIN_SIZE, MAX_SIZE, MAX_SPEED, MIN_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
    let angle = 0;
    for (let i = 0; i < SHIP_ANGLE_BELL; i++) {
      angle += (Math.random() * Math.PI / 2) / SHIP_ANGLE_BELL;
    }
    newShip.vx = speed * Math.cos(angle);
    newShip.vy = speed * Math.sin(angle);
    if (Math.random() < 0.5) {
      if (Math.random() < 0.5) {
        newShip.x = -newShip.size*SHIP_UNIT_SIZE;
      } else {
        newShip.x = BOARD_SIZE + newShip.size*SHIP_UNIT_SIZE;
        newShip.vx *= -1;
      }
      if (Math.sign(BOARD_SIZE/2 - newShip.y) === Math.sign(newShip.vy) && Math.random() < 0.25) {
        newShip.vy *= -1;
      }
    } else {
      if (Math.random() < 0.5) {
        newShip.y = -newShip.size*SHIP_UNIT_SIZE;
      } else {
        newShip.y = BOARD_SIZE + newShip.size*SHIP_UNIT_SIZE;
        newShip.vy *= -1;
      }
      if (Math.sign(BOARD_SIZE/2 - newShip.x) === Math.sign(newShip.vx) && Math.random() < 0.25) {
        newShip.vx *= -1;
      }
    }
    const angleToCenter = Math.atan2(BOARD_SIZE / 2 - newShip.y, BOARD_SIZE/2 - newShip.x);
    const currAngle = Math.atan2(newShip.vy, newShip.vx);
    const newAngle = currAngle * 0.3 + angleToCenter * 0.7;
    newShip.vx = speed * Math.cos(newAngle);
    newShip.vy = speed * Math.sin(newAngle);
    return [...state, newShip];
  }
  if (randomShip) {
    const newShip = {
      key: Math.random().toString().substring(2),
      size: randInRange(MIN_SIZE,MAX_SIZE),
      x: Math.random() * BOARD_SIZE,
      y: Math.random() * BOARD_SIZE,
      isEnemy: Math.random() < ENEMY_PROBABILITY
    };
    newShip.color = newShip.isEnemy ? ENEMY_COLOR : FRIEND_COLOR;
    let speed = map(newShip.size, MIN_SIZE, MAX_SIZE, MIN_SPEED, MAX_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
    let angle = 0;
    for (let i = 0; i < 1; i++) {
      angle += (Math.random() * Math.PI / 2) / 1;
    }
    newShip.vx = speed * Math.cos(angle);
    newShip.vy = speed * Math.sin(angle);
    // const angleToCenter = Math.atan2(BOARD_SIZE / 2 - newShip.y, BOARD_SIZE/2 - newShip.x);
    // const currAngle = Math.atan2(newShip.vy, newShip.vx);
    // const newAngle = currAngle * 0.3 + angleToCenter * 0.7;
    // newShip.vx = speed * Math.cos(newAngle);
    // newShip.vy = speed * Math.sin(newAngle);
    return [...state, newShip];
  }
  if (updateID) {
    return state.map(ship => ship.key !== updateID ? ship : { ...ship, ...newData });
  }
  if (removeKey) {
    return state.filter(ship => ship.key !== removeKey);
  }
  if (stepAll) {
    return state.filter(ship => {
      ship.x += ship.vx;
      ship.y += ship.vy;
      if (ship.x < -ship.size*SHIP_UNIT_SIZE || ship.x > (BOARD_SIZE + ship.size*SHIP_UNIT_SIZE)
          || ship.y < -ship.size*SHIP_UNIT_SIZE || ship.y > (BOARD_SIZE + ship.size*SHIP_UNIT_SIZE)) {
        return false;
      }
      return true;
    });
  }
  console.log('unkown ships update', state, action);
  return state;
};

const textsReducer = (state, action) => {
  const { newText, reset, stepAll } = action;
  if (reset) {
    return reset;
  }
  if (newText) {
    newText.vy = -0.5;
    newText.opacity = 255;
    return [...state, newText];
  }
  if (stepAll) {
    return state.filter(text => {
      text.y += text.vy;
      text.opacity *= 0.9;
      return text.opacity >= 10;
    });
  }
  console.log('unkown text update', state, action);
  return state;
};


const GoodShipBadShip = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 750);

  const [ score, setScore ] = useState(0);
  // const setScore = useCallback((newScore) => {
  //   finished ? _setScore(newScore) : _setScore(Math.max(newScore, 0));
  // }, []);
  // const [ x, _setX ] = useState(BOARD_SIZE / 2);
  // const [ y, _setY ] = useState(BOARD_SIZE / 2);
  // const setX = useCallback((newX) => {
  //   finished ? _setX(newX) : _setX(Math.min(Math.max(newX, playerSize), BOARD_SIZE - playerSize));
  // }, [finished, playerSize]);
  // const setY = useCallback((newY) => {
  //   finished ? _setY(newY) : _setY(Math.min(Math.max(newY, playerSize), BOARD_SIZE - playerSize));
  // }, [finished, playerSize]);

  const [ ships, updateShips ] = useReducer(shipsReducer, []);
  const [ texts, updateTexts ] = useReducer(textsReducer, []);

  // const restart = useCallback((p5) => {
  //   setAlive(true);
  //   setScore(0);
  //   updateShips({reset: []});
  //   p5.loop();
  // }, []);

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE);
    p5.noStroke();
    p5.background(...BACKGROUND_COLOR);
  }, []);

  const draw = useCallback((p5) => {
    if (finished) {
      // setScore(prev => prev * 1.2);
      updateShips({ randomShip: true });
      updateShips({ randomShip: true });
      updateShips({ randomShip: true });
      updateShips({ randomShip: true });
      updateShips({ randomShip: true });
      updateShips({ randomShip: true });
      p5.background(...BACKGROUND_COLOR);
      ships.forEach(ship => {
        drawShip(p5, ship);
      });
      // p5.fill(...PLAYER_COLOR);
      // p5.circle(x,y, playerSize);

      // p5.stroke(0);
      // p5.textAlign(p5.CENTER, p5.CENTER);
      // p5.text("WIN", x,y);
      // p5.noStroke();
      return;
    }
    updateShips({stepAll: true});
    updateTexts({stepAll: true});
    // const collided = ships.find(ship => Math.hypot(ship.x - x,ship.y - y) < ((ship.size + playerSize) * SCALE / 2));
    // if (collided) {
    //   if (collided.size / playerSize <= (1 + MAX_PERC_DIFF)) {
    //     setScore(prev => prev + 1);
    //     updateShips({removeKey: collided.key});
    //     if (score === SCORE_TO_WIN - 1) {
    //       finishTask();
    //     }
    //   } else {
    //     setAlive(false);
    //     p5.noLoop();
    //   }
    // }
    p5.background(...BACKGROUND_COLOR);
    ships.forEach(ship => {
      drawShip(p5, ship);
    });
    texts.forEach(text => {
      p5.push();
      p5.stroke(...text.color, text.opacity);
      p5.fill(...text.color, text.opacity);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.text(text.text, text.x, text.y);
      p5.pop();
    });
  }, [finished, ships,texts]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    const hitShips = ships.filter(ship => {
      const angle = Math.atan2(ship.vy, ship.vx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const translatedX = p5.mouseX - ship.x;
      const translatedY = p5.mouseY - ship.y;
      const transformedX = translatedX * cos - translatedY * sin;
      const transformedY = translatedX * sin + translatedY * cos;
      return Math.abs(transformedX) <= ((ship.size+2) * SHIP_UNIT_SIZE / 2 + HIT_MARGIN) && Math.abs(transformedY) < (SHIP_UNIT_SIZE / 2 + HIT_MARGIN);
    });
    let scoreChange = 0;
    hitShips.forEach(hitShip => {
      if (hitShip.isEnemy) {
        scoreChange += 1;
        updateTexts({ newText: {
          text: "HIT! +1",
          x: hitShip.x,
          y: hitShip.y,
          color: [0,255,0]
        }});
      } else {
        scoreChange -= 2;
        updateTexts({ newText: {
          text: "OUCH! -2",
          x: hitShip.x,
          y: hitShip.y,
          color: [255,0,0]
        }});
      }
      updateShips({ removeKey: hitShip.key });
    });
    scoreChange && setScore(curr => Math.max(curr + scoreChange, 0));
    if (score + scoreChange >= SCORE_TO_WIN) {
      finishTask();
    }
  }, [finishTask, ships,score]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;
  // const mouseDragged = mousePressed;
  // const touchMoved = mouseDragged;

  useInterval(useCallback(() => {
    updateShips({ spawnShip: true });
  }, []), 1000 / SHIP_SPAWN_RATE);

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

export default GoodShipBadShip;
