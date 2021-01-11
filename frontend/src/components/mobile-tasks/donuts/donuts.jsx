import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event } from 'hooks';
import { randInRange } from 'utils';

const SCORE_TO_WIN = 5;

const BOARD_SIZE = 250;
const INTERACTION_MARGIN = 30;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_SIZE+INTERACTION_MARGIN];

const PLAYER_WIDTH = 5;
const PLAYER_HEIGHT = 30;

const MAX_DONUTS = 3;
const DONUT_SPAWN_RATE = 1.5;
const MIN_SPEED = 2;
const MAX_SPEED = 3;
const DONUT_THICK = 10;
const DONUT_DIAM = 20;

const BACKGROUND_COLOR = [117, 203, 235];
const PLAYER_COLOR = [245, 189, 149];

const donutsReducer = (state, action) => {
  const { spawnDonut, spawnRandom, updateID, newData, removeKey, reset, stepAll } = action;
  if (reset) {
    return reset;
  }
  if (spawnDonut) {
    if (state.reduce((numFalling, donut) => numFalling + !donut.caught, 0) >= MAX_DONUTS) {
      return state;
    }
    const newDonut = typeof spawnDonut === 'object' ? spawnDonut : {
      key: Math.random().toString().substring(2),
      x: randInRange(DONUT_DIAM + DONUT_THICK/2, BOARD_SIZE - DONUT_DIAM - DONUT_THICK/2),
      y: -DONUT_THICK*1.5,
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255],
      vx: 0,
      vy: randInRange(MIN_SPEED, MAX_SPEED),
      bound: false,
      caught: false,
      prevUpdate: performance.now()
    };
    return [...state, newDonut];
  }
  if (spawnRandom) {
    return [...state, {
      key: Math.random().toString().substring(2),
      x: randInRange(DONUT_DIAM + DONUT_THICK/2, BOARD_SIZE - DONUT_DIAM - DONUT_THICK/2),
      y: randInRange(DONUT_THICK/2, BOARD_SIZE - DONUT_THICK),
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255],
      vx: 0,
      vy: 0,
      bound: true,
      caught: true,
      prevUpdate: performance.now()
    }];
  }
  if (updateID) {
    return state.map(donut => donut.key !== updateID ? donut : { ...donut, ...newData });
  }
  if (removeKey) {
    return state.filter(donut => donut.key !== removeKey);
  }
  if (stepAll) {
    const { playerX } = stepAll;
    const score = state.reduce((caught, donut) => caught + donut.caught, 0);
    return state.filter(donut => {
      const time = performance.now();
      const deltaT = (time - donut.prevUpdate) * 60/1000;
      !donut.bount && Math.abs(donut.x - playerX) <= (DONUT_DIAM - DONUT_THICK - PLAYER_WIDTH) && Math.abs(donut.y - (BOARD_SIZE - PLAYER_HEIGHT*16/9)) < DONUT_THICK && (donut.bound = true);
      donut.bound && (donut.x = playerX);
      if (donut.bound && Math.abs(donut.y - (BOARD_SIZE - PLAYER_HEIGHT/2 - DONUT_THICK*1*(score))) < DONUT_THICK/2) {
        donut.caught = true;
        donut.vy = 0;
        donut.y = BOARD_SIZE - PLAYER_HEIGHT/2 - DONUT_THICK*1*(score);
      }
      // console.log(deltaT);
      donut.y += donut.vy * deltaT;
      if (donut.y > (BOARD_SIZE + DONUT_THICK*1.5)) {
        return false;
      }
      donut.prevUpdate = time;
      return true;
    });
  }
  console.log('unkown donuts update', state, action);
  return state;
};


const Donuts = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 750);

  const [ score, setScore ] = useState(0);
  const [ x, _setX ] = useState(BOARD_SIZE / 2);
  const setX = useCallback((newX) => {
    finished ? _setX(newX) : _setX(Math.min(Math.max(newX, DONUT_DIAM + DONUT_THICK/2), BOARD_SIZE - DONUT_DIAM - DONUT_THICK/2));
  }, [finished]);

  const [ donuts, updateDonuts ] = useReducer(donutsReducer, []);

  const spawnDonutIntervalRef = useRef();

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE, p5.WEBGL);
    p5.noStroke();
    p5.background(...BACKGROUND_COLOR);
  }, []);

  const update = useCallback((p5) => {
    updateDonuts({ stepAll: { playerX: x } });
    // const caught = donuts.find(donut => Math.abs(donut.y - (BOARD_SIZE - PLAYER_HEIGHT/2 - DONUT_THICK*1*(score))) < DONUT_THICK/2 && donut.becameCenteredY );
    // if (caught) {
    const newScore = donuts.reduce((caught, donut) => caught + donut.caught, 0);
    setScore(newScore);
    // updateDonuts({ caught: caught.key });
    if (newScore === SCORE_TO_WIN) {
      finishTask();
    }
    // }
  }, [x, donuts, finishTask]);

  const drawDonut = useCallback((p5, donut) => {
    p5.push();
    p5.translate(donut.x, donut.y);
    p5.rotateX(1);
    p5.fill(...donut.color);
    p5.torus(DONUT_DIAM/2, DONUT_THICK/2);
    p5.pop();
  }, []);

  const drawPlayer = useCallback((p5) => {
    p5.push();
    p5.translate(x, BOARD_SIZE - PLAYER_HEIGHT*2/3);
    p5.fill(...PLAYER_COLOR);
    p5.cylinder(PLAYER_WIDTH/2, PLAYER_HEIGHT*2);
    p5.translate(0,-PLAYER_HEIGHT*1.1);
    p5.rotateZ(Math.PI);
    p5.cone(PLAYER_WIDTH/2, PLAYER_WIDTH*2);
    p5.pop();

    donuts.filter(donut => donut.caught).forEach(drawDonut.bind(null, p5));
  }, [x, donuts, drawDonut]);

  const draw = useCallback((p5) => {
    p5.translate(-BOARD_SIZE/2, -BOARD_SIZE/2);
    p5.background(...BACKGROUND_COLOR);
    p5.directionalLight(255,255,255, -0.1, 0.7, -1);
    p5.ambientLight(150);
    if (finished) {
      updateDonuts({ spawnRandom: true});
      updateDonuts({ spawnRandom: true});
      updateDonuts({ spawnRandom: true});
      updateDonuts({ spawnRandom: true});
      updateDonuts({ spawnRandom: true});
      updateDonuts({ spawnRandom: true});
      drawPlayer(p5);
      return;
    }
    update();
    donuts.filter(donut => !donut.caught).map(drawDonut.bind(null, p5));
    drawPlayer(p5);
  }, [finished, donuts, update, drawDonut, drawPlayer]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    setX(p5.mouseX);
  }, [setX]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;
  const mouseDragged = mousePressed;
  const touchMoved = mouseDragged;

  useEffect(() => {
    spawnDonutIntervalRef.current = setInterval(() => {
      updateDonuts({spawnDonut: true});
    }, 1000 / DONUT_SPAWN_RATE);
    return () => {
      clearInterval(spawnDonutIntervalRef.current);
    }
  }, []);

  return (
    <>
      <Sketch className={`${finished ? "animate-ping" : ""}`} { ...{ setup, draw, mousePressed, mouseDragged, touchStarted, touchMoved } } width={`${BOARD_SIZE}`} height={`${BOARD_SIZE}`} />
      <div className="w-full flex">
        <p className="my-2 mx-auto text-2xl font-bold">
          {score < SCORE_TO_WIN ? `Score: ${score}/${SCORE_TO_WIN}` : "SUCCESS!!"}
        </p>
      </div>
    </>
  );
};

export default Donuts;
