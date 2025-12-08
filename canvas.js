/**
 * Canvas module - Canvas setup and utilities
 */

import { DPR_MAX } from './constants.js';

let _canvas = null;
let _ctx = null;
let _W = 0;
let _H = 0;
const _DPR = Math.max(1, Math.min(DPR_MAX, window.devicePixelRatio || 1));

export function initCanvas() {
  _canvas = document.getElementById('scene');
  if (!_canvas) {
    const errorMsg = 'Canvas element not found. Your browser may not support this application.';
    console.error(errorMsg);
    document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px; font-family: sans-serif; background: #08142c;">${errorMsg}</div>`;
    throw new Error('Canvas element not found');
  }

  _ctx = _canvas.getContext('2d');
  if (!_ctx) {
    const errorMsg = 'Your browser does not support canvas 2D context.';
    console.error(errorMsg);
    document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px; font-family: sans-serif; background: #08142c;">${errorMsg}</div>`;
    throw new Error('2D context not supported');
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  return { canvas: _canvas, ctx: _ctx };
}

export function resize() {
  _W = Math.floor(window.innerWidth);
  _H = Math.floor(window.innerHeight);
  _canvas.width = Math.floor(_W * _DPR);
  _canvas.height = Math.floor(_H * _DPR);
  _canvas.style.width = _W + 'px';
  _canvas.style.height = _H + 'px';
  _ctx.setTransform(_DPR, 0, 0, _DPR, 0, 0);
}

export function getCanvas() {
  return _canvas;
}

export function getCtx() {
  return _ctx;
}

export function getW() {
  return _W;
}

export function getH() {
  return _H;
}

export function getDPR() {
  return _DPR;
}

export function getCanvasDimensions() {
  return { W: _W, H: _H };
}
