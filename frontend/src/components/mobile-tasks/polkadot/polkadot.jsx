import React, { useCallback, useMemo, useReducer, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event, useInterval } from 'hooks';
import { map } from 'utils';

const SCORE_TO_WIN = 7;

const BOARD_SIZE = 250;
const INTERACTION_MARGIN = 10;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_SIZE+INTERACTION_MARGIN];

const INITIAL_SIZE = 15;
const SIZE_INCR = 4;
const MAX_SIZE = 120;
const MIN_SIZE = 8;
const MAX_PERC_DIFF = 0.05;

const MAX_ENEMIES = 15;
const ENEMY_SPAWN_RATE = 2.5;
const PROB_CAN_EAT = 0.4;
const MIN_SPEED = 0.25;
const MAX_SPEED = 1.75;

const BACKGROUND_COLOR = [180, 242, 114];
const PLAYER_COLOR = [229, 136, 247];

const ENEMY_ANGLE_BELL = 2;
const randomEnemySize = (playerSize) => {
  let min = MIN_SIZE < playerSize - 35 ? playerSize - 35 : MIN_SIZE;
  let max = MAX_SIZE > playerSize + 70 ? playerSize + 70 : MAX_SIZE;
  return (Math.random() < PROB_CAN_EAT ? Math.random() * (playerSize - min) : (Math.random() * (max - min) / 2 + Math.random() * (playerSize - min) / 2)) + min;
};

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
      size: randomEnemySize(spawnEnemy.playerSize),
      x: Math.random() * BOARD_SIZE,
      y: Math.random() * BOARD_SIZE,
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    };
    let speed = map(newEnemy.size, MIN_SIZE, MAX_SIZE, MAX_SPEED, MIN_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
    let angle = 0;
    for (let i = 0; i < ENEMY_ANGLE_BELL; i++) {
      angle += (Math.random() * Math.PI / 2) / ENEMY_ANGLE_BELL;
    }
    newEnemy.vx = speed * Math.cos(angle);
    newEnemy.vy = speed * Math.sin(angle);
    if (Math.random() < 0.5) {
      if (Math.random() < 0.5) {
        newEnemy.x = -newEnemy.size/2;
      } else {
        newEnemy.x = BOARD_SIZE + newEnemy.size/2;
        newEnemy.vx *= -1;
      }
      if (Math.sign(BOARD_SIZE/2 - newEnemy.y) === Math.sign(newEnemy.vy) && Math.random() < 0.25) {
        newEnemy.vy *= -1;
      }
    } else {
      if (Math.random() < 0.5) {
        newEnemy.y = -newEnemy.size/2;
      } else {
        newEnemy.y = BOARD_SIZE + newEnemy.size/2;
        newEnemy.vy *= -1;
      }
      if (Math.sign(BOARD_SIZE/2 - newEnemy.x) === Math.sign(newEnemy.vx) && Math.random() < 0.25) {
        newEnemy.vx *= -1;
      }
    }
    const angleToCenter = Math.atan2(BOARD_SIZE / 2 - newEnemy.y, BOARD_SIZE/2 - newEnemy.x);
    const currAngle = Math.atan2(newEnemy.vy, newEnemy.vx);
    const newAngle = currAngle * 0.4 + angleToCenter * 0.6;
    newEnemy.vx = speed * Math.cos(newAngle);
    newEnemy.vy = speed * Math.sin(newAngle);
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
      enemy.y += enemy.vy;
      if (enemy.x < -enemy.size/2 || enemy.x > (BOARD_SIZE + enemy.size/2)
          || enemy.y < -enemy.size/2 || enemy.y > (BOARD_SIZE + enemy.size/2)) {
        return false;
      }
      return true;
    });
  }
  console.log('unkown enemies update', state, action);
  return state;
};


const Polkadot = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 500);

  const [ alive, setAlive ] = useState(true);
  const [ score, setScore ] = useState(0);
  const playerSize = useMemo(() => INITIAL_SIZE + score*SIZE_INCR, [score]);
  const [ x, _setX ] = useState(BOARD_SIZE / 2);
  const [ y, _setY ] = useState(BOARD_SIZE / 2);
  const setX = useCallback((newX) => {
    finished ? _setX(newX) : _setX(Math.min(Math.max(newX, playerSize), BOARD_SIZE - playerSize));
  }, [finished, playerSize]);
  const setY = useCallback((newY) => {
    finished ? _setY(newY) : _setY(Math.min(Math.max(newY, playerSize), BOARD_SIZE - playerSize));
  }, [finished, playerSize]);

  const [ enemies, updateEnemies ] = useReducer(enemiesReducer, []);

  const restart = useCallback((p5) => {
    setAlive(true);
    setScore(0);
    updateEnemies({reset: []});
    p5.loop();
  }, []);

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE);
    p5.noStroke();
    p5.background(...BACKGROUND_COLOR);
  }, []);

  const draw = useCallback((p5) => {
    if (finished) {
      setScore(prev => prev * 1.2);
      p5.background(...BACKGROUND_COLOR);
      enemies.forEach(enemy => {
        p5.fill(...enemy.color);
        p5.circle(enemy.x,enemy.y, enemy.size);
      });
      p5.fill(...PLAYER_COLOR);
      p5.circle(x,y, playerSize);

      p5.stroke(0);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.text("WIN", x,y);
      p5.noStroke();
      return;
    }
    updateEnemies({stepAll: true});
    const collided = enemies.find(enemy => Math.hypot(enemy.x - x,enemy.y - y) < ((enemy.size + playerSize) / 2));
    if (collided) {
      if (collided.size / playerSize <= (1 + MAX_PERC_DIFF)) {
        setScore(prev => prev + 1);
        updateEnemies({removeKey: collided.key});
        if (score === SCORE_TO_WIN - 1) {
          finishTask();
        }
      } else {
        setAlive(false);
        p5.noLoop();
      }
    }
    p5.background(...BACKGROUND_COLOR);
    enemies.forEach(enemy => {
      p5.fill(...enemy.color);
      p5.circle(enemy.x,enemy.y, enemy.size);
    });
    p5.fill(...PLAYER_COLOR);
    p5.circle(x,y, playerSize);

    p5.stroke(0);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(score, x,y);
    p5.noStroke();
  }, [score,finished,finishTask, enemies, x,y,playerSize]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    if (!alive) {
      restart(p5);
    }
    setX(p5.mouseX);
    setY(p5.mouseY);
  }, [alive,restart, setX,setY]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;
  const mouseDragged = mousePressed;
  const touchMoved = mouseDragged;

  useInterval(useCallback(() => {
    updateEnemies({spawnEnemy: { playerSize }});
  }, [playerSize]), 1000 / ENEMY_SPAWN_RATE);

  return (
    <>
      <Sketch className={`${finished ? "animate-jiggle" : ""}`} { ...{ setup, draw, mousePressed, mouseDragged, touchStarted, touchMoved } } width={`${BOARD_SIZE}`} height={`${BOARD_SIZE}`} />
      <div className="w-full flex">
        <p className="my-2 mx-auto text-2xl font-bold">
          {score < SCORE_TO_WIN ? `Score: ${score}/${SCORE_TO_WIN}` : "SUCCESS!!"}
        </p>
      </div>
    </>
  );
};

export default Polkadot;
