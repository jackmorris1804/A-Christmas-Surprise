/**
 * Game State module - Centralized game state management
 */

export const gameState = {
  // Core game state
  running: false,
  t: 0,
  lastFrameTime: 0,
  scrollX: 0,
  speed: 1.35,
  pausedForPrompt: false,
  reachedEnd: false,

  // House interaction
  currentMemoryIndex: -1,
  entering: false,
  enterProgress: 0,
  avatarHidden: false,
  currentImageIndex: 0,
  seenMemories: new Set(),
  doorPromptShown: new Set(),

  // Pickup mode (Santa)
  pickupMode: false,
  pickupPhase: 0,
  pickupT: 0,
  santaX: 0,
  santaY: 0,
  santaFacingLeft: false,

  // Flowers for Nanny tribute
  carryingFlowers: true,
  flowersLaidDown: false,
  presentsPromptShown: false,

  // Family members
  familyPresent: false,
  familyEntering: false,
  familyExiting: false,
  familyEnterProgress: 0,
  familyExitProgress: 0,

  // New visual features
  footstepCounter: 0,
  moonClicked: false,
  moonAnimationProgress: 0,
  doorOpenProgress: new Map(), // house index -> open progress (0-1)

  // Performance caches (updated each frame)
  cachedScrollX_025: 0,
  cachedScrollX_030: 0,
  cachedScrollX_035: 0,
  cachedSinT_002: 0,
  cachedSinT_003: 0,
  cachedSinT_015: 0,
  cachedCosT_015: 0,
  cachedTwinkle: 0
};

export function resetGameState() {
  gameState.running = false;
  gameState.t = 0;
  gameState.lastFrameTime = 0;
  gameState.scrollX = 0;
  gameState.speed = 1.35;
  gameState.pausedForPrompt = false;
  gameState.reachedEnd = false;

  gameState.currentMemoryIndex = -1;
  gameState.entering = false;
  gameState.enterProgress = 0;
  gameState.avatarHidden = false;
  gameState.currentImageIndex = 0;
  gameState.seenMemories = new Set();
  gameState.doorPromptShown = new Set();

  gameState.pickupMode = false;
  gameState.pickupPhase = 0;
  gameState.pickupT = 0;
  gameState.santaX = 0;
  gameState.santaY = 0;
  gameState.santaFacingLeft = false;

  gameState.carryingFlowers = true;
  gameState.flowersLaidDown = false;
  gameState.presentsPromptShown = false;

  gameState.familyPresent = false;
  gameState.familyEntering = false;
  gameState.familyExiting = false;
  gameState.familyEnterProgress = 0;
  gameState.familyExitProgress = 0;

  gameState.footstepCounter = 0;
  gameState.moonClicked = false;
  gameState.moonAnimationProgress = 0;
  gameState.doorOpenProgress = new Map();
}

// Update performance caches each frame
export function updatePerformanceCaches() {
  gameState.cachedScrollX_025 = gameState.scrollX * 0.25;
  gameState.cachedScrollX_030 = gameState.scrollX * 0.3;
  gameState.cachedScrollX_035 = gameState.scrollX * 0.35;
  gameState.cachedSinT_002 = Math.sin(gameState.t * 0.02);
  gameState.cachedSinT_003 = Math.sin(gameState.t * 0.03);
  gameState.cachedSinT_015 = Math.sin(gameState.t * 0.015);
  gameState.cachedCosT_015 = Math.cos(gameState.t * 0.015);
  gameState.cachedTwinkle = Math.sin(gameState.t * 0.05);
}

// Gradient cache
export const gradientCache = {
  moonGlow: null,
  auroraGradients: [],
  houseLightGradients: new Map(),
  shootingStarGradient: null,
  ornamentGradients: new Map(), // key: color, value: gradient
  bellGradient: null
};

// Particle pools for object reuse
export const particlePools = {
  sparkles: [],
  shootingStars: [],
  magicParticles: [],
  smokeParticles: [],
  flyingReindeer: [],
  ornaments: [],
  bells: []
};

// Initialize particle pools
export function initParticlePools() {
  // Pre-allocate sparkle objects
  for (let i = 0; i < 30; i++) {
    particlePools.sparkles.push({
      x: 0, y: 0, life: 0, size: 0, speedX: 0, speedY: 0, active: false
    });
  }

  // Pre-allocate shooting star objects
  for (let i = 0; i < 5; i++) {
    particlePools.shootingStars.push({
      x: 0, y: 0, speed: 0, length: 0, life: 0, active: false
    });
  }

  // Pre-allocate magic particle objects
  for (let i = 0; i < 50; i++) {
    particlePools.magicParticles.push({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0, color: '', active: false
    });
  }

  // Pre-allocate flying reindeer objects
  for (let i = 0; i < 3; i++) {
    particlePools.flyingReindeer.push({
      x: 0, y: 0, speed: 0, size: 0, flapPhase: 0, active: false
    });
  }

  // Pre-allocate ornament objects
  for (let i = 0; i < 10; i++) {
    particlePools.ornaments.push({
      x: 0, y: 0, speedY: 0, speedX: 0, rotation: 0, rotationSpeed: 0,
      size: 0, color: '', swayPhase: 0, active: false
    });
  }

  // Pre-allocate bell objects
  for (let i = 0; i < 5; i++) {
    particlePools.bells.push({
      x: 0, y: 0, floatPhase: 0, swayPhase: 0, size: 0,
      sparkles: Array.from({length: 3}).map(() => ({
        angle: 0, distance: 0, life: 0
      })),
      life: 0, active: false
    });
  }
}
