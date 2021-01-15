import React, { useCallback, useEffect, useReducer, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useInterval, useNonResettingTimeout } from 'hooks';
import { map, randInRange } from 'utils';

// TODO: use buttons to control (or just hold to go forward, release to stop)
const SCORE_TO_WIN = 8;

const BOARD_WIDTH = 250;
const BOARD_HEIGHT = 250;
const INTERACTION_MARGIN = 10;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_WIDTH+INTERACTION_MARGIN, -INTERACTION_MARGIN, BOARD_HEIGHT+INTERACTION_MARGIN];

const PLAYER_WIDTH = 10;
const PLAYER_HEIGHT = 20;

const NUM_ROADS = SCORE_TO_WIN - 1;
const LANE_HEIGHT = 1 / (NUM_ROADS+2) * BOARD_HEIGHT;
const MAX_ENEMIES = 7;
const ENEMY_SPAWN_RATE = 3.5;
// const PROB_CAN_EAT = 0.4;
const MIN_SPEED = 2.00;
const MAX_SPEED = 7.00;
const MIN_SIZE = 2;
const MAX_SIZE = 4;
const CAR_LENGTH_UNIT = 20;
const CAR_HEIGHT = LANE_HEIGHT - 10;


const GRASS_COLOR = [121, 232, 130];
const ROAD_COLOR = [90, 91, 102];
const LINE_COLOR = [227, 216, 64];
const PLAYER_COLOR = [119, 168, 123];


const enemiesReducer = (state, action) => {
  const { spawnEnemy, updateID, newData, removeKey, reset, stepAll } = action;
  if (reset) {
    return reset;
  }
  if (spawnEnemy) {
    if (state.length >= MAX_ENEMIES) {
      return state;
    }
    const newEnemy = {
      key: Math.random().toString().substring(2),
      size: randInRange(MIN_SIZE,MAX_SIZE),
      x: randInRange(0,2,{integer:true}) * BOARD_WIDTH,
      y: (randInRange(1,NUM_ROADS+1, {integer:true}) + 0.5) * LANE_HEIGHT,
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    };
    newEnemy.vx = Math.sign(BOARD_WIDTH/2 - newEnemy.x) * map(newEnemy.size, MIN_SIZE, MAX_SIZE, MAX_SPEED, MIN_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
    spawnEnemy.speed && (newEnemy.vx = Math.min(MAX_SPEED, newEnemy.vx * spawnEnemy.speed));
    newEnemy.x += newEnemy.size * CAR_LENGTH_UNIT * Math.sign(newEnemy.x - BOARD_WIDTH/2);
    return [...state, newEnemy];
  }
  if (updateID) {
    return state.map(enemy => enemy.key !== updateID ? enemy : { ...enemy, ...newData });
  }
  if (removeKey) {
    return state.filter(enemy => enemy.key !== removeKey);
  }
  if (stepAll) {
    return state.filter(enemy => {
      enemy.x += enemy.vx;
      if (enemy.x < -enemy.size*CAR_LENGTH_UNIT || enemy.x > (BOARD_WIDTH + enemy.size*CAR_LENGTH_UNIT)) {
        return false;
      }
      return true;
    });
  }
  console.log('unkown enemies update', state, action);
  return state;
};

const drawCar = (p5, car) => {
  p5.push();
  p5.translate(car.x, car.y);
  p5.noStroke();
  p5.rectMode(p5.CENTER);
  const width = car.size * CAR_LENGTH_UNIT;
  p5.fill(0);
  p5.rect(-width*1/3,-CAR_HEIGHT/2,10,5);
  p5.rect(width*1/3,-CAR_HEIGHT/2,10,5);
  p5.rect(-width*1/3,CAR_HEIGHT/2,10,5);
  p5.rect(width*1/3,CAR_HEIGHT/2,10,5);
  p5.fill(...car.color);
  p5.rect(0,0,width,CAR_HEIGHT);
  p5.pop();
};

const drawFrog = (p5, x, y, color = PLAYER_COLOR) => {
  p5.push();
  p5.translate(x,y);
  p5.noStroke();
  p5.fill(...color);
  p5.ellipse(0,0, PLAYER_WIDTH, PLAYER_HEIGHT);
  p5.ellipse(-PLAYER_WIDTH/3,PLAYER_HEIGHT/2-2,PLAYER_WIDTH,5);
  p5.ellipse(PLAYER_WIDTH/3,PLAYER_HEIGHT/2-2,PLAYER_WIDTH,5);
  p5.fill(255);
  p5.ellipse(0,-PLAYER_HEIGHT/4,PLAYER_WIDTH/2,PLAYER_WIDTH/2);
  p5.fill(0);
  p5.ellipse(0,-PLAYER_HEIGHT/4,PLAYER_WIDTH/4,PLAYER_WIDTH/4);
  p5.pop();
};

const RoadCross = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 500);

  const [ alive, setAlive ] = useState(true);
  const [ score, setScore ] = useState(0);
  const [ canMove, setCanMove ] = useState(false);

  const [ enemies, updateEnemies ] = useReducer(enemiesReducer, []);

  const initialSpawn = useCallback(() => {
    updateEnemies({spawnEnemy: {speed:2}});
    updateEnemies({spawnEnemy: {speed:2}});
    updateEnemies({spawnEnemy: {speed:1}});
    updateEnemies({spawnEnemy: {speed:1}});
    updateEnemies({spawnEnemy: {speed:0.8}});
    updateEnemies({spawnEnemy: {speed:0.8}});
    // updateEnemies({spawnEnemy: {speed:2}});
    // updateEnemies({spawnEnemy: {speed:3}});
    // updateEnemies({spawnEnemy: {speed:4}});
  }, []);

  useEffect(initialSpawn, [initialSpawn]);

  const restart = useCallback((p5) => {
    setAlive(true);
    setScore(0);
    // setCanMove(false);
    updateEnemies({reset: []});
    initialSpawn();
    p5.loop();
  }, [initialSpawn]);

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_WIDTH, BOARD_HEIGHT);
    p5.noStroke();
  }, []);

  const drawBackground = useCallback((p5) => {
    p5.background(...(canMove ? GRASS_COLOR : [255,0,0]));
    p5.push();
    p5.noStroke();
    p5.fill(...ROAD_COLOR);
    p5.rectMode(p5.CENTER);
    p5.rect(BOARD_WIDTH/2, BOARD_HEIGHT/2, BOARD_WIDTH, NUM_ROADS/(NUM_ROADS+2) * BOARD_HEIGHT);
    p5.stroke(...LINE_COLOR);
    p5.drawingContext.setLineDash([20,10]);
    for (let i = 2; i <= NUM_ROADS; i++) {
      p5.line(0,i*LANE_HEIGHT,BOARD_WIDTH,i*LANE_HEIGHT);
    }
    p5.drawingContext.setLineDash([]);
    p5.pop();
  }, [canMove]);

  const draw = useCallback((p5) => {
    if (finished) {
      return;
    }
    updateEnemies({stepAll: true});
    const collided = enemies.find(enemy => enemy.y === (score + 0.5) * LANE_HEIGHT && Math.abs(enemy.x - BOARD_WIDTH/2) < (enemy.size * CAR_LENGTH_UNIT / 2 + PLAYER_WIDTH/2));
    if (collided) {
      setAlive(false);
      p5.noLoop();
    }
    drawBackground(p5);
    enemies.forEach(enemy => {
      drawCar(p5, enemy);
    });
    drawFrog(p5, BOARD_WIDTH/2, (score + 0.5) * LANE_HEIGHT);
    if (score === SCORE_TO_WIN) {
      finishTask();
    }
  }, [drawBackground, score,finished,finishTask, enemies]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    if (!alive) {
      restart(p5);
      return;
    }
    canMove && setScore(prev => prev + 1);
  }, [alive,restart,canMove]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;
  // const mouseDragged = mousePressed;
  // const touchMoved = mouseDragged;



  useInterval(useCallback(() => {
    updateEnemies({spawnEnemy: true});
  }, []), 1000 / ENEMY_SPAWN_RATE);

  useNonResettingTimeout(useCallback(() => {
    setCanMove(true);
  }, []), 0);

  return (
    <>
      <Sketch className={`${finished ? "animate-jiggle" : ""}`} { ...{ setup, draw, mousePressed, touchStarted } } width={`${BOARD_WIDTH}`} height={`${BOARD_HEIGHT}`} />
      <div className="w-full flex">
        <p className="my-2 mx-auto text-2xl font-bold">
          {score < SCORE_TO_WIN ? "" : "SUCCESS!!"}
        </p>
      </div>
    </>
  );
};

export default RoadCross;
