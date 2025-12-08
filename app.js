/**
 * Christmas 2D canvas app
 * - Houses at memory stops
 * - Prompt when avatar is close to door
 * - Enter-house animation with door glow
 * - Reliable start button + audio unlock fallback
 */

// ===== MODULE IMPORTS =====
import {
  AVATAR_SCREEN_POSITION,
  WALKING_SPEED,
  HOUSE_PROXIMITY_THRESHOLD,
  HOUSE_WIDTH,
  HOUSE_HEIGHT,
  HOUSE_OFFSCREEN_MARGIN,
  HOUSE_GLOW_PROXIMITY,
  GROUND_HEIGHT_RATIO,
  ENTER_ANIMATION_SPEED,
  STAR_COUNT,
  SNOWFLAKE_COUNT,
  TREE_COUNT,
  SANTA_PICKUP_SPEED_IN,
  SANTA_PICKUP_SPEED_OUT,
  SANTA_PICKUP_RISE_RATE,
  SANTA_PICKUP_DISTANCE,
  SANTA_EXIT_DISTANCE,
  SANTA_BOARDING_PAUSE,
  DPR_MAX,
  FLOWER_COLORS,
  TREE_TRUNK_HEIGHT_RATIO,
  TREE_OFFSCREEN_MARGIN,
  FAMILY_ANIMATION_SPEED,
  STAR_TWINKLE_SPEED_FAST,
  STAR_TWINKLE_SPEED_SLOW,
  SNOW_ALPHA,
  WALKING_ANIMATION_SPEED,
  ENVELOPE_OPEN_DURATION,
  LETTER_APPEAR_DELAY,
  AURORA_WAVE_COUNT,
  AURORA_SPEED,
  AURORA_COLORS,
  FOOTPRINT_FADE_DURATION,
  FOOTPRINT_SPACING,
  WINDOW_FLICKER_SPEED,
  SMOKE_PARTICLE_COUNT,
  SMOKE_RISE_SPEED,
  SMOKE_SWAY_AMOUNT,
  SPARKLE_COUNT,
  SPARKLE_LIFETIME,
  SPARKLE_SIZE,
  SHOOTING_STAR_CHANCE,
  SHOOTING_STAR_SPEED,
  SHOOTING_STAR_LENGTH,
  ICICLE_COUNT_PER_HOUSE,
  MOON_SIZE,
  MOON_GLOW_SIZE,
  HOUSE_LIGHTS_COUNT,
  LIGHT_COLORS,
  SNOWDRIFT_COUNT,
  DEER_SPAWN_CHANCE,
  DEER_SPEED,
  GROUND_SPARKLE_COUNT,
  GROUND_SPARKLE_TWINKLE_SPEED,
  MAGIC_PARTICLE_COUNT,
  MAGIC_PARTICLE_LIFETIME,
  FOOTSTEP_INTERVAL,
  FOOTSTEP_VOLUME,
  MOON_CLICK_RADIUS,
  DOOR_OPEN_ANGLE,
  DOOR_ANIMATION_SPEED,
  DEBUG
} from './constants.js';

import { initCanvas, getCanvas, getCtx, getW, getH, getDPR } from './canvas.js';
import { initAudio, playAudio, pauseAudio, toggleAudio, isAudioPlaying, getAudio } from './audio.js';
import { gameState, resetGameState, updatePerformanceCaches, gradientCache, particlePools, initParticlePools } from './gameState.js';

// ===== DEBUG LOGGING =====
function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

// Initialize canvas (from canvas.js module)
initCanvas();
const canvas = getCanvas();
const ctx = getCtx();
const DPR = getDPR();

// Keep local references to dimensions for convenience
let W = getW();
let H = getH();

// Moon click detection
canvas.addEventListener('click', (e) => {
  if (!gameState.running) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const moonX = W * 0.85;
  const moonY = H * 0.15;

  const dist = Math.sqrt((clickX - moonX) ** 2 + (clickY - moonY) ** 2);

  if (dist < MOON_CLICK_RADIUS) {
    // Toggle moon color between pink and white
    gameState.moonClicked = !gameState.moonClicked;
    gameState.moonAnimationProgress = 0;
  }
});

// Update dimensions on window resize
window.addEventListener('resize', () => {
  W = getW();
  H = getH();
  // Invalidate gradient cache on resize
  gradientCache.moonGlow = null;
  gradientCache.auroraGradients = [];
}, { passive: true });

// UI
const introEl   = document.getElementById('intro');
const promptEl  = document.getElementById('prompt');
const memoryEl  = document.getElementById('memory');
const flowersPromptEl = document.getElementById('flowersPrompt');
const northPoleEl = document.getElementById('northPole');
const presentsPromptEl = document.getElementById('presentsPrompt');
const presentsYesBtn = document.getElementById('presentsYes');
const presentsNoBtn  = document.getElementById('presentsNo');
const flowersYesBtn = document.getElementById('flowersYes');
const flowersNoBtn = document.getElementById('flowersNo');
const hudEl     = document.getElementById('hud');

const startBtn = document.getElementById('startBtn');
const viewBtn = document.getElementById('viewBtn');
const continueBtn = document.getElementById('continueBtn');
const closeMemoryBtn = document.getElementById('closeMemoryBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');

const promptTitle = document.getElementById('promptTitle');
const promptText  = document.getElementById('promptText');
const memoryTitle = document.getElementById('memoryTitle');
const memoryImg   = document.getElementById('memoryImg');
const imageCounter = document.getElementById('imageCounter');
const prevImageBtn = document.getElementById('prevImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');

// Initialize audio (from audio.js module)
initAudio();
const audio = getAudio();

// Initialize particle pools for performance
initParticlePools();

// Memory stops (== house positions) - positioned so girl starts well before first house
const memories = [
  {
    x: 400,
    title: "Your Sydney Birthday",
    images: [
      { src: "assets/memories/sydney.jpg" },
      { src: "assets/memories/sydney2.jpg" },
      { src: "assets/memories/sydney3.jpg" }
    ]
  },
  {
    x: 700,
    title: "Our Korea Adventure",
    images: [
      { src: "assets/memories/korea.jpg" },
      { src: "assets/memories/korea2.jpg" },
      { src: "assets/memories/korea3.jpg" }
    ]
  },
  {
    x: 1000,
    title: "Cruising around Europe",
    images: [
      { src: "assets/memories/europe.jpg" },
      { src: "assets/memories/europe2.jpg" },
      { src: "assets/memories/europe3.jpg" }
    ]
  },
  {
    x: 1400,
    title: "Christmas with Nanny & Grandma",
    images: [
      { src: "assets/memories/nanny.jpg" },
      { src: "assets/memories/nanny2.jpg" },
      { src: "assets/memories/nanny3.jpg" },
      { src: "assets/memories/grandma.jpg" },
      { src: "assets/memories/grandma2.jpg" },
      { src: "assets/memories/grandma3.jpg" },
      { src: "assets/memories/both.jpg" },
      { src: "assets/memories/both2.jpg" }
    ],
    isNanny: true
  }
];
const endX = memories[memories.length-1].x + 320;

// Preload all memory images
// OPTIMIZED: Store image references to prevent re-creation
let imagesPreloaded = false;
const preloadedImages = new Map(); // Store Image objects by src

function preloadImages() {
  if (imagesPreloaded) return; // Prevent duplicate preloading

  const imagePromises = [];
  memories.forEach(memory => {
    memory.images.forEach(imgData => {
      const img = new Image();
      const promise = new Promise((resolve) => {
        img.onload = () => {
          preloadedImages.set(imgData.src, img); // Store reference
          resolve();
        };
        img.onerror = () => {
          console.warn('[preload] Failed to load image:', imgData.src);
          resolve(); // Don't block on errors
        };
      });
      img.src = imgData.src;
      imagePromises.push(promise);
    });
  });
  Promise.all(imagePromises).then(() => {
    imagesPreloaded = true;
    debugLog('[preload] All memory images loaded:', preloadedImages.size);
  });
}

// Trees - spread out more to avoid overlapping bunches
const trees = Array.from({length: TREE_COUNT}).map((_,i)=>{
  const depth = 1 + (i%3);
  // Increased spacing from 110 to 180, and more variation
  const baseX = i*180 + (i%5)*45 + Math.random()*30;
  return { x: baseX, depth, phase: Math.random()*Math.PI*2 };
});

// ===== NEW VISUAL FEATURES =====

// Footprints trail
const footprints = [];

// Sparkle trail for avatar/Santa - using object pooling
const sparkles = particlePools.sparkles;
let activeSparkleCount = 0;

// Shooting stars - using object pooling
const shootingStars = particlePools.shootingStars;
let activeShootingStarCount = 0;

// Chimney smoke particles (per house)
const smokeParticles = new Map(); // key: house index, value: array of smoke particles

// Snowdrifts
const snowdrifts = Array.from({length: SNOWDRIFT_COUNT}).map(() => ({
  x: Math.random() * 3000,
  width: 40 + Math.random() * 80,
  height: 15 + Math.random() * 25
}));

// Deer/Woodland Creatures
const deer = [];

// Ground sparkles
const groundSparkles = Array.from({length: GROUND_SPARKLE_COUNT}).map(() => ({
  x: Math.random() * 3000,
  y: 0, // Will be set based on ground height
  phase: Math.random() * Math.PI * 2,
  size: 1 + Math.random() * 2
}));

// Magic particle bursts
const magicParticles = [];

// Background Santa variables
let santa = { x: -400, y: 80, speed: 1.6, active: false, timer: 0 };

// Family members for Nanny tribute (not in gameState - these are configuration data)
let familyMembers = [
  { name: 'Dad', offsetX: -80, height: 70, carryingFlowers: true, hairColor: '#4a3728', shirtColor: '#2c5f8d', isMale: true },
  { name: 'Mum', offsetX: -40, height: 63, carryingFlowers: true, hairColor: '#8b5a3c', shirtColor: '#2d8659', isMale: false },
  { name: 'Sister', offsetX: 40, height: 60, carryingFlowers: true, hairColor: '#f4d03f', shirtColor: '#9c4d8a', isMale: false }
];

// Helpers
function houseScreenX(worldX){ return Math.floor(worldX - gameState.cachedScrollX_035); }

// Audio unlock on first user interaction
let audioUnlocked = false;
async function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  await initAudio();
  // Attempt to play (will resume when user starts journey)
  try {
    await audio.play();
    audio.pause(); // Pause until journey starts
  } catch (e) {
    console.warn('[audio] Auto-unlock failed, will retry on journey start');
  }

  window.removeEventListener('touchstart', unlockAudio);
  window.removeEventListener('click', unlockAudio);
}
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('click', unlockAudio, { passive: true });

// ===== FOOTSTEP SOUND GENERATOR =====
let audioContext = null;
function playFootstepSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create a short "crunch" sound using pink noise
    const duration = 0.08;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise (softer snow crunch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      // Apply envelope for realistic crunch
      const envelope = Math.exp(-i / (bufferSize * 0.2));
      data[i] = pink * envelope * 0.3;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = FOOTSTEP_VOLUME;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start();
  } catch (e) {
    // Silently fail if audio context not available
  }
}

// Envelope opening animation
const envelopeContainer = document.getElementById('envelopeContainer');
const letterEl = document.getElementById('letter');

// Stage 1: Click envelope to open it
if (envelopeContainer) {
  envelopeContainer.addEventListener('click', () => {
    const envelopeEl = envelopeContainer.querySelector('.envelope');
    if (envelopeEl && !envelopeEl.classList.contains('opening')) {
      // Open the envelope
      envelopeEl.classList.add('opening');

      // Start preloading images immediately
      preloadImages();

      // After envelope opens, hide it and show the letter
      setTimeout(() => {
        envelopeContainer.style.display = 'none';
        letterEl.classList.remove('hidden');
        setTimeout(() => {
          letterEl.classList.add('show');
        }, LETTER_APPEAR_DELAY);
      }, ENVELOPE_OPEN_DURATION);
    }
  });
}

// Stage 2: Click "Let's Go" button to start journey
async function startJourney(){
  introEl.classList.add('hidden');
  hudEl.classList.remove('hidden');
  gameState.running = true;

  // Enable canvas pointer events for moon click
  canvas.style.pointerEvents = 'auto';

  // Start audio playback using module function
  playAudio();
  if (muteBtn) {
    muteBtn.textContent = 'Mute';
  }
}

startBtn.addEventListener('click', startJourney);

// HUD mute / play
muteBtn.addEventListener('click', () => {
  const isPlaying = toggleAudio();
  if (muteBtn) {
    muteBtn.textContent = isPlaying ? 'Mute' : 'Play Music';
  }
});
// Canvas quick tap nudge
canvas.addEventListener('touchstart', () => { if (!gameState.pausedForPrompt && gameState.running && !gameState.entering) gameState.scrollX += 5; }, { passive: true });

// ACCESSIBILITY: Keyboard navigation
window.addEventListener('keydown', (e) => {
  // Enter key - trigger primary action on current overlay
  if (e.key === 'Enter') {
    if (!promptEl.classList.contains('hidden') && viewBtn) {
      viewBtn.click();
      e.preventDefault();
    } else if (!memoryEl.classList.contains('hidden') && closeMemoryBtn) {
      closeMemoryBtn.click();
      e.preventDefault();
    } else if (!presentsPromptEl.classList.contains('hidden') && presentsYesBtn) {
      presentsYesBtn.click();
      e.preventDefault();
    } else if (!flowersPromptEl.classList.contains('hidden') && flowersYesBtn) {
      flowersYesBtn.click();
      e.preventDefault();
    }
  }

  // Arrow keys - navigate memory images
  if (!memoryEl.classList.contains('hidden')) {
    if (e.key === 'ArrowRight' && nextImageBtn) {
      nextImageBtn.click();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && prevImageBtn) {
      prevImageBtn.click();
      e.preventDefault();
    }
  }

  // Escape key - close current overlay
  if (e.key === 'Escape') {
    if (!memoryEl.classList.contains('hidden') && closeMemoryBtn) {
      closeMemoryBtn.click();
      e.preventDefault();
    } else if (!promptEl.classList.contains('hidden') && continueBtn) {
      continueBtn.click();
      e.preventDefault();
    } else if (!presentsPromptEl.classList.contains('hidden') && presentsNoBtn) {
      presentsNoBtn.click();
      e.preventDefault();
    } else if (!flowersPromptEl.classList.contains('hidden') && flowersNoBtn) {
      flowersNoBtn.click();
      e.preventDefault();
    }
  }
});

// Drawing
function drawSky(){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#08142c'); g.addColorStop(1, '#07101f');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // Moon with glow
  drawMoon();

  // Aurora Borealis (Northern Lights)
  drawAurora();

  // OPTIMIZED: stars - batch rendering, set fill style once
  ctx.fillStyle = '#eaf6ff';
  const tStar = gameState.t * STAR_TWINKLE_SPEED_FAST;
  const tStarSlow = gameState.t * STAR_TWINKLE_SPEED_SLOW;
  for (let i=0;i<STAR_COUNT;i++){
    const x = (i*97 + tStarSlow) % W;
    const y = ((i*53)%300) + 10;
    const tw = 0.6+0.4*Math.sin(tStar + i);
    ctx.globalAlpha = tw;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Shooting stars
  drawShootingStars();
}

function drawAurora() {
  ctx.save();

  // OPTIMIZATION: Cache aurora gradients
  if (gradientCache.auroraGradients.length === 0) {
    for (let w = 0; w < AURORA_WAVE_COUNT; w++) {
      const color = AURORA_COLORS[w % AURORA_COLORS.length];
      const auroraGradient = ctx.createLinearGradient(0, 0, 0, H * 0.4);
      auroraGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      auroraGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
      auroraGradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
      auroraGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      gradientCache.auroraGradients.push(auroraGradient);
    }
  }

  // Draw multiple aurora waves
  for (let w = 0; w < AURORA_WAVE_COUNT; w++) {
    const offset = w * 80;
    const waveSpeed = AURORA_SPEED * (1 + w * 0.3);

    ctx.fillStyle = gradientCache.auroraGradients[w];

    // Draw wavy aurora shape
    ctx.beginPath();
    ctx.moveTo(0, H * 0.3);

    for (let x = 0; x <= W; x += 10) {
      const wave1 = Math.sin(x * 0.01 + gameState.t * waveSpeed + offset) * 30;
      const wave2 = Math.sin(x * 0.02 - gameState.t * waveSpeed * 0.7 + offset) * 20;
      const y = H * 0.15 + wave1 + wave2;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(W, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawShootingStars() {
  // Spawn new shooting stars randomly
  if (Math.random() < SHOOTING_STAR_CHANCE) {
    shootingStars.push({
      x: Math.random() * W + W * 0.5,
      y: Math.random() * H * 0.3,
      speed: SHOOTING_STAR_SPEED,
      length: SHOOTING_STAR_LENGTH,
      life: 1
    });
  }

  // Update and draw shooting stars
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];

    star.x -= star.speed;
    star.y += star.speed * 0.3;
    star.life -= 0.02;

    if (star.life <= 0 || star.x < -star.length) {
      shootingStars.splice(i, 1);
      continue;
    }

    // Draw shooting star trail
    const gradient = ctx.createLinearGradient(star.x, star.y, star.x + star.length, star.y + star.length * 0.3);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life * 0.9})`);
    gradient.addColorStop(0.5, `rgba(200, 220, 255, ${star.life * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(star.x + star.length, star.y + star.length * 0.3);
    ctx.stroke();
  }
}

function drawMoon() {
  const moonX = W * 0.85;
  const moonY = H * 0.15;

  ctx.save();

  // Secret moon animation when clicked
  if (gameState.moonClicked && gameState.moonAnimationProgress < 1) {
    gameState.moonAnimationProgress += 0.02;
  }

  const animScale = gameState.moonAnimationProgress > 0
    ? 1 + Math.sin(gameState.moonAnimationProgress * Math.PI) * 0.3
    : 1;
  const animGlow = gameState.moonAnimationProgress > 0
    ? Math.sin(gameState.moonAnimationProgress * Math.PI * 2) * 0.5
    : 0;

  ctx.translate(moonX, moonY);
  ctx.scale(animScale, animScale);
  ctx.translate(-moonX, -moonY);

  // Enhanced pink glow during animation
  if (animGlow > 0) {
    const secretGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, MOON_GLOW_SIZE * 1.5);
    secretGlow.addColorStop(0, `rgba(255, 105, 180, ${animGlow * 0.6})`);
    secretGlow.addColorStop(0.5, `rgba(255, 182, 193, ${animGlow * 0.3})`);
    secretGlow.addColorStop(1, 'rgba(255, 182, 193, 0)');
    ctx.fillStyle = secretGlow;
    ctx.fillRect(moonX - MOON_GLOW_SIZE * 1.5, moonY - MOON_GLOW_SIZE * 1.5,
                  MOON_GLOW_SIZE * 3, MOON_GLOW_SIZE * 3);
  }

  // OPTIMIZATION: Cache moon glow gradient
  if (!gradientCache.moonGlow) {
    gradientCache.moonGlow = ctx.createRadialGradient(moonX, moonY, MOON_SIZE * 0.5, moonX, moonY, MOON_GLOW_SIZE);
    gradientCache.moonGlow.addColorStop(0, 'rgba(255, 255, 240, 0.3)');
    gradientCache.moonGlow.addColorStop(0.3, 'rgba(255, 255, 240, 0.15)');
    gradientCache.moonGlow.addColorStop(0.6, 'rgba(200, 220, 255, 0.08)');
    gradientCache.moonGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
  }

  ctx.fillStyle = gradientCache.moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, MOON_GLOW_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Moon body - turns pink when clicked
  ctx.fillStyle = gameState.moonClicked ? '#FFB6C1' : '#f5f5dc';
  ctx.shadowColor = gameState.moonClicked ? '#FF69B4' : '#fffacd';
  ctx.shadowBlur = 20 + animGlow * 40;
  ctx.beginPath();
  ctx.arc(moonX, moonY, MOON_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Pink hearts burst from moon during animation
  if (animGlow > 0.3) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + gameState.t * 0.05;
      const dist = animGlow * 100;
      const starX = moonX + Math.cos(angle) * dist;
      const starY = moonY + Math.sin(angle) * dist;

      ctx.fillStyle = `rgba(255, 105, 180, ${animGlow})`;
      ctx.beginPath();
      ctx.arc(starX, starY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Moon craters (subtle)
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(220, 220, 200, 0.3)';
  ctx.beginPath();
  ctx.arc(moonX - 15, moonY - 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 10, moonY + 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 5, moonY - 15, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnow(){
  // OPTIMIZED: snowflakes - set styles once outside loop
  ctx.globalAlpha = SNOW_ALPHA;
  ctx.fillStyle = '#eaf6ff';

  const tMod = gameState.t % 2000; // Calculate modulo once
  for (let i=0;i<SNOWFLAKE_COUNT;i++){
    const fx = (i * 113 + (tMod*0.3)) % W;
    const fy = (i * 59 + (gameState.t*0.7)) % H;
    ctx.fillRect(fx, fy, 2, 2);
  }
  ctx.globalAlpha = 1;
}
function drawGround(cachedScrollX_025, cachedScrollX_030){
  ctx.fillStyle = '#0b1822'; ctx.fillRect(0, H*GROUND_HEIGHT_RATIO, W, H*(1-GROUND_HEIGHT_RATIO));

  // Draw snowdrifts
  drawSnowdrifts(cachedScrollX_025);

  ctx.shadowColor = '#86a7ff'; ctx.shadowBlur = 18; ctx.fillStyle = '#a7c4ff';
  const pathY = H*GROUND_HEIGHT_RATIO;
  ctx.beginPath();
  ctx.moveTo(0, pathY-10);
  ctx.bezierCurveTo(W*0.25, pathY-6, W*0.5, pathY-10, W, pathY-8);
  ctx.lineTo(W, pathY+10);
  ctx.bezierCurveTo(W*0.5, pathY+14, W*0.25, pathY+8, 0, pathY+12);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

  // Draw frosted ground sparkles
  drawGroundSparkles(cachedScrollX_030);
}

function drawSnowdrifts(cachedScrollX_025) {
  const baseY = H * GROUND_HEIGHT_RATIO;

  for (let drift of snowdrifts) {
    // OPTIMIZATION: Use pre-calculated scroll value
    const screenX = Math.floor(drift.x - cachedScrollX_025);

    // Skip if off-screen
    if (screenX + drift.width < 0 || screenX > W) continue;

    ctx.fillStyle = '#d4e8ff';
    ctx.beginPath();
    ctx.ellipse(screenX, baseY + 5, drift.width / 2, drift.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, baseY + 2, drift.width / 3, drift.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGroundSparkles(cachedScrollX_030) {
  const baseY = H * GROUND_HEIGHT_RATIO;

  for (let sparkle of groundSparkles) {
    // OPTIMIZATION: Use pre-calculated scroll value
    const screenX = Math.floor(sparkle.x - cachedScrollX_030);

    // Skip if off-screen
    if (screenX < -10 || screenX > W + 10) continue;

    const twinkle = 0.3 + 0.7 * Math.sin(gameState.t * GROUND_SPARKLE_TWINKLE_SPEED + sparkle.phase);

    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
    ctx.shadowColor = '#b8d4ff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(screenX, baseY - 5, sparkle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function drawTree(screenX, baseY, height, sway, twinklePhase=false){
  const trunkH = height*0.25;
  ctx.fillStyle = '#20363e'; ctx.fillRect(screenX-3, baseY-trunkH, 6, trunkH);
  ctx.fillStyle = '#1b3a2f';
  ctx.beginPath(); ctx.moveTo(screenX + sway, baseY - height);
  ctx.lineTo(screenX - 42, baseY - trunkH);
  ctx.lineTo(screenX + 42, baseY - trunkH);
  ctx.closePath(); ctx.fill();

  // Snow on tree top
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.ellipse(screenX + sway, baseY - height + 5, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snow on branches
  ctx.fillStyle = '#d4e8ff';
  ctx.beginPath();
  ctx.ellipse(screenX - 35, baseY - trunkH, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(screenX + 35, baseY - trunkH, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (twinklePhase){
    const dots = 5;
    for (let d=0; d<dots; d++){
      const lx = screenX + Math.sin(d*1.2 + twinklePhase)*18;
      const ly = baseY - trunkH - d*8 - 6;
      const tw = 0.6+0.4*Math.sin(gameState.t*0.12 + d + twinklePhase*2);
      const col = d%2 ? '#ffd97b' : '#ff7d8a';
      ctx.globalAlpha = tw; ctx.fillStyle = col; ctx.fillRect(lx, ly, 3, 3);
    } ctx.globalAlpha = 1;
  }
}
function drawHouse(screenX, glowIntensity=0, isNanny=false, houseIndex=0){
  const baseY = H*GROUND_HEIGHT_RATIO;
  const w = HOUSE_WIDTH, h = HOUSE_HEIGHT;
  ctx.save(); ctx.translate(screenX, baseY);

  // Special heavenly effects for Nanny & Grandma's house
  if (isNanny) {
    const angelGlow = 0.5 + 0.25 * gameState.cachedSinT_003;

    // Multi-layered ethereal glow with ultra-smooth gradients
    // Outer glow - very soft and wide with extended fade and micro-step transitions
    // NOTE: Can't cache these gradients since they use dynamic angelGlow opacity values
    const outerGlow = ctx.createRadialGradient(0, -h/2, 0, 0, -h/2, 350);
    outerGlow.addColorStop(0, `rgba(255, 255, 255, ${angelGlow * 0.25})`);
    outerGlow.addColorStop(0.15, `rgba(245, 248, 255, ${angelGlow * 0.23})`);
    outerGlow.addColorStop(0.28, `rgba(238, 243, 252, ${angelGlow * 0.20})`);
    outerGlow.addColorStop(0.40, `rgba(230, 238, 250, ${angelGlow * 0.17})`);
    outerGlow.addColorStop(0.52, `rgba(222, 233, 246, ${angelGlow * 0.14})`);
    outerGlow.addColorStop(0.62, `rgba(214, 228, 242, ${angelGlow * 0.11})`);
    outerGlow.addColorStop(0.71, `rgba(206, 223, 238, ${angelGlow * 0.08})`);
    outerGlow.addColorStop(0.79, `rgba(198, 218, 235, ${angelGlow * 0.06})`);
    outerGlow.addColorStop(0.85, `rgba(192, 214, 232, ${angelGlow * 0.04})`);
    outerGlow.addColorStop(0.90, `rgba(186, 210, 228, ${angelGlow * 0.025})`);
    outerGlow.addColorStop(0.94, `rgba(180, 206, 225, ${angelGlow * 0.015})`);
    outerGlow.addColorStop(0.97, `rgba(175, 202, 222, ${angelGlow * 0.008})`);
    outerGlow.addColorStop(0.99, `rgba(170, 198, 220, ${angelGlow * 0.003})`);
    outerGlow.addColorStop(0.995, `rgba(165, 195, 218, ${angelGlow * 0.001})`);
    outerGlow.addColorStop(1, 'rgba(160, 190, 215, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(-w*3, -h-250, w*6, h*4 + 250);

    // Middle glow - brighter and more visible
    const midGlow = ctx.createRadialGradient(0, -h/2, 0, 0, -h/2, 170);
    midGlow.addColorStop(0, `rgba(255, 255, 255, ${angelGlow * 0.35})`);
    midGlow.addColorStop(0.25, `rgba(235, 243, 255, ${angelGlow * 0.28})`);
    midGlow.addColorStop(0.45, `rgba(225, 237, 252, ${angelGlow * 0.21})`);
    midGlow.addColorStop(0.65, `rgba(215, 230, 248, ${angelGlow * 0.14})`);
    midGlow.addColorStop(0.8, `rgba(205, 223, 242, ${angelGlow * 0.08})`);
    midGlow.addColorStop(0.92, `rgba(195, 215, 235, ${angelGlow * 0.03})`);
    midGlow.addColorStop(0.98, `rgba(185, 208, 228, ${angelGlow * 0.008})`);
    midGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = midGlow;
    ctx.fillRect(-w*1.6, -h-130, w*3.2, h*2.6 + 130);

    // Inner glow - brightest, close to house
    const innerGlow = ctx.createRadialGradient(0, -h/2, 0, 0, -h/2, 100);
    innerGlow.addColorStop(0, `rgba(255, 255, 255, ${angelGlow * 0.45})`);
    innerGlow.addColorStop(0.35, `rgba(248, 252, 255, ${angelGlow * 0.35})`);
    innerGlow.addColorStop(0.6, `rgba(238, 245, 253, ${angelGlow * 0.25})`);
    innerGlow.addColorStop(0.78, `rgba(228, 238, 250, ${angelGlow * 0.16})`);
    innerGlow.addColorStop(0.9, `rgba(218, 232, 246, ${angelGlow * 0.08})`);
    innerGlow.addColorStop(0.97, `rgba(208, 225, 240, ${angelGlow * 0.02})`);
    innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(-w*1.3, -h-85, w*2.6, h*2.3 + 85);

    // Soft floating light particles - more visible
    ctx.save();
    for (let p = 0; p < 14; p++) {
      const angle = (gameState.t * 0.015 + p * Math.PI / 7);
      const radius = 65 + Math.sin(gameState.t * 0.02 + p) * 18;
      const particleX = Math.cos(angle) * radius;
      const particleY = -65 + Math.sin(angle) * radius;
      const particleAlpha = 0.35 + 0.25 * Math.sin(gameState.t * 0.06 + p);
      const particleSize = 2.5 + Math.sin(gameState.t * 0.08 + p) * 1.2;

      // Soft glow for each particle - brighter
      const particleGrad = ctx.createRadialGradient(particleX, particleY, 0, particleX, particleY, particleSize * 4);
      particleGrad.addColorStop(0, `rgba(255, 255, 255, ${particleAlpha})`);
      particleGrad.addColorStop(0.4, `rgba(245, 250, 255, ${particleAlpha * 0.65})`);
      particleGrad.addColorStop(0.7, `rgba(230, 240, 255, ${particleAlpha * 0.35})`);
      particleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = particleGrad;
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // More prominent ambient glow on the house itself
    ctx.shadowColor = `rgba(255, 255, 255, ${angelGlow * 0.6})`;
    ctx.shadowBlur = 35;
  }
  
  ctx.fillStyle = '#c77f39'; ctx.fillRect(-w/2, -h, w, h);
  ctx.fillStyle = '#9b5a2a'; ctx.beginPath();
  ctx.moveTo(-w/2-10, -h); ctx.lineTo(0, -h-46); ctx.lineTo(w/2+10, -h); ctx.closePath(); ctx.fill();

  // Roof snow details
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.moveTo(-w/2-10, -h+3); ctx.lineTo(0, -h-34); ctx.lineTo(w/2+10, -h+3);
  ctx.quadraticCurveTo(w/2, -h+8, 0, -h-28); ctx.quadraticCurveTo(-w/2, -h+8, -w/2-10, -h+3);
  ctx.closePath(); ctx.fill();

  // Original snow on roof (lighter layer)
  ctx.fillStyle = '#f5fbff'; ctx.beginPath();
  ctx.moveTo(-w/2-10, -h+3); ctx.lineTo(0, -h-34); ctx.lineTo(w/2+10, -h+3);
  ctx.quadraticCurveTo(w/2, -h+12, 0, -h+18); ctx.quadraticCurveTo(-w/2, -h+12, -w/2-10, -h+3); ctx.closePath(); ctx.fill();

  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

  // Twinkling lights along roofline
  for (let i = 0; i < HOUSE_LIGHTS_COUNT; i++) {
    const lightX = -w/2 + 10 + (i * (w - 20) / (HOUSE_LIGHTS_COUNT - 1));
    const lightY = -h + 5;
    const twinkle = 0.5 + 0.5 * Math.sin(gameState.t * 0.15 + i * 0.8);
    const colorIndex = i % LIGHT_COLORS.length;

    ctx.fillStyle = LIGHT_COLORS[colorIndex];
    ctx.globalAlpha = twinkle;
    ctx.shadowColor = LIGHT_COLORS[colorIndex];
    ctx.shadowBlur = 8 * twinkle;
    ctx.beginPath();
    ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Window flickering glow animation
  const windowFlicker1 = 0.8 + 0.2 * Math.sin(gameState.t * WINDOW_FLICKER_SPEED);
  const windowFlicker2 = 0.75 + 0.25 * Math.sin(gameState.t * WINDOW_FLICKER_SPEED * 1.3 + 1);

  // Left window with animated glow
  ctx.fillStyle = '#ffd97b';
  ctx.shadowColor = `rgba(255, 217, 123, ${windowFlicker1})`;
  ctx.shadowBlur = 18 * windowFlicker1;
  ctx.fillRect(-w/4-14, -h+20, 28, 24);

  // Window silhouette (person moving inside)
  if (Math.sin(gameState.t * 0.05 + houseIndex) > 0.3) {
    ctx.fillStyle = 'rgba(100, 60, 30, 0.4)';
    const silhouetteX = -w/4-14 + 8 + Math.sin(gameState.t * 0.02) * 6;
    ctx.beginPath();
    ctx.arc(silhouetteX, -h+28, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(silhouetteX-3, -h+32, 6, 10);
  }

  // Right window with animated glow
  ctx.shadowColor = `rgba(255, 217, 123, ${windowFlicker2})`;
  ctx.shadowBlur = 18 * windowFlicker2;
  ctx.fillRect(w/4-14, -h+20, 28, 24);

  // Fireplace glow in right window
  const fireGlow = 0.6 + 0.4 * Math.sin(gameState.t * 0.3 + houseIndex * 2);
  ctx.fillStyle = `rgba(255, 100, 30, ${fireGlow * 0.3})`;
  ctx.fillRect(w/4-10, -h+36, 8, 6);

  ctx.shadowBlur = 0;

  // Simple static door
  ctx.fillStyle = '#823f19';
  ctx.fillRect(-14, -h+34, 28, 36);

  // Wreath on door
  ctx.strokeStyle = '#1b5e20';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -h+45, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Wreath bow
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.arc(-3, -h+38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -h+38, 3, 0, Math.PI * 2);
  ctx.fill();

  if (glowIntensity > 0){
    const gx = 0, gy = -h+44; const r = 42 * glowIntensity;
    const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
    grad.addColorStop(0, 'rgba(255, 217, 123, 0.55)'); grad.addColorStop(1, 'rgba(255, 217, 123, 0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI*2); ctx.fill();
  }

  ctx.restore();
}

// OPTIMIZATION: Shared flower drawing function (eliminates 50 lines of duplication)
function drawFlowerBouquet(ctx, bouquetX, bouquetY) {
  ctx.save();

  // Stems
  ctx.strokeStyle = '#2d5016';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bouquetX, bouquetY);
  ctx.lineTo(bouquetX, bouquetY + 15);
  ctx.stroke();

  // Flowers
  for (let i = 0; i < 3; i++) {
    const offsetX = (i - 1) * 4;
    const offsetY = -i * 2;
    ctx.fillStyle = FLOWER_COLORS[i];
    ctx.beginPath();
    ctx.arc(bouquetX + offsetX, bouquetY + offsetY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Flower center
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(bouquetX + offsetX, bouquetY + offsetY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Chimney smoke particles
function updateAndDrawChimneySmoke(houseIndex, houseScreenX) {
  const baseY = H * GROUND_HEIGHT_RATIO;
  const chimneyX = houseScreenX + 40; // Right side of house
  const chimneyY = baseY - HOUSE_HEIGHT - 46; // Top of roof

  // Initialize smoke particles for this house if not already
  if (!smokeParticles.has(houseIndex)) {
    smokeParticles.set(houseIndex, []);
  }

  const particles = smokeParticles.get(houseIndex);

  // Spawn new smoke particle occasionally
  if (particles.length < SMOKE_PARTICLE_COUNT && Math.random() < 0.15) {
    particles.push({
      x: chimneyX,
      y: chimneyY,
      age: 0,
      xOffset: 0,
      size: 4 + Math.random() * 3
    });
  }

  // Update and draw smoke particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.y -= SMOKE_RISE_SPEED;
    p.age++;
    p.xOffset += Math.sin(p.age * 0.1) * SMOKE_SWAY_AMOUNT;

    const life = 1 - (p.age / 120);
    if (life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    // Draw smoke particle
    const alpha = life * 0.3;
    const puffSize = p.size + (1 - life) * 8;

    ctx.fillStyle = `rgba(220, 220, 230, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x + p.xOffset, p.y, puffSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Sparkle trail for avatar and Santa
function addSparkle(x, y) {
  sparkles.push({
    x: x + (Math.random() - 0.5) * 15,
    y: y + (Math.random() - 0.5) * 15,
    life: SPARKLE_LIFETIME,
    size: Math.random() * SPARKLE_SIZE + 1,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: Math.random() * -0.5 - 0.3
  });

  // Limit total sparkles
  if (sparkles.length > SPARKLE_COUNT) {
    sparkles.shift();
  }
}

function updateAndDrawSparkles() {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];

    s.life--;
    s.x += s.speedX;
    s.y += s.speedY;

    if (s.life <= 0) {
      sparkles.splice(i, 1);
      continue;
    }

    const alpha = s.life / SPARKLE_LIFETIME;
    const twinkle = 0.5 + 0.5 * Math.sin(gameState.t * 0.3 + i);

    // Draw sparkle
    ctx.save();
    ctx.globalAlpha = alpha * twinkle;
    ctx.fillStyle = '#ffe8a0';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;

    // Star shape
    ctx.beginPath();
    for (let p = 0; p < 5; p++) {
      const angle = (p * 4 * Math.PI) / 5 - Math.PI / 2;
      const radius = p % 2 === 0 ? s.size : s.size / 2;
      const px = s.x + Math.cos(angle) * radius;
      const py = s.y + Math.sin(angle) * radius;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Footprints in snow
function addFootprint(x) {
  const lastFootprint = footprints[footprints.length - 1];

  // Only add if far enough from last footprint
  if (!lastFootprint || Math.abs(x - lastFootprint.x) > FOOTPRINT_SPACING) {
    footprints.push({
      x: x,
      y: H * GROUND_HEIGHT_RATIO - 5,
      age: 0,
      isLeft: !lastFootprint || !lastFootprint.isLeft
    });

    // Play footstep sound at intervals
    gameState.footstepCounter++;
    if (gameState.footstepCounter >= FOOTSTEP_INTERVAL) {
      playFootstepSound();
      gameState.footstepCounter = 0;
    }
  }
}

function updateAndDrawFootprints() {
  for (let i = footprints.length - 1; i >= 0; i--) {
    const fp = footprints[i];
    fp.age++;

    if (fp.age > FOOTPRINT_FADE_DURATION) {
      footprints.splice(i, 1);
      continue;
    }

    const alpha = 1 - (fp.age / FOOTPRINT_FADE_DURATION);
    const screenX = Math.floor(fp.x - gameState.cachedScrollX_035);

    // Skip if off screen
    if (screenX < -50 || screenX > W + 50) continue;

    ctx.save();
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = '#c5d9e8';

    // Draw simple footprint (oval)
    const offsetX = fp.isLeft ? -3 : 3;
    ctx.beginPath();
    ctx.ellipse(screenX + offsetX, fp.y, 4, 8, fp.isLeft ? -0.2 : 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Deer/Woodland Creatures
function updateAndDrawDeer() {
  // Spawn new deer occasionally
  if (Math.random() < DEER_SPAWN_CHANCE && deer.length < 3) {
    deer.push({
      x: Math.random() < 0.5 ? -100 : W + 100,
      y: H * GROUND_HEIGHT_RATIO - 40 - Math.random() * 20,
      speed: DEER_SPEED * (Math.random() < 0.5 ? 1 : -1),
      depth: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Update and draw deer
  for (let i = deer.length - 1; i >= 0; i--) {
    const d = deer[i];

    d.x += d.speed;

    // Remove if off-screen
    if (d.x < -150 || d.x > W + 150) {
      deer.splice(i, 1);
      continue;
    }

    const size = 15 * d.depth;
    const hopMotion = Math.sin(gameState.t * 0.1 + d.phase) * 3;

    ctx.save();
    ctx.globalAlpha = 0.6 + d.depth * 0.4;

    // Deer body
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y + hopMotion, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deer head
    ctx.beginPath();
    ctx.arc(d.x + size * (d.speed > 0 ? 0.8 : -0.8), d.y - size * 0.3 + hopMotion, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Simple antlers
    ctx.strokeStyle = '#6b5d4f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const antlerX = d.x + size * (d.speed > 0 ? 0.8 : -0.8);
    ctx.moveTo(antlerX, d.y - size * 0.8 + hopMotion);
    ctx.lineTo(antlerX - 3, d.y - size * 1.2 + hopMotion);
    ctx.moveTo(antlerX, d.y - size * 0.8 + hopMotion);
    ctx.lineTo(antlerX + 3, d.y - size * 1.2 + hopMotion);
    ctx.stroke();

    ctx.restore();
  }
}

// Magic particle bursts for special moments
function createMagicBurst(x, y) {
  for (let i = 0; i < MAGIC_PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / MAGIC_PARTICLE_COUNT;
    const speed = 1 + Math.random() * 2;

    magicParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: MAGIC_PARTICLE_LIFETIME,
      size: 2 + Math.random() * 3,
      color: LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)]
    });
  }
}

function updateAndDrawMagicParticles() {
  for (let i = magicParticles.length - 1; i >= 0; i--) {
    const p = magicParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // Gravity
    p.life--;

    if (p.life <= 0) {
      magicParticles.splice(i, 1);
      continue;
    }

    const alpha = p.life / MAGIC_PARTICLE_LIFETIME;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawAvatar(x){
  const yBase = H*GROUND_HEIGHT_RATIO - 8;
  const scale = 60 / 60; // Height 60, same as Sister

  // Walking animation - leg sway
  const walkPhase = Math.sin(gameState.t * WALKING_ANIMATION_SPEED) * 3; // Leg swing amount

  // Bare legs for female (in dress)
  ctx.strokeStyle = '#d4a574';
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // Left leg swings
  ctx.moveTo(x-4*scale, yBase);
  ctx.lineTo(x-4*scale + walkPhase, yBase+15*scale);
  // Right leg swings opposite
  ctx.moveTo(x+4*scale, yBase);
  ctx.lineTo(x+4*scale - walkPhase, yBase+15*scale);
  ctx.stroke();

  // Shoes (follow leg positions)
  ctx.fillStyle = '#4a3728';
  ctx.beginPath();
  ctx.ellipse(x-4*scale + walkPhase, yBase+17*scale, 3*scale, 2*scale, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x+4*scale - walkPhase, yBase+17*scale, 3*scale, 2*scale, 0, 0, Math.PI*2);
  ctx.fill();

  // Dress
  ctx.fillStyle = '#e91e63'; // Pink dress
  ctx.beginPath();
  ctx.moveTo(x-7*scale, yBase-22*scale);
  ctx.lineTo(x-9*scale, yBase);
  ctx.lineTo(x+9*scale, yBase);
  ctx.lineTo(x+7*scale, yBase-22*scale);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.strokeStyle = '#ffe7d1';
  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x-7*scale, yBase-20*scale);
  ctx.lineTo(x-12*scale, yBase-8*scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+7*scale, yBase-20*scale);
  ctx.lineTo(x+12*scale, yBase-8*scale);
  ctx.stroke();

  // Hands
  ctx.fillStyle = '#ffe7d1';
  ctx.beginPath();
  ctx.arc(x-12*scale, yBase-8*scale, 2.5*scale, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x+12*scale, yBase-8*scale, 2.5*scale, 0, Math.PI*2);
  ctx.fill();

  // Draw flowers if carrying them
  if (gameState.carryingFlowers && !gameState.flowersLaidDown) {
    const bouquetX = x + 12*scale;
    const bouquetY = yBase - 8*scale;
    drawFlowerBouquet(ctx, bouquetX, bouquetY);
  }

  // Neck
  ctx.fillStyle = '#ffe7d1';
  ctx.fillRect(x-2.5*scale, yBase-24*scale, 5*scale, 3*scale);

  // Head
  ctx.fillStyle = '#ffe7d1';
  ctx.beginPath();
  ctx.arc(x, yBase-32*scale, 8*scale, 0, Math.PI*2);
  ctx.fill();

  // Hair - long blonde hair (BLONDE)
  ctx.fillStyle = '#f4d03f'; // Blonde hair color
  ctx.beginPath();
  // Hair top/crown
  ctx.arc(x, yBase-32*scale, 9*scale, Math.PI*0.9, Math.PI*2.1);
  ctx.fill();

  // Long side hair (extends past shoulders)
  ctx.beginPath();
  ctx.ellipse(x-7*scale, yBase-26*scale, 4.5*scale, 14*scale, -0.15, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x+7*scale, yBase-26*scale, 4.5*scale, 14*scale, 0.15, 0, Math.PI*2);
  ctx.fill();
}
function drawMarker(screenX){
  const y = H*0.72;
  ctx.fillStyle = '#e6ff7a'; ctx.beginPath(); ctx.arc(screenX, y, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#203044'; ctx.fillRect(screenX-1, y, 2, 18);
}

function drawFamilyMember(x, member) {
  const yBase = H*GROUND_HEIGHT_RATIO - 8;
  const scale = member.height / 60; // Scale relative to height

  // Legs (different for male/female)
  if (member.isMale) {
    // Pants for males
    ctx.fillStyle = '#2c3e50'; // Dark pants
    ctx.fillRect(x-7*scale, yBase-5*scale, 6*scale, 20*scale); // Left pant leg
    ctx.fillRect(x+1*scale, yBase-5*scale, 6*scale, 20*scale); // Right pant leg
  } else {
    // Bare legs for females (in dress)
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x-4*scale, yBase);
    ctx.lineTo(x-4*scale, yBase+15*scale);
    ctx.moveTo(x+4*scale, yBase);
    ctx.lineTo(x+4*scale, yBase+15*scale);
    ctx.stroke();
  }

  // Shoes
  ctx.fillStyle = '#4a3728';
  ctx.beginPath();
  ctx.ellipse(x-4*scale, yBase+17*scale, 3*scale, 2*scale, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x+4*scale, yBase+17*scale, 3*scale, 2*scale, 0, 0, Math.PI*2);
  ctx.fill();

  // Body/Shirt or Dress
  ctx.fillStyle = member.shirtColor;
  if (member.isMale) {
    // Rectangle shirt for males
    ctx.fillRect(x-8*scale, yBase-28*scale, 16*scale, 23*scale);
  } else {
    // Dress for females
    ctx.beginPath();
    ctx.moveTo(x-7*scale, yBase-22*scale);
    ctx.lineTo(x-9*scale, yBase);
    ctx.lineTo(x+9*scale, yBase);
    ctx.lineTo(x+7*scale, yBase-22*scale);
    ctx.closePath();
    ctx.fill();
  }

  // Arms
  ctx.strokeStyle = '#ffe7d1';
  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x-7*scale, yBase-20*scale);
  ctx.lineTo(x-12*scale, yBase-8*scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+7*scale, yBase-20*scale);
  ctx.lineTo(x+12*scale, yBase-8*scale);
  ctx.stroke();

  // Hands
  ctx.fillStyle = '#ffe7d1';
  ctx.beginPath();
  ctx.arc(x-12*scale, yBase-8*scale, 2.5*scale, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x+12*scale, yBase-8*scale, 2.5*scale, 0, Math.PI*2);
  ctx.fill();

  // Draw flowers if carrying them
  if (member.carryingFlowers) {
    const bouquetX = x + 12*scale;
    const bouquetY = yBase - 8*scale;
    drawFlowerBouquet(ctx, bouquetX, bouquetY);
  }

  // Neck
  ctx.fillStyle = '#ffe7d1';
  ctx.fillRect(x-2.5*scale, yBase-24*scale, 5*scale, 3*scale);

  // Head
  ctx.fillStyle = '#ffe7d1';
  ctx.beginPath();
  ctx.arc(x, yBase-32*scale, 8*scale, 0, Math.PI*2);
  ctx.fill();

  // Hair (different styles based on member)
  ctx.fillStyle = member.hairColor;

  if (member.name === 'Dad') {
    // Short hair for Dad - just top of head
    ctx.beginPath();
    ctx.arc(x, yBase-32*scale, 9*scale, Math.PI*1.1, Math.PI*1.9);
    ctx.fill();
  } else if (member.name === 'Mum') {
    // Medium length hair for Mum - reaches shoulders
    ctx.beginPath();
    ctx.arc(x, yBase-32*scale, 9*scale, Math.PI*0.9, Math.PI*2.1);
    ctx.fill();

    // Side hair (medium length)
    ctx.beginPath();
    ctx.ellipse(x-7*scale, yBase-28*scale, 4*scale, 10*scale, -0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x+7*scale, yBase-28*scale, 4*scale, 10*scale, 0.2, 0, Math.PI*2);
    ctx.fill();
  } else {
    // Long hair for girls - extends past shoulders
    ctx.beginPath();
    ctx.arc(x, yBase-32*scale, 9*scale, Math.PI*0.9, Math.PI*2.1);
    ctx.fill();

    // Long side hair
    ctx.beginPath();
    ctx.ellipse(x-7*scale, yBase-26*scale, 4.5*scale, 14*scale, -0.15, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x+7*scale, yBase-26*scale, 4.5*scale, 14*scale, 0.15, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawSanta(){
  // Background Santa (only when not in pickup mode)
  if (!gameState.pickupMode) {
    santa.timer -= 1;
    if (santa.timer <= 0 && !santa.active){ santa.active = true; santa.x = -300; santa.y = 60 + Math.random()*40; }
    if (santa.active){
      santa.x += santa.speed;
      if (santa.x > W + 200){ santa.active = false; santa.timer = 60 * (8 + Math.random()*4); }
      ctx.save(); ctx.translate(santa.x, santa.y);
      
      // Draw reindeer FIRST (in front of sleigh, pulling)
      for (let i=0;i<3;i++){
        const rx = 80 + i*30; // Position reindeer IN FRONT (positive x)
        const ry = 2 - Math.sin((gameState.t*0.2 + i))*2;
        
        // Reindeer body
        ctx.fillStyle = '#8b6914';
        ctx.beginPath();
        ctx.ellipse(rx, ry, 7, 4, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Reindeer head
        ctx.fillStyle = '#a0826d';
        ctx.beginPath();
        ctx.arc(rx+8, ry-1, 4, 0, Math.PI*2);
        ctx.fill();
        
        // Antlers
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx+8, ry-5);
        ctx.lineTo(rx+6, ry-8);
        ctx.moveTo(rx+8, ry-5);
        ctx.lineTo(rx+10, ry-8);
        ctx.stroke();
        
        // Harness to sleigh
        if (i === 0) {
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rx-7, ry);
          ctx.lineTo(25, 6);
          ctx.stroke();
        }
      }
      
      // Then draw Santa's sleigh BEHIND reindeer
      ctx.fillStyle = '#d11b2c'; ctx.strokeStyle = '#ffd97b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, 10); ctx.lineTo(0, 0); ctx.lineTo(20, 6); ctx.lineTo(12, 14); ctx.lineTo(-20, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -6, 6, 3);
      ctx.fillStyle = '#ff6574'; ctx.beginPath(); ctx.arc(4, -10, 6, 0, Math.PI*2); ctx.fill();

      ctx.restore();

      // Add sparkle trail to background Santa
      if (Math.random() < 0.4) {
        addSparkle(santa.x, santa.y + 10);
      }
    }
  }
  
  // Pickup Santa with sleigh and girl
  if (gameState.pickupMode) {
    ctx.save();
    ctx.translate(gameState.santaX, gameState.santaY);

    // Draw reindeer (3 reindeer pulling the sleigh in a line)
    // Rudolph (red nose) should always be at the FRONT leading the way
    for (let i=0;i<3;i++){
      // Position changes based on direction
      // When flying right (into screen): positions at -90, -125, -160 (Rudolph at -160)
      // When flying left (away): positions at 90, 125, 160 (Rudolph at 160)
      const rx = gameState.santaFacingLeft ? (90 + i*35) : (-90 - i*35);
      const ry = 5 - Math.sin((gameState.t*0.2 + i))*3; // Galloping motion

      // Reindeer body
      ctx.fillStyle = '#8b6914';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 10, 7, 0, 0, Math.PI*2);
      ctx.fill();

      // Reindeer head - always points in direction of travel
      const headOffset = gameState.santaFacingLeft ? 12 : -12;
      ctx.fillStyle = '#a0826d';
      ctx.beginPath();
      ctx.arc(rx+headOffset, ry-2, 6, 0, Math.PI*2);
      ctx.fill();

      // Antlers - adjust based on direction
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (gameState.santaFacingLeft) {
        ctx.moveTo(rx+12, ry-8);
        ctx.lineTo(rx+10, ry-12);
        ctx.moveTo(rx+12, ry-8);
        ctx.lineTo(rx+14, ry-11);
      } else {
        ctx.moveTo(rx-12, ry-8);
        ctx.lineTo(rx-10, ry-12);
        ctx.moveTo(rx-12, ry-8);
        ctx.lineTo(rx-14, ry-11);
      }
      ctx.stroke();

      // Legs
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Front legs
      ctx.moveTo(rx+5, ry+7);
      ctx.lineTo(rx+5, ry+15);
      ctx.moveTo(rx+8, ry+7);
      ctx.lineTo(rx+8, ry+15);
      // Back legs
      ctx.moveTo(rx-5, ry+7);
      ctx.lineTo(rx-5, ry+15);
      ctx.moveTo(rx-2, ry+7);
      ctx.lineTo(rx-2, ry+15);
      ctx.stroke();

      // Red nose on LEAD reindeer (Rudolph - always at front, which is i=2)
      if (i === 2) {
        const noseOffset = gameState.santaFacingLeft ? 16 : -16;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(rx+noseOffset, ry-2, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Harness connecting to sleigh
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const harnessOffset = gameState.santaFacingLeft ? -10 : 10; // Back of reindeer
      ctx.moveTo(rx+harnessOffset, ry);
      if (i === 0) {
        // Closest reindeer (i=0) connects to sleigh
        ctx.lineTo(gameState.santaFacingLeft ? 50 : -50, 0);
      } else {
        // Other reindeer connect to the one behind them
        const prevRx = gameState.santaFacingLeft ? (90 + (i-1)*35) : (-90 - (i-1)*35);
        const prevRy = 5 - Math.sin((gameState.t*0.2 + (i-1)))*3;
        ctx.lineTo(prevRx+harnessOffset, prevRy);
      }
      ctx.stroke();
    }
    
    // Main harness line to sleigh
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(-45, 0);
    ctx.stroke();
    
    // Draw sleigh
    ctx.fillStyle = '#8b0000'; // Dark red sleigh
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    
    // Sleigh runners (curved bottom)
    ctx.beginPath();
    ctx.moveTo(-45, 10);
    ctx.quadraticCurveTo(-50, 15, -45, 20);
    ctx.quadraticCurveTo(-20, 18, -10, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(35, 10);
    ctx.quadraticCurveTo(30, 15, 35, 20);
    ctx.quadraticCurveTo(50, 18, 55, 20);
    ctx.stroke();
    
    // Sleigh body
    ctx.fillStyle = '#b22222';
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.lineTo(-40, -15);
    ctx.quadraticCurveTo(-40, -20, -35, -20);
    ctx.lineTo(30, -20);
    ctx.quadraticCurveTo(35, -20, 35, -15);
    ctx.lineTo(35, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Sleigh decorative trim
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-38, -18);
    ctx.lineTo(33, -18);
    ctx.stroke();
    
    // Draw Santa in the sleigh
    ctx.fillStyle = '#d11b2c';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Santa's body (sitting)
    ctx.arc(-10, -8, 12, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Santa's head
    ctx.fillStyle = '#ffe7d1';
    ctx.beginPath();
    ctx.arc(-10, -18, 7, 0, Math.PI*2);
    ctx.fill();
    
    // Santa's hat
    ctx.fillStyle = '#d11b2c';
    ctx.beginPath();
    ctx.moveTo(-17, -18);
    ctx.lineTo(-10, -28);
    ctx.lineTo(-3, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -28, 3, 0, Math.PI*2);
    ctx.fill();
    
    // Santa's beard
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -15, 5, 0.2, Math.PI - 0.2);
    ctx.fill();
    
    // Draw girl in sleigh (if she's boarded - phase 1 or later)
    if (gameState.pickupPhase >= 1) {
      // Girl's head
      ctx.fillStyle = '#ffe7d1';
      ctx.beginPath();
      ctx.arc(8, -15, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Girl's body (sitting)
      ctx.fillStyle = '#e91e63';
      ctx.beginPath();
      ctx.arc(8, -6, 9, 0, Math.PI*2);
      ctx.fill();
      
      // Girl's hair (BLONDE)
      ctx.fillStyle = '#f4d03f';
      ctx.beginPath();
      ctx.arc(8, -15, 7, Math.PI*0.9, Math.PI*2.1);
      ctx.fill();
      
      // Hair bow
      ctx.fillStyle = '#ff69b4';
      ctx.beginPath();
      ctx.ellipse(5, -20, 3, 2, -0.3, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(11, -20, 3, 2, 0.3, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();

    // Add sparkle trail to pickup Santa's sleigh
    if (Math.random() < 0.5) {
      addSparkle(gameState.santaX, gameState.santaY + 15);
    }
  }
}


// Main loop
function frame(currentTime){
  requestAnimationFrame(frame);
  if (!gameState.running) return;

  // ERROR HANDLING: Wrap frame logic in try-catch to prevent silent crashes
  try {
    // Calculate delta time (time since last frame)
    if (gameState.lastFrameTime === 0) gameState.lastFrameTime = currentTime;
    const deltaTime = (currentTime - gameState.lastFrameTime) / 1000; // Convert to seconds
    gameState.lastFrameTime = currentTime;

    // Update time counter with delta time normalization (assume 60fps baseline)
    const deltaMultiplier = deltaTime * 60;
    gameState.t += deltaMultiplier;

    // Update performance caches
    updatePerformanceCaches();

    // OPTIMIZATION: Pre-calculate frame-constant values
    const groundY = H * GROUND_HEIGHT_RATIO;

  if (!gameState.pausedForPrompt && !gameState.reachedEnd && !gameState.entering && !gameState.familyEntering && !gameState.familyExiting) gameState.scrollX += gameState.speed * deltaMultiplier;
  if (gameState.entering){
    gameState.enterProgress += ENTER_ANIMATION_SPEED * deltaMultiplier;
    if (gameState.enterProgress >= 1){
      gameState.entering = false;
      gameState.avatarHidden = true;
      // Removed chime sound here
      const m = memories[gameState.currentMemoryIndex];
      gameState.currentImageIndex = 0; // Start with first image
      memoryTitle.textContent = m.title;
      memoryImg.src = m.images[gameState.currentImageIndex].src;
      imageCounter.textContent = `${gameState.currentImageIndex + 1} / ${m.images.length}`;
      updateImageNavButtons();
      memoryEl.classList.remove('hidden');

      // Create magic particle burst when entering house
      const houseX = houseScreenPositions[gameState.currentMemoryIndex];
      createMagicBurst(houseX, groundY - HOUSE_HEIGHT / 2);

      // ACCESSIBILITY: Move focus to close button when memory viewer opens
      setTimeout(() => closeMemoryBtn?.focus(), 50);
    }
  }

  // Family entrance animation
  if (gameState.familyEntering) {
    gameState.familyEnterProgress += FAMILY_ANIMATION_SPEED * deltaMultiplier;
    if (gameState.familyEnterProgress >= 1) {
      gameState.familyEnterProgress = 1;
      gameState.familyEntering = false;
      gameState.familyPresent = true;
      // Show flowers prompt now that family has arrived
      flowersPromptEl.classList.remove('hidden');
      // ACCESSIBILITY: Move focus to first button
      setTimeout(() => flowersYesBtn?.focus(), 50);
    }
  }

  // Family exit animation
  if (gameState.familyExiting) {
    gameState.familyExitProgress += FAMILY_ANIMATION_SPEED * deltaMultiplier;
    if (gameState.familyExitProgress >= 1) {
      gameState.familyExitProgress = 1;
      gameState.familyExiting = false;
      gameState.familyPresent = false;
      gameState.pausedForPrompt = false; // Resume movement after family exits
      // Reset family state
      familyMembers.forEach(member => member.carryingFlowers = true);
    }
  }

  drawSky(); drawSnow(); drawGround(gameState.cachedScrollX_025, gameState.cachedScrollX_030);

  // Draw footprints BEFORE trees and houses
  updateAndDrawFootprints();

  // Draw deer in background
  updateAndDrawDeer();

  // Tree line on same baseline as houses; draw BEFORE houses
  // OPTIMIZED: Cull off-screen trees (30-50% fewer draw calls)
  const baseTreeY = H*GROUND_HEIGHT_RATIO;
  const TREE_OFFSCREEN_MARGIN = 100;
  for (let tr of trees){
    const screenX = Math.floor((tr.x - (gameState.scrollX * (0.28 + tr.depth*0.06))) % (W*2));

    // Skip trees that are off-screen
    if (screenX < -TREE_OFFSCREEN_MARGIN || screenX > W + TREE_OFFSCREEN_MARGIN) continue;

    const h = 70 + tr.depth*28;
    const sway = Math.sin(gameState.t*0.02 + tr.phase) * (1.0 + tr.depth*0.25);
    drawTree(screenX, baseTreeY, h, sway, tr.depth >= 2 ? tr.phase : false);
  }

  // Cache house screen positions BEFORE drawing (calculated once per frame)
  const houseScreenPositions = memories.map(m => houseScreenX(m.x));
  const avatarBaseX = Math.floor(W * AVATAR_SCREEN_POSITION);

  // Houses at memory positions (glow when close/active)
  for (let i=0;i<memories.length;i++){
    const sx = houseScreenPositions[i];
    if (sx < -HOUSE_OFFSCREEN_MARGIN || sx > W + HOUSE_OFFSCREEN_MARGIN) { continue; }
    let glow = 0;
    const screenDist = Math.abs(sx - avatarBaseX);
    if (i === gameState.currentMemoryIndex && (gameState.pausedForPrompt || gameState.entering)) glow = 1.0;
    else if (screenDist < HOUSE_GLOW_PROXIMITY) glow = 0.35 + 0.25 * Math.sin(gameState.t*0.15);

    // Draw house first
    drawHouse(sx, glow, memories[i].isNanny, i);

    // Draw chimney smoke
    updateAndDrawChimneySmoke(i, sx);

    // Draw flowers AFTER house (so they appear in front) - spread along entire front
    if (memories[i].isNanny && gameState.flowersLaidDown) {
      const flowerY = groundY + 5; // Position on ground in front of house

      ctx.save();

      // Draw multiple flower bouquets spread across the front of the house
      const bouquetCount = 5; // Number of flower bouquets to place
      const houseHalfWidth = HOUSE_WIDTH / 2;

      for (let b = 0; b < bouquetCount; b++) {
        // Spread bouquets evenly across the front of the house
        const bouquetX = sx - houseHalfWidth + (b * (HOUSE_WIDTH / (bouquetCount - 1)));

        // Draw 3-4 flowers per bouquet
        const flowersPerBouquet = 3 + (b % 2);
        for (let j = 0; j < flowersPerBouquet; j++) {
          const offsetX = (j - flowersPerBouquet / 2) * 6;
          const offsetY = -j * 1.5 - (Math.sin(b + j) * 2);
          const colorIndex = (b * 2 + j) % FLOWER_COLORS.length;

          // Flower petals
          ctx.fillStyle = FLOWER_COLORS[colorIndex];
          ctx.beginPath();
          ctx.arc(bouquetX + offsetX, flowerY + offsetY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Flower center
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(bouquetX + offsetX, flowerY + offsetY, 2, 0, Math.PI * 2);
          ctx.fill();

          // Stem
          ctx.strokeStyle = '#2d5016';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bouquetX + offsetX, flowerY + offsetY);
          ctx.lineTo(bouquetX + offsetX, flowerY + 8);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // Avatar
  let avatarX = avatarBaseX;

  if (gameState.entering && gameState.currentMemoryIndex >= 0){
    const targetHouseX = houseScreenPositions[gameState.currentMemoryIndex];
    avatarX = avatarBaseX + (targetHouseX - avatarBaseX) * Math.min(1, gameState.enterProgress);
  }
  if (!gameState.avatarHidden) {
    drawAvatar(avatarX);

    // Add footprints while walking
    if (!gameState.pausedForPrompt && !gameState.entering) {
      addFootprint(gameState.cachedScrollX_035 + avatarX);
    }

    // Add sparkle trail occasionally
    if (Math.random() < 0.3) {
      addSparkle(avatarX, groundY - 30);
    }
  }

  // Draw sparkles
  updateAndDrawSparkles();

  // Draw magic particles
  updateAndDrawMagicParticles();

  // Draw family members (entrance/exit animations or static if present)
  if (gameState.familyEntering || gameState.familyPresent || gameState.familyExiting) {
    const nannyHouseIndex = memories.findIndex(m => m.isNanny);
    if (nannyHouseIndex >= 0) {
      const houseX = houseScreenPositions[nannyHouseIndex];

      familyMembers.forEach((member, index) => {
        let memberX;

        if (gameState.familyEntering) {
          // Family enters from the house (right side)
          const startX = houseX + 100;
          const endX = avatarBaseX + member.offsetX;
          memberX = startX + (endX - startX) * gameState.familyEnterProgress;
        } else if (gameState.familyExiting) {
          // Family exits back to the house
          const startX = avatarBaseX + member.offsetX;
          const endX = houseX + 100;
          memberX = startX + (endX - startX) * gameState.familyExitProgress;
        } else {
          // Family is present and standing still
          memberX = avatarBaseX + member.offsetX;
        }

        drawFamilyMember(memberX, member);
      });
    }
  }

  // Markers & prompt triggers
  for (let i=0;i<memories.length;i++){
    const sx = houseScreenPositions[i];
    if (sx < -HOUSE_OFFSCREEN_MARGIN || sx > W + HOUSE_OFFSCREEN_MARGIN) { /* off-screen, skip */ continue; }
    if (!gameState.seenMemories.has(i)) drawMarker(sx);
    if (!gameState.pausedForPrompt && !gameState.seenMemories.has(i) && !gameState.entering){
      const screenDist = Math.abs(sx - avatarBaseX);
      if (screenDist < HOUSE_PROXIMITY_THRESHOLD){
            if (gameState.doorPromptShown.has(i)) { continue; } gameState.doorPromptShown.add(i);
        gameState.pausedForPrompt = true;
        gameState.currentMemoryIndex = i;
        promptTitle.textContent = memories[i].title;

        // For the last house, only show "View Memory" option
        if (i === memories.length - 1) {
          promptText.textContent = "Go inside to view the memory.";
          continueBtn.style.display = 'none';
        } else {
          promptText.textContent = "Go inside to view the memory, or keep walking?";
          continueBtn.style.display = '';
        }

        promptEl.classList.remove('hidden');
        // ACCESSIBILITY: Move focus to first button when prompt opens
        setTimeout(() => viewBtn?.focus(), 50);
      }
    }
  }

  /* PRESENTS PROMPT GATE - only after all memories seen AND flowers laid down AND family has left */
  if (!gameState.presentsPromptShown && gameState.seenMemories.size === memories.length && gameState.flowersLaidDown && !gameState.familyPresent && !gameState.familyEntering && !gameState.familyExiting && !gameState.pausedForPrompt && !gameState.pickupMode && !gameState.entering) {
    gameState.pausedForPrompt = true;
    gameState.presentsPromptShown = true;
    presentsPromptEl.classList.remove('hidden');
    // ACCESSIBILITY: Move focus to first button
    setTimeout(() => presentsYesBtn?.focus(), 50);
  }

  // Handle Santa pickup animation
  if (gameState.pickupMode) {
    handleSantaPickup(deltaMultiplier);
  }

  drawSanta();

  } catch (error) {
    console.error('Animation frame error:', error);
    // Optionally stop animation on error to prevent cascading failures
    // gameState.running = false;
  }
}
requestAnimationFrame(frame);

// Image navigation helpers
function updateImageNavButtons() {
  if (gameState.currentMemoryIndex < 0) return;
  const m = memories[gameState.currentMemoryIndex];
  // Hide prev button on first image
  if (gameState.currentImageIndex === 0) {
    prevImageBtn.style.display = 'none';
  } else {
    prevImageBtn.style.display = 'block';
  }
  // Hide next button on last image
  if (gameState.currentImageIndex === m.images.length - 1) {
    nextImageBtn.style.display = 'none';
  } else {
    nextImageBtn.style.display = 'block';
  }
}

function showImage(index) {
  if (gameState.currentMemoryIndex < 0) return;
  const m = memories[gameState.currentMemoryIndex];
  if (index < 0 || index >= m.images.length) return;

  // Add 3D page flip animation
  memoryImg.classList.add('flipping');

  // Change image at the midpoint of the flip (when rotated 90deg)
  setTimeout(() => {
    gameState.currentImageIndex = index;
    memoryImg.src = m.images[gameState.currentImageIndex].src;
    imageCounter.textContent = `${gameState.currentImageIndex + 1} / ${m.images.length}`;
    updateImageNavButtons();
  }, 300); // Half of the 600ms flip animation

  // Remove animation class after it completes
  setTimeout(() => {
    memoryImg.classList.remove('flipping');
  }, 600);
}

// Santa pickup animation
function handleSantaPickup(deltaMultiplier) {
  gameState.pickupT += deltaMultiplier;

  const avatarBaseX = Math.floor(W * AVATAR_SCREEN_POSITION);

  // Phase 0: Santa flies in from right
  if (gameState.pickupPhase === 0) {
    gameState.santaX -= SANTA_PICKUP_SPEED_IN * deltaMultiplier; // Santa moves left toward the girl
    gameState.santaY = Math.floor(H * 0.72);

    // When Santa reaches the girl
    if (gameState.santaX <= avatarBaseX + SANTA_PICKUP_DISTANCE) {
      gameState.pickupPhase = 1;
      gameState.pickupT = 0;
    }
  }
  // Phase 1: Girl boards sleigh (brief pause)
  else if (gameState.pickupPhase === 1) {
    if (gameState.pickupT > SANTA_BOARDING_PAUSE) {
      gameState.pickupPhase = 2;
      gameState.pickupT = 0;
      gameState.avatarHidden = true; // Hide the girl avatar
      gameState.santaFacingLeft = true; // Turn Santa around to face left when flying away
    }
  }
  // Phase 2: Santa flies away to the right with the girl
  else if (gameState.pickupPhase === 2) {
    gameState.santaX += SANTA_PICKUP_SPEED_OUT * deltaMultiplier;
    gameState.santaY -= SANTA_PICKUP_RISE_RATE * deltaMultiplier; // Fly up slightly

    // When Santa exits screen, show North Pole message
    if (gameState.santaX > W + SANTA_EXIT_DISTANCE) {
      gameState.pickupPhase = 3;
      northPoleEl.classList.remove('hidden');
      gameState.pickupMode = false; // End pickup mode
    }
  }
}

// Buttons
if (viewBtn) viewBtn.addEventListener('click', () => {
  promptEl.classList.add('hidden');
  gameState.entering = true; gameState.enterProgress = 0;
});
if (continueBtn) continueBtn.addEventListener('click', () => {
  promptEl.classList.add('hidden'); gameState.pausedForPrompt = false;
});

// Image navigation buttons
if (prevImageBtn) prevImageBtn.addEventListener('click', () => {
  showImage(gameState.currentImageIndex - 1);
});
if (nextImageBtn) nextImageBtn.addEventListener('click', () => {
  showImage(gameState.currentImageIndex + 1);
});

if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => {
  memoryEl.classList.add('hidden');
  gameState.avatarHidden = false;
  gameState.seenMemories.add(gameState.currentMemoryIndex);

  // If this was Nanny's house, trigger family entrance
  if (gameState.currentMemoryIndex >= 0 && memories[gameState.currentMemoryIndex].isNanny && gameState.carryingFlowers) {
    // Start family entrance animation
    gameState.familyEntering = true;
    gameState.familyEnterProgress = 0;
    gameState.pausedForPrompt = true; // Keep girl paused during entrance
  } else {
    gameState.pausedForPrompt = false;
  }
});

if (presentsYesBtn) presentsYesBtn.addEventListener('click', () => {
  presentsPromptEl.classList.add('hidden');
  gameState.pausedForPrompt = false;
  gameState.santaX = W + 220; // Start Santa off-screen to the right
  gameState.santaY = Math.floor(H * 0.72);
  gameState.santaFacingLeft = false; // Santa starts facing right
  gameState.pickupMode = true;
  gameState.pickupPhase = 0;
  gameState.pickupT = 0;
});

if (presentsNoBtn) presentsNoBtn.addEventListener('click', () => {
  presentsPromptEl.classList.add('hidden');
  gameState.pausedForPrompt = false;
});

if (flowersYesBtn) flowersYesBtn.addEventListener('click', () => {
  flowersPromptEl.classList.add('hidden');
  gameState.carryingFlowers = false;
  gameState.flowersLaidDown = true;

  // Make family lay down flowers too
  familyMembers.forEach(member => member.carryingFlowers = false);

  // Start family exit animation
  gameState.familyExiting = true;
  gameState.familyExitProgress = 0;
  // Keep paused until family exits
  gameState.pausedForPrompt = true;
});

if (flowersNoBtn) flowersNoBtn.addEventListener('click', () => {
  flowersPromptEl.classList.add('hidden');

  // Start family exit animation without laying flowers
  gameState.familyExiting = true;
  gameState.familyExitProgress = 0;
  // Keep paused until family exits
  gameState.pausedForPrompt = true;
});

restartBtn.addEventListener('click', () => {
  northPoleEl.classList.add('hidden');
  gameState.scrollX = 0; gameState.pausedForPrompt = false; gameState.reachedEnd = false;
  gameState.seenMemories.clear(); gameState.doorPromptShown.clear(); gameState.currentMemoryIndex = -1;
  gameState.entering = false; gameState.enterProgress = 0; gameState.avatarHidden = false;
  gameState.pickupMode = false; gameState.pickupPhase = 0; gameState.pickupT = 0; gameState.santaFacingLeft = false;
  gameState.carryingFlowers = true; gameState.flowersLaidDown = false;
  gameState.presentsPromptShown = false; // Reset presents prompt flag

  // Reset family states
  gameState.familyPresent = false;
  gameState.familyEntering = false;
  gameState.familyExiting = false;
  gameState.familyEnterProgress = 0;
  gameState.familyExitProgress = 0;
  familyMembers.forEach(member => member.carryingFlowers = true);

  gameState.lastFrameTime = 0; // Reset delta time
  gameState.running = true;
});

// Additional audio unlock attempt on pointer interaction
window.addEventListener('pointerdown', async () => {
  if (!audioUnlocked) {
    await unlockAudio();
  }
}, { once: true, passive: true });
