/**
 * Audio module - Handles background music with error handling
 */

import { MUSIC_URL, DEFAULT_VOLUME, DEBUG } from './constants.js';

function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

// Audio setup with error handling
let audio = null;
let isMuted = false;

export function initAudio() {
  try {
    audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    debugLog('Audio initialized successfully');
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
  return audio;
}

export function playAudio() {
  if (!audio) return;

  try {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          debugLog('Audio playback started');
          isMuted = false;
        })
        .catch(err => {
          console.warn('Audio autoplay blocked. User interaction required:', err);
        });
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

export function pauseAudio() {
  if (!audio) return;

  try {
    audio.pause();
    isMuted = true;
    debugLog('Audio paused');
  } catch (error) {
    console.error('Error pausing audio:', error);
  }
}

export function toggleAudio() {
  if (!audio) return;

  if (audio.paused) {
    playAudio();
  } else {
    pauseAudio();
  }

  return !audio.paused;
}

export function isAudioPlaying() {
  return audio && !audio.paused;
}

export function getAudio() {
  return audio;
}
