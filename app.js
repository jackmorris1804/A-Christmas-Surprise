/**
 * Christmas 2D canvas app
 * - Houses at memory stops
 * - Prompt when avatar is close to door
 * - Enter-house animation with door glow
 * - Reliable start button + audio unlock fallback
 */

// ===== CONSTANTS =====
const AVATAR_SCREEN_POSITION = 0.35; // Avatar position on screen (35% from left)
const WALKING_SPEED = 1.35; // Base walking speed
const HOUSE_PROXIMITY_THRESHOLD = 18; // Distance to trigger house prompt
const HOUSE_WIDTH = 140; // House width in pixels
const HOUSE_HEIGHT = 82; // House height in pixels
const HOUSE_OFFSCREEN_MARGIN = 200; // Margin for culling off-screen houses
const HOUSE_GLOW_PROXIMITY = 40; // Distance for house glow effect
const GROUND_HEIGHT_RATIO = 0.78; // Ground starts at 78% of screen height
const ENTER_ANIMATION_SPEED = 0.03; // House enter animation speed
const STAR_COUNT = 120; // Number of stars in sky
const SNOWFLAKE_COUNT = 140; // Number of snowflakes
const TREE_COUNT = 42; // Number of trees
const SANTA_PICKUP_SPEED_IN = 3.5; // Santa flying in speed
const SANTA_PICKUP_SPEED_OUT = 4.5; // Santa flying away speed
const SANTA_PICKUP_RISE_RATE = 0.8; // Santa vertical rise rate when flying away
const SANTA_PICKUP_DISTANCE = 100; // Distance when Santa picks up the girl
const SANTA_EXIT_DISTANCE = 200; // Distance when Santa exits screen
const SANTA_BOARDING_PAUSE = 30; // Frames to pause while girl boards sleigh
const DPR_MAX = 2; // Max device pixel ratio (prevents excessive resolution on high DPI)

// Visual constants
const FLOWER_COLORS = ['#ff6b9d', '#ffb5d8', '#ff8fab', '#ffc0cb', '#ff69b4'];

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const DPR = Math.max(1, Math.min(DPR_MAX, window.devicePixelRatio || 1));
let W = 0, H = 0;
function resize() {
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize, { passive: true });
resize();

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

// Music - Simplified unified audio system
const MUSIC_URL = "assets/audio/bgm_christmas.mp3";
let audio = null;
let isMuted = false;
let audioReady = false;

// Unified audio initialization
async function initAudio() {
  if (audio) return;

  audio = new Audio(MUSIC_URL);
  audio.loop = true;
  audio.volume = 0.55;
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
}

// Start/resume audio playback
async function playAudio() {
  try {
    await initAudio();
    if (audio.paused) {
      await audio.play();
      audioReady = true;
    }
  } catch (e) {
    console.warn('[audio] Playback failed:', e);
  }
}

// Mute/unmute control
function setMuted(mute) {
  isMuted = mute;
  if (audio) {
    audio.muted = isMuted;
  }
  if (muteBtn) {
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  }
}


// State
let running = false;
let t = 0; // time
let lastFrameTime = 0; // For delta time calculation
let scrollX = 0;
let speed = WALKING_SPEED;
let pausedForPrompt = false;
let reachedEnd = false;

// Memory stops (== house positions) - positioned so girl starts well before first house
const memories = [
  {
    x: 700,
    title: "Your Sydney Birthday",
    images: [
      { src: "assets/memories/sydney.jpg" },
      { src: "assets/memories/sydney2.jpg" },
      { src: "assets/memories/sydney3.jpg" }
    ]
  },
  {
    x: 1100,
    title: "Our Korea Adventure",
    images: [
      { src: "assets/memories/korea.jpg" },
      { src: "assets/memories/korea2.jpg" },
      { src: "assets/memories/korea3.jpg" }
    ]
  },
  {
    x: 1500,
    title: "Cruising around Europe",
    images: [
      { src: "assets/memories/europe.jpg" },
      { src: "assets/memories/europe2.jpg" },
      { src: "assets/memories/europe3.jpg" }
    ]
  },
  {
    x: 1900,
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
let imagesPreloaded = false;
function preloadImages() {
  if (imagesPreloaded) return; // Prevent duplicate preloading

  const imagePromises = [];
  memories.forEach(memory => {
    memory.images.forEach(imgData => {
      const img = new Image();
      const promise = new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't block on errors
      });
      img.src = imgData.src;
      imagePromises.push(promise);
    });
  });
  Promise.all(imagePromises).then(() => {
    imagesPreloaded = true;
    console.log('[preload] All memory images loaded');
  });
}

// Trees
const trees = Array.from({length: TREE_COUNT}).map((_,i)=>{
  const depth = 1 + (i%3);
  const baseX = i*110 + (i%7)*18;
  return { x: baseX, depth, phase: Math.random()*Math.PI*2 };
});

// Background Santa variables
let santa = { x: -400, y: 80, speed: 1.6, active: false, timer: 0 };

// Pickup mode variables
let pickupMode = false;
let pickupPhase = 0;
let pickupT = 0;
let santaX = 0;
let santaY = 0;
let santaFacingLeft = false; // Track Santa's direction

// Flowers for Nanny tribute
let carryingFlowers = true; // Girl starts with flowers
let flowersLaidDown = false;
let presentsPromptShown = false; // Track if presents prompt has been shown

// Family members for Nanny tribute
let familyPresent = false; // Track if family has joined
let familyEntering = false; // Animation state for family entrance
let familyExiting = false; // Animation state for family exit
let familyEnterProgress = 0; // 0 to 1 for entrance animation
let familyExitProgress = 0; // 0 to 1 for exit animation
let familyMembers = [
  { name: 'Dad', offsetX: -80, height: 70, carryingFlowers: true, hairColor: '#4a3728', shirtColor: '#2c5f8d', isMale: true },
  { name: 'Mum', offsetX: -40, height: 63, carryingFlowers: true, hairColor: '#8b5a3c', shirtColor: '#2d8659', isMale: false },
  { name: 'Sister', offsetX: 40, height: 60, carryingFlowers: true, hairColor: '#f4d03f', shirtColor: '#9c4d8a', isMale: false }
];
const FAMILY_ANIMATION_SPEED = 0.04; // Speed of family entrance/exit

// Enter animation
let doorPromptShown = new Set(); // run-once guard to prevent double door prompt/spawn

let entering = false;
let enterProgress = 0;
let avatarHidden = false;
let currentMemoryIndex = -1;
let currentImageIndex = 0; // Track which image in the set is being shown
let seenMemories = new Set();

// Helpers
function houseScreenX(worldX){ return Math.floor(worldX - (scrollX * 0.35)); }

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
        }, 50);
      }, 1000);
    }
  });
}

// Stage 2: Click "Let's Go" button to start journey
async function startJourney(){
  introEl.classList.add('hidden');
  hudEl.classList.remove('hidden');
  running = true;

  // Start audio playback
  await playAudio();
  setMuted(false);
}

startBtn.addEventListener('click', startJourney);

// HUD mute / play
muteBtn.addEventListener('click', async () => {
  if (isMuted) {
    // Unmute and resume playback
    await playAudio();
    setMuted(false);
  } else {
    // Mute
    setMuted(true);
  }
});
// Canvas quick tap nudge
canvas.addEventListener('touchstart', () => { if (!pausedForPrompt && running && !entering) scrollX += 5; }, { passive: true });

// Drawing
function drawSky(){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#08142c'); g.addColorStop(1, '#07101f');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  // stars
  for (let i=0;i<STAR_COUNT;i++){
    const x = (i*97 + (t*0.02)) % W;
    const y = ((i*53)%300) + 10;
    const tw = 0.6+0.4*Math.sin(t*0.05 + i);
    ctx.globalAlpha = tw; ctx.fillStyle = '#eaf6ff'; ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}
function drawSnow(){
  for (let i=0;i<SNOWFLAKE_COUNT;i++){
    const fx = (i * 113 + (t*0.3)%2000) % W;
    const fy = (i * 59 + (t*0.7)%H) % H;
    ctx.globalAlpha = 0.65; ctx.fillStyle = '#eaf6ff'; ctx.fillRect(fx, fy, 2, 2);
  }
  ctx.globalAlpha = 1;
}
function drawGround(){
  ctx.fillStyle = '#0b1822'; ctx.fillRect(0, H*GROUND_HEIGHT_RATIO, W, H*(1-GROUND_HEIGHT_RATIO));
  ctx.shadowColor = '#86a7ff'; ctx.shadowBlur = 18; ctx.fillStyle = '#a7c4ff';
  const pathY = H*GROUND_HEIGHT_RATIO;
  ctx.beginPath();
  ctx.moveTo(0, pathY-10);
  ctx.bezierCurveTo(W*0.25, pathY-6, W*0.5, pathY-10, W, pathY-8);
  ctx.lineTo(W, pathY+10);
  ctx.bezierCurveTo(W*0.5, pathY+14, W*0.25, pathY+8, 0, pathY+12);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
}
function drawTree(screenX, baseY, height, sway, twinklePhase=false){
  const trunkH = height*0.25;
  ctx.fillStyle = '#20363e'; ctx.fillRect(screenX-3, baseY-trunkH, 6, trunkH);
  ctx.fillStyle = '#1b3a2f';
  ctx.beginPath(); ctx.moveTo(screenX + sway, baseY - height);
  ctx.lineTo(screenX - 42, baseY - trunkH);
  ctx.lineTo(screenX + 42, baseY - trunkH);
  ctx.closePath(); ctx.fill();
  if (twinklePhase){
    const dots = 5;
    for (let d=0; d<dots; d++){
      const lx = screenX + Math.sin(d*1.2 + twinklePhase)*18;
      const ly = baseY - trunkH - d*8 - 6;
      const tw = 0.6+0.4*Math.sin(t*0.12 + d + twinklePhase*2);
      const col = d%2 ? '#ffd97b' : '#ff7d8a';
      ctx.globalAlpha = tw; ctx.fillStyle = col; ctx.fillRect(lx, ly, 3, 3);
    } ctx.globalAlpha = 1;
  }
}
function drawHouse(screenX, glowIntensity=0, isNanny=false){
  const baseY = H*GROUND_HEIGHT_RATIO;
  const w = HOUSE_WIDTH, h = HOUSE_HEIGHT;
  ctx.save(); ctx.translate(screenX, baseY);
  
  // Special heavenly effects for Nanny & Grandma's house
  if (isNanny) {
    const angelGlow = 0.5 + 0.25 * Math.sin(t * 0.03);

    // Multi-layered ethereal glow with ultra-smooth gradients
    // Outer glow - very soft and wide with extended fade and micro-step transitions
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
      const angle = (t * 0.015 + p * Math.PI / 7);
      const radius = 65 + Math.sin(t * 0.02 + p) * 18;
      const particleX = Math.cos(angle) * radius;
      const particleY = -65 + Math.sin(angle) * radius;
      const particleAlpha = 0.35 + 0.25 * Math.sin(t * 0.06 + p);
      const particleSize = 2.5 + Math.sin(t * 0.08 + p) * 1.2;

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
  ctx.fillStyle = '#f5fbff'; ctx.beginPath();
  ctx.moveTo(-w/2-10, -h+3); ctx.lineTo(0, -h-34); ctx.lineTo(w/2+10, -h+3);
  ctx.quadraticCurveTo(w/2, -h+12, 0, -h+18); ctx.quadraticCurveTo(-w/2, -h+12, -w/2-10, -h+3); ctx.closePath(); ctx.fill();
  
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  
  ctx.fillStyle = '#ffd97b'; ctx.shadowColor = '#ffd97b'; ctx.shadowBlur = 18;
  ctx.fillRect(-w/4-14, -h+20, 28, 24); ctx.fillRect(w/4-14, -h+20, 28, 24);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#823f19'; ctx.fillRect(-14, -h+34, 28, 36);
  if (glowIntensity > 0){
    const gx = 0, gy = -h+44; const r = 42 * glowIntensity;
    const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
    grad.addColorStop(0, 'rgba(255, 217, 123, 0.55)'); grad.addColorStop(1, 'rgba(255, 217, 123, 0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawAvatar(x){
  const yBase = H*GROUND_HEIGHT_RATIO - 8;
  const scale = 60 / 60; // Height 60, same as Sister

  // Walking animation - leg sway
  const walkPhase = Math.sin(t * 0.15) * 3; // Leg swing amount

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
  if (carryingFlowers && !flowersLaidDown) {
    ctx.save();
    const bouquetX = x + 12*scale;
    const bouquetY = yBase - 8*scale;

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
    ctx.save();
    const bouquetX = x + 12*scale;
    const bouquetY = yBase - 8*scale;

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
  if (!pickupMode) {
    santa.timer -= 1;
    if (santa.timer <= 0 && !santa.active){ santa.active = true; santa.x = -300; santa.y = 60 + Math.random()*40; }
    if (santa.active){
      santa.x += santa.speed;
      if (santa.x > W + 200){ santa.active = false; santa.timer = 60 * (8 + Math.random()*4); }
      ctx.save(); ctx.translate(santa.x, santa.y);
      
      // Draw reindeer FIRST (in front of sleigh, pulling)
      for (let i=0;i<3;i++){
        const rx = 80 + i*30; // Position reindeer IN FRONT (positive x)
        const ry = 2 - Math.sin((t*0.2 + i))*2;
        
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
    }
  }
  
  // Pickup Santa with sleigh and girl
  if (pickupMode) {
    ctx.save();
    ctx.translate(santaX, santaY);

    // Draw reindeer (3 reindeer pulling the sleigh in a line)
    // Rudolph (red nose) should always be at the FRONT leading the way
    for (let i=0;i<3;i++){
      // Position changes based on direction
      // When flying right (into screen): positions at -90, -125, -160 (Rudolph at -160)
      // When flying left (away): positions at 90, 125, 160 (Rudolph at 160)
      const rx = santaFacingLeft ? (90 + i*35) : (-90 - i*35);
      const ry = 5 - Math.sin((t*0.2 + i))*3; // Galloping motion

      // Reindeer body
      ctx.fillStyle = '#8b6914';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 10, 7, 0, 0, Math.PI*2);
      ctx.fill();

      // Reindeer head - always points in direction of travel
      const headOffset = santaFacingLeft ? 12 : -12;
      ctx.fillStyle = '#a0826d';
      ctx.beginPath();
      ctx.arc(rx+headOffset, ry-2, 6, 0, Math.PI*2);
      ctx.fill();

      // Antlers - adjust based on direction
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (santaFacingLeft) {
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
        const noseOffset = santaFacingLeft ? 16 : -16;
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
      const harnessOffset = santaFacingLeft ? -10 : 10; // Back of reindeer
      ctx.moveTo(rx+harnessOffset, ry);
      if (i === 0) {
        // Closest reindeer (i=0) connects to sleigh
        ctx.lineTo(santaFacingLeft ? 50 : -50, 0);
      } else {
        // Other reindeer connect to the one behind them
        const prevRx = santaFacingLeft ? (90 + (i-1)*35) : (-90 - (i-1)*35);
        const prevRy = 5 - Math.sin((t*0.2 + (i-1)))*3;
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
    if (pickupPhase >= 1) {
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
  }
}


// Main loop
function frame(currentTime){
  requestAnimationFrame(frame);
  if (!running) return;

  // Calculate delta time (time since last frame)
  if (lastFrameTime === 0) lastFrameTime = currentTime;
  const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
  lastFrameTime = currentTime;

  // Update time counter with delta time normalization (assume 60fps baseline)
  const deltaMultiplier = deltaTime * 60;
  t += deltaMultiplier;

  if (!pausedForPrompt && !reachedEnd && !entering && !familyEntering && !familyExiting) scrollX += speed * deltaMultiplier;
  if (entering){
    enterProgress += ENTER_ANIMATION_SPEED * deltaMultiplier;
    if (enterProgress >= 1){
      entering = false;
      avatarHidden = true;
      // Removed chime sound here
      const m = memories[currentMemoryIndex];
      currentImageIndex = 0; // Start with first image
      memoryTitle.textContent = m.title;
      memoryImg.src = m.images[currentImageIndex].src;
      imageCounter.textContent = `${currentImageIndex + 1} / ${m.images.length}`;
      updateImageNavButtons();
      memoryEl.classList.remove('hidden');
    }
  }

  // Family entrance animation
  if (familyEntering) {
    familyEnterProgress += FAMILY_ANIMATION_SPEED * deltaMultiplier;
    if (familyEnterProgress >= 1) {
      familyEnterProgress = 1;
      familyEntering = false;
      familyPresent = true;
      // Show flowers prompt now that family has arrived
      flowersPromptEl.classList.remove('hidden');
    }
  }

  // Family exit animation
  if (familyExiting) {
    familyExitProgress += FAMILY_ANIMATION_SPEED * deltaMultiplier;
    if (familyExitProgress >= 1) {
      familyExitProgress = 1;
      familyExiting = false;
      familyPresent = false;
      pausedForPrompt = false; // Resume movement after family exits
      // Reset family state
      familyMembers.forEach(member => member.carryingFlowers = true);
    }
  }

  drawSky(); drawSnow(); drawGround();

  // Tree line on same baseline as houses; draw BEFORE houses
  const baseTreeY = H*GROUND_HEIGHT_RATIO;
  for (let tr of trees){
    const screenX = Math.floor((tr.x - (scrollX * (0.28 + tr.depth*0.06))) % (W*2));
    const h = 70 + tr.depth*28;
    const sway = Math.sin(t*0.02 + tr.phase) * (1.0 + tr.depth*0.25);
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
    if (i === currentMemoryIndex && (pausedForPrompt || entering)) glow = 1.0;
    else if (screenDist < HOUSE_GLOW_PROXIMITY) glow = 0.35 + 0.25 * Math.sin(t*0.15);

    // Draw house first
    drawHouse(sx, glow, memories[i].isNanny);

    // Draw flowers AFTER house (so they appear in front) - spread along entire front
    if (memories[i].isNanny && flowersLaidDown) {
      const flowerY = H * GROUND_HEIGHT_RATIO + 5; // Position on ground in front of house

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

  if (entering && currentMemoryIndex >= 0){
    const targetHouseX = houseScreenPositions[currentMemoryIndex];
    avatarX = avatarBaseX + (targetHouseX - avatarBaseX) * Math.min(1, enterProgress);
  }
  if (!avatarHidden) drawAvatar(avatarX);

  // Draw family members (entrance/exit animations or static if present)
  if (familyEntering || familyPresent || familyExiting) {
    const nannyHouseIndex = memories.findIndex(m => m.isNanny);
    if (nannyHouseIndex >= 0) {
      const houseX = houseScreenPositions[nannyHouseIndex];

      familyMembers.forEach((member, index) => {
        let memberX;

        if (familyEntering) {
          // Family enters from the house (right side)
          const startX = houseX + 100;
          const endX = avatarBaseX + member.offsetX;
          memberX = startX + (endX - startX) * familyEnterProgress;
        } else if (familyExiting) {
          // Family exits back to the house
          const startX = avatarBaseX + member.offsetX;
          const endX = houseX + 100;
          memberX = startX + (endX - startX) * familyExitProgress;
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
    if (!seenMemories.has(i)) drawMarker(sx);
    if (!pausedForPrompt && !seenMemories.has(i) && !entering){
      const screenDist = Math.abs(sx - avatarBaseX);
      if (screenDist < HOUSE_PROXIMITY_THRESHOLD){
            if (doorPromptShown.has(i)) { continue; } doorPromptShown.add(i);
        pausedForPrompt = true;
        currentMemoryIndex = i;
        promptTitle.textContent = memories[i].title;
        promptText.textContent  = "Go inside to view the memory, or keep walking?";
        promptEl.classList.remove('hidden');
      }
    }
  }

  /* PRESENTS PROMPT GATE - only after all memories seen AND flowers laid down AND family has left */
  if (!presentsPromptShown && seenMemories.size === memories.length && flowersLaidDown && !familyPresent && !familyEntering && !familyExiting && !pausedForPrompt && !pickupMode && !entering) {
    pausedForPrompt = true;
    presentsPromptShown = true;
    presentsPromptEl.classList.remove('hidden');
  }

  // Handle Santa pickup animation
  if (pickupMode) {
    handleSantaPickup(deltaMultiplier);
  }

  drawSanta();
}
requestAnimationFrame(frame);

// Image navigation helpers
function updateImageNavButtons() {
  if (currentMemoryIndex < 0) return;
  const m = memories[currentMemoryIndex];
  // Hide prev button on first image
  if (currentImageIndex === 0) {
    prevImageBtn.style.display = 'none';
  } else {
    prevImageBtn.style.display = 'block';
  }
  // Hide next button on last image
  if (currentImageIndex === m.images.length - 1) {
    nextImageBtn.style.display = 'none';
  } else {
    nextImageBtn.style.display = 'block';
  }
}

function showImage(index) {
  if (currentMemoryIndex < 0) return;
  const m = memories[currentMemoryIndex];
  if (index < 0 || index >= m.images.length) return;
  
  currentImageIndex = index;
  memoryImg.src = m.images[currentImageIndex].src;
  imageCounter.textContent = `${currentImageIndex + 1} / ${m.images.length}`;
  updateImageNavButtons();
}

// Santa pickup animation
function handleSantaPickup(deltaMultiplier) {
  pickupT += deltaMultiplier;

  const avatarBaseX = Math.floor(W * AVATAR_SCREEN_POSITION);

  // Phase 0: Santa flies in from right
  if (pickupPhase === 0) {
    santaX -= SANTA_PICKUP_SPEED_IN * deltaMultiplier; // Santa moves left toward the girl
    santaY = Math.floor(H * 0.72);

    // When Santa reaches the girl
    if (santaX <= avatarBaseX + SANTA_PICKUP_DISTANCE) {
      pickupPhase = 1;
      pickupT = 0;
    }
  }
  // Phase 1: Girl boards sleigh (brief pause)
  else if (pickupPhase === 1) {
    if (pickupT > SANTA_BOARDING_PAUSE) {
      pickupPhase = 2;
      pickupT = 0;
      avatarHidden = true; // Hide the girl avatar
      santaFacingLeft = true; // Turn Santa around to face left when flying away
    }
  }
  // Phase 2: Santa flies away to the right with the girl
  else if (pickupPhase === 2) {
    santaX += SANTA_PICKUP_SPEED_OUT * deltaMultiplier;
    santaY -= SANTA_PICKUP_RISE_RATE * deltaMultiplier; // Fly up slightly

    // When Santa exits screen, show North Pole message
    if (santaX > W + SANTA_EXIT_DISTANCE) {
      pickupPhase = 3;
      northPoleEl.classList.remove('hidden');
      pickupMode = false; // End pickup mode
    }
  }
}

// Buttons
if (viewBtn) viewBtn.addEventListener('click', () => {
  promptEl.classList.add('hidden');
  entering = true; enterProgress = 0;
});
if (continueBtn) continueBtn.addEventListener('click', () => {
  promptEl.classList.add('hidden'); pausedForPrompt = false;
});

// Image navigation buttons
if (prevImageBtn) prevImageBtn.addEventListener('click', () => {
  showImage(currentImageIndex - 1);
});
if (nextImageBtn) nextImageBtn.addEventListener('click', () => {
  showImage(currentImageIndex + 1);
});

if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => {
  memoryEl.classList.add('hidden');
  avatarHidden = false;
  seenMemories.add(currentMemoryIndex);

  // If this was Nanny's house, trigger family entrance
  if (currentMemoryIndex >= 0 && memories[currentMemoryIndex].isNanny && carryingFlowers) {
    // Start family entrance animation
    familyEntering = true;
    familyEnterProgress = 0;
    pausedForPrompt = true; // Keep girl paused during entrance
  } else {
    pausedForPrompt = false;
  }
});

if (presentsYesBtn) presentsYesBtn.addEventListener('click', () => {
  presentsPromptEl.classList.add('hidden');
  pausedForPrompt = false;
  santaX = W + 220; // Start Santa off-screen to the right
  santaY = Math.floor(H * 0.72);
  santaFacingLeft = false; // Santa starts facing right
  pickupMode = true;
  pickupPhase = 0;
  pickupT = 0;
});

if (presentsNoBtn) presentsNoBtn.addEventListener('click', () => {
  presentsPromptEl.classList.add('hidden');
  pausedForPrompt = false;
});

if (flowersYesBtn) flowersYesBtn.addEventListener('click', () => {
  flowersPromptEl.classList.add('hidden');
  carryingFlowers = false;
  flowersLaidDown = true;

  // Make family lay down flowers too
  familyMembers.forEach(member => member.carryingFlowers = false);

  // Start family exit animation
  familyExiting = true;
  familyExitProgress = 0;
  // Keep paused until family exits
  pausedForPrompt = true;
});

if (flowersNoBtn) flowersNoBtn.addEventListener('click', () => {
  flowersPromptEl.classList.add('hidden');

  // Start family exit animation without laying flowers
  familyExiting = true;
  familyExitProgress = 0;
  // Keep paused until family exits
  pausedForPrompt = true;
});

restartBtn.addEventListener('click', () => {
  northPoleEl.classList.add('hidden');
  scrollX = 0; pausedForPrompt = false; reachedEnd = false;
  seenMemories.clear(); doorPromptShown.clear(); currentMemoryIndex = -1;
  entering = false; enterProgress = 0; avatarHidden = false;
  pickupMode = false; pickupPhase = 0; pickupT = 0; santaFacingLeft = false;
  carryingFlowers = true; flowersLaidDown = false;
  presentsPromptShown = false; // Reset presents prompt flag

  // Reset family states
  familyPresent = false;
  familyEntering = false;
  familyExiting = false;
  familyEnterProgress = 0;
  familyExitProgress = 0;
  familyMembers.forEach(member => member.carryingFlowers = true);

  lastFrameTime = 0; // Reset delta time
  running = true;
});

// Additional audio unlock attempt on pointer interaction
window.addEventListener('pointerdown', async () => {
  if (!audioUnlocked) {
    await unlockAudio();
  }
}, { once: true, passive: true });
