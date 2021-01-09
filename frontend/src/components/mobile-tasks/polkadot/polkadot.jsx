import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Sketch from 'polyfills/react-p5';

// import * as sketch from './sketch';

import { map } from 'utils';

const USE_SKETCH = true;
const SCORE_TO_WIN = 7;
const TASK_COMPLETION_TIME = 5000;

const BOARD_SIZE = 250;
const INITIAL_SIZE = 15;
const SIZE_INCR = 3;
const MAX_SIZE = 150;
const MIN_SIZE = 10;
const MAX_PERC_DIFF = 0.02;

const MAX_ENEMIES = 20;
const ENEMY_SPAWN_RATE = 3;
const PROB_CAN_EAT = 0.4;
const MIN_SPEED = 0.25;
const MAX_SPEED = 2;

const SCALE = 1;
const BACKGROUND_COLOR = [180, 242, 114];
const PLAYER_COLOR = [229, 136, 247];

const ENEMY_ANGLE_BELL = 2;
const randomEnemySize = (playerSize) => {
  let min = MIN_SIZE < playerSize - 35 ? playerSize - 35 : MIN_SIZE;
  let max = MAX_SIZE > playerSize + 100 ? playerSize + 100 : MAX_SIZE;
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
    const newAngle = currAngle * 0.3 + angleToCenter * 0.7;
    newEnemy.vx = speed * Math.cos(newAngle);
    newEnemy.vy = speed * Math.sin(newAngle);
    console.log('spawn', newEnemy.x, newEnemy.y, BOARD_SIZE/2, angleToCenter, currAngle, newAngle);
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
      // console.log(enemy);
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      if (enemy.x < -enemy.size/2 || enemy.x > (BOARD_SIZE + enemy.size/2)
          || enemy.y < -enemy.size/2 || enemy.y > (BOARD_SIZE + enemy.size/2)) {
        return false;
        // enemy.vx = 0;
        // enemy.vy = 0;
      }
      return true;
    });
  }
  console.log('unkown enemies update', state, action);
  return state;
};


const Polkadot = (props) => {
  const { finish, onExit } = props;
  const completeTask = useCallback(() => {
    console.log('complete');
    finish();
    onExit(true);
  }, [finish, onExit]);

  const gameDivRef = useRef();

  const [ finished, setFinished ] = useState(false);
  const [ alive, setAlive ] = useState(true);
  const [ score, setScore ] = useState(0);
  const playerSize = useMemo(() => INITIAL_SIZE + score*SIZE_INCR, [score]);
  const [ x, _setX ] = useState(BOARD_SIZE / 2);
  const [ y, _setY ] = useState(BOARD_SIZE / 2);
  const setX = useCallback((newX) => {
    finished ? _setX(newX) : _setX(Math.min(Math.max(newX, playerSize), BOARD_SIZE));
  }, [finished, playerSize]);
  const setY = useCallback((newY) => {
    finished ? _setY(newY) : _setY(Math.min(Math.max(newY, playerSize), BOARD_SIZE));
  }, [finished, playerSize]);

  const [ enemies, updateEnemies ] = useReducer(enemiesReducer, []);

  const restart = useCallback((p5) => {
    setAlive(true);
    setScore(0);
    updateEnemies({reset: []});
    p5.loop();
  }, []);

  const spawnEnemyIntervalRef = useRef();
  const finishedTimeoutRef = useRef();

  const setup = useCallback((p5) => {
    // console.log(p5);
    // console.log('setup');
    p5.createCanvas(BOARD_SIZE, BOARD_SIZE);
    p5.noStroke();
    // p5.background(...BACKGROUND_COLOR);
  }, []);

  const draw = useCallback((p5) => {
    if (finished) {
      setScore(prev => prev * 1.2);
      // setScore();
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
    const collided = enemies.find(enemy => Math.hypot(enemy.x - x,enemy.y - y) < ((enemy.size + playerSize) * SCALE / 2));
    if (collided) {
      if (collided.size / playerSize <= (1 + MAX_PERC_DIFF)) {
        setScore(prev => prev + 1);
        updateEnemies({removeKey: collided.key});
        if (score === SCORE_TO_WIN - 1) {
          setFinished(true);
          finishedTimeoutRef.current = setTimeout(() => {
            completeTask();
          }, 500);
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
  }, [score,finished,completeTask, enemies, x,y,playerSize]);

  const mousePressed = useCallback((p5) => {
    console.log('mouse event');
    if (!alive) {
      restart(p5);
    }
    setX(p5.mouseX);
    setY(p5.mouseY);
  }, [alive,restart, setX,setY]);
  const touchStarted = useMemo(() => mousePressed, [mousePressed]);

  const mouseMoved = useMemo(() => mousePressed, [mousePressed]);
  // const mouseMoved = useCallback((p5) => {
  //   console.log('mouse move');
  //   setX(p5.mouseX);
  //   setY(p5.mouseY);
  // }, [setX, setY]);
  const touchMoved = useMemo(() => mouseMoved, [mouseMoved]);

  // useEffect(() => {
  //   const handleMouseEvent = (event) => {
  //     setX(event.offsetX);
  //     setY(event.offsetY);
  //   };
  //   const handleTouchEvent = (event) => {
  //     const touch = event.targetTouches[0];
  //     if (touch) {
  //       const boundingRect = gameDivRef.current.getBoundingClientRect();
  //       if (touch.clientX > boundingRect.left && touch.clientX < boundingRect.right
  //           && touch.clientY > boundingRect.top && touch.clientY < boundingRect.bottom) {
  //         setX(touch.clientX - boundingRect.left);
  //         setY(touch.clientY - boundingRect.top);
  //       }
  //     }
  //   };
  //   const gameDiv = gameDivRef.current;
  //   gameDiv.addEventListener("mousedown", handleMouseEvent);
  //   gameDiv.addEventListener("mousemove", handleMouseEvent);
  //   gameDiv.addEventListener("touchstart", handleTouchEvent);
  //   gameDiv.addEventListener("touchmove", handleTouchEvent);
  //   return () => {
  //     gameDiv.removeEventListener("mousedown", handleMouseEvent);
  //     gameDiv.removeEventListener("mousemove", handleMouseEvent);
  //     gameDiv.removeEventListener("touchstart", handleTouchEvent);
  //     gameDiv.removeEventListener("touchmove", handleTouchEvent);
  //   };
  // }, [setX, setY]);

  useEffect(() => {
    // !checkWinTimeoutRef.current && checkWinTimeoutRef.current = setTimeout(() => {
    //   if (alive) {
    //     console.log("yay you lasted enough time");
    //     completeTask();
    //   }
    // }, TASK_COMPLETION_TIME);
    spawnEnemyIntervalRef.current = setInterval(() => {
      updateEnemies({spawnEnemy: { playerSize }});
      // console.log('spawn enemy');
    }, 1000 / ENEMY_SPAWN_RATE);
    return () => {
      clearInterval(spawnEnemyIntervalRef.current);
    }
  }, [alive, completeTask, playerSize]);

  useEffect(() => {
    return () => {
      clearTimeout(finishedTimeoutRef.current);
    };
  }, []);

  // useEffect(() => {
  //   const update = () => {
  //     if (!alive) {
  //       restart();
  //       return;
  //     }
  //     updateEnemies({stepAll: true});
  //     const collided = enemies.find(enemy => Math.hypot(enemy.x - x,enemy.y - y) < ((enemy.size + playerSize) * SCALE / 2));
  //     if (collided) {
  //       if (collided.size / playerSize <= (1 + MAX_PERC_DIFF)) {
  //         setScore(prev => prev + 1);
  //         updateEnemies({removeKey: collided.key});
  //       } else {
  //         setAlive(false);
  //       }
  //     }
  //     // animationRequestRef.current = requestAnimationFrame(update);
  //   };
  //   animationRequestRef.current = setInterval(update, 100);
  //   return () => {
  //     clearInterval(animationRequestRef.current);
  //   };
  // }, [alive,restart, enemies, x,y,playerSize]);

  // console.log(enemies);
  return (
    <>
      { USE_SKETCH && <Sketch { ...{ setup, draw, mousePressed, mouseMoved, touchStarted, touchMoved } } width="BOARD_SIZE" height="BOARD_SIZE" /> }
      { !USE_SKETCH && <div className="relative w-64 h-64 overflow-hidden" ref={gameDivRef} style={{
          backgroundColor: `rgb(${BACKGROUND_COLOR})`
        }}>
        <div className="absolute rounded-full transform-gpu -translate-x-1/2 -translate-y-1/2" style={{
            left: x,
            top: y,
            width: playerSize,
            height: playerSize,
            backgroundColor: `rgb(${PLAYER_COLOR})`
          }}>
          <p className="m-auto text-xs w-min h-min">{score}</p>
        </div>
        { enemies.map(enemy => {
          return <div key={enemy.key} className="absolute rounded-full transform-gpu -translate-x-1/2 -translate-y-1/2" style={{
              left: enemy.x,
              top: enemy.y,
              width: enemy.size,
              height: enemy.size,
              backgroundColor: `rgb(${enemy.color})`
            }} />
        })}
      </div> }
      <div className="w-full flex">
        <p className="my-2 mx-auto text-2xl font-bold">
          {score < SCORE_TO_WIN ? `Score: ${score}/${SCORE_TO_WIN}` : "SUCCESS!!"}
        </p>
      </div>
    </>
  );
};

export default Polkadot;
