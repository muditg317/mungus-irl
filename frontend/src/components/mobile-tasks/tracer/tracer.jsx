import React, { useCallback, useMemo, useState } from 'react';
import Sketch from 'polyfills/react-p5';

import { useTaskFinish, useP5Event } from 'hooks';
import { map, randInRange, P5Tools } from 'utils';

const BOARD_WIDTH = 250;
const BOARD_HEIGHT = BOARD_WIDTH / 2;
const INTERACTION_MARGIN = 10;
const INTERACTION_BOUNDS = [-INTERACTION_MARGIN, BOARD_WIDTH+INTERACTION_MARGIN, -INTERACTION_MARGIN, BOARD_HEIGHT+INTERACTION_MARGIN];

const TRACER_SIZE = 20;
const POINT_SIZE = 17.5;
const PATH_WIDTH = 3;
const DOTTED_WIDTH = 10;

const NUM_POINTS = 4;
const MAX_TRACING_ERROR = 25; // number of pixels you can deviate from path without losing hold
const INCR_X = BOARD_WIDTH / (NUM_POINTS + 1);

const BACKGROUND_COLOR = [3, 25, 69];
const STAR_POSITIONS = (() => {
  const positions = [];
  for (let i = 0; i < 50; i++) {
    positions.push({x: randInRange(BOARD_WIDTH), y: randInRange(BOARD_HEIGHT)});
  }
  return positions;
})();
const TRACER_COLOR = [153, 180, 232];
const POINT_COLOR = [255, 247, 135];
const REACHED_POINT_COLOR = [255, 242, 66];
const PATH_COLOR = [209, 213, 222];


const generateRandomPath = () => {
  const path = [{x: INCR_X, y: randInRange(INCR_X/2, BOARD_HEIGHT - INCR_X/2)}];
  for (let i = 2; i <= NUM_POINTS; i++) {
    let newPoint = {x: INCR_X * i, y: randInRange(INCR_X/2, BOARD_HEIGHT - INCR_X/2)};
    let tries = 0;
    while (tries < 5 && (Math.abs(newPoint.y - path[i-2].y) < BOARD_HEIGHT/6 || (i > 2 && Math.random() < 0.7 && Math.sign(newPoint.y - path[i-2].y) === Math.sign(path[i-2].y - path[i-3].y)))) {
      newPoint = {x: INCR_X * i, y: randInRange(INCR_X/2, BOARD_HEIGHT - INCR_X/2)};
      tries++;
    }
    path.push(newPoint);
  }
  return path;
}

const Tracer = (props) => {
  const { finish, onExit } = props;
  const [ finished, finishTask ] = useTaskFinish(finish, onExit, 750);

  const [ pathPoints, ] = useState(generateRandomPath);
  const [ progress, setProgress ] = useState(1); // which point are you on
  const [ holding, setHolding ] = useState(false); // is the mouse controlling the position of the tracer
  // const currentCheckpoint = useMemo(() => pathPoints[progress], [pathPoints, progress]);
  const currentLine = useMemo(() => {
    // calculate line y=mx+b => return [m,b]
    if (progress >= NUM_POINTS) {
      return (xVal) => randInRange(INCR_X/2, BOARD_HEIGHT-INCR_X/2);
    }
    const p1 = pathPoints[progress-1];
    const p2 = pathPoints[progress];
    const dy = p2.y - p1.y;
    const dx = INCR_X;
    const slope = dy / dx;
    const intercept = p2.y - slope*p2.x;
    const angle = Math.atan2(dy, dx);
    const func = xVal => (xVal*slope + intercept);
    func.p1 = p1;
    func.p2 = p2;
    func.dy = dy;
    func.dx = dx;
    func.slope = slope;
    func.intercept = intercept;
    func.angle = angle;
    return func;
  }, [pathPoints, progress]);
  const [ x, _setX ] = useState(INCR_X);
  const setX = useCallback((newX) => {
    finished ? _setX(newX) : _setX(Math.min(Math.max(newX, currentLine.p1.x), BOARD_WIDTH - INCR_X));
  }, [finished, currentLine]);

  const setup = useCallback((p5) => {
    p5.createCanvas(BOARD_WIDTH, BOARD_HEIGHT);
    p5.noStroke();
    p5.background(...BACKGROUND_COLOR);
  }, []);

  const drawBackground = useCallback((p5) => {
    p5.background(...BACKGROUND_COLOR);
    p5.push();
    p5.fill(...POINT_COLOR);
    p5.noStroke();
    STAR_POSITIONS.forEach(star => {
      P5Tools.star(p5, star.x, star.y, 2,4, Math.floor(map(Math.sin(p5.millis() / 50), -1,1, 5,7)));
    });
    p5.pop();
  }, []);

  const drawPath = useCallback((p5, points, prog) => {
    points.forEach((point, index) => {
      if (index < points.length - 1) {
        const nextPoint = points[index+1];
        const color = [...PATH_COLOR, index < prog-1 ? 200 : (Math.sin(p5.millis() / 200) + 1) / 2 * 100+50];
        p5.stroke(...color);
        p5.strokeWeight(DOTTED_WIDTH);
        if (index >= prog-1) {
          p5.drawingContext.setLineDash([5, 10]);
          p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
          p5.drawingContext.setLineDash([]);
          p5.stroke(...BACKGROUND_COLOR);
          p5.strokeWeight(DOTTED_WIDTH-2);
          p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
          p5.stroke(...color);
          p5.strokeWeight(PATH_WIDTH);
        }
        p5.line(point.x, point.y, nextPoint.x, nextPoint.y);
        p5.noStroke();
      }
      p5.fill(...(index < prog ? REACHED_POINT_COLOR : POINT_COLOR));
      // p5.circle(point.x,point.y, POINT_SIZE);
      P5Tools.star(p5, point.x,point.y, POINT_SIZE/3,POINT_SIZE/2, 5);
    });
  }, []);

  const draw = useCallback((p5) => {
    if (finished) {
      setProgress(prev => prev + 1.5);
      drawBackground(p5);
      drawPath(p5, pathPoints, NUM_POINTS);
      p5.fill(...TRACER_COLOR);
      p5.push();
      p5.translate(BOARD_WIDTH/2,BOARD_HEIGHT/2);
      p5.rotate(p5.millis() / 100);
      p5.scale(progress / NUM_POINTS);
      p5.triangle(-TRACER_SIZE/2, -TRACER_SIZE/2, TRACER_SIZE/2, -TRACER_SIZE/2, 0, TRACER_SIZE);
      p5.pop();
      return;
    }
    if (holding) {
      if (x >= currentLine.p2.x) {
        if (progress < NUM_POINTS-1) {
          setProgress(prev => prev + 1);
        } else {
          finishTask();
        }
      }
    } else {
      const xOff = x - currentLine.p1.x;
      const delta = -Math.min(Math.max(xOff/3, 5), xOff);
      xOff && setX(x + delta);
      // setY(y + delta*currentLine.slope);
    }
    drawBackground(p5);
    drawPath(p5, pathPoints, progress);
    p5.push();
    p5.fill(...TRACER_COLOR);
    // p5.strokeWeight(2);
    // p5.noFill();
    p5.translate(x,currentLine(x));
    p5.rotate(currentLine.angle-Math.PI/2);
    p5.triangle(-TRACER_SIZE/2, -TRACER_SIZE/2, TRACER_SIZE/2, -TRACER_SIZE/2, 0, TRACER_SIZE);
    p5.pop();
  }, [finished,finishTask, drawBackground,drawPath, pathPoints,progress, holding,x,currentLine,setX]);

  const mousePressed = useP5Event(useCallback((p5, event) => {
    if (!holding) {
      if (Math.abs(p5.mouseX - x) < MAX_TRACING_ERROR/2 && Math.abs(p5.mouseY - currentLine(x)) < MAX_TRACING_ERROR/2) {
        setHolding(true);
      }
    }
  }, [holding, x, currentLine]), INTERACTION_BOUNDS);
  const touchStarted = mousePressed;

  const mouseDragged = useP5Event(useCallback((p5, event) => {
    if (holding) {
      if (Math.abs(p5.mouseX - x) < MAX_TRACING_ERROR && Math.abs(p5.mouseY - currentLine(x)) < MAX_TRACING_ERROR) {
        setX(p5.mouseX);
      } else {
        setHolding(false);
      }
    }
  }, [holding, x,setX, currentLine]), INTERACTION_BOUNDS);
  const touchMoved = mouseDragged;

  const mouseReleased = useP5Event(useCallback((p5, event) => {
    setHolding(false);
  }, []), INTERACTION_BOUNDS);
  const touchEnded = mouseReleased;

  return (
    <>
      <Sketch className={`${finished ? "animate-ping" : ""}`} { ...{ setup, draw, mousePressed, mouseDragged, mouseReleased, touchStarted, touchMoved, touchEnded } } width={`${BOARD_WIDTH}`} height={`${BOARD_HEIGHT}`} />
    </>
  );
};

export default Tracer;
