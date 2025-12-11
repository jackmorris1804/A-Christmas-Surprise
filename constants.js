/**
 * Constants module - All game constants in one place
 */

// ===== GAME CONSTANTS =====
export const AVATAR_SCREEN_POSITION = 0.35; // Avatar position on screen (35% from left)
export const WALKING_SPEED = 1.35; // Base walking speed
export const HOUSE_PROXIMITY_THRESHOLD = 18; // Distance to trigger house prompt
export const HOUSE_WIDTH = 140; // House width in pixels
export const HOUSE_HEIGHT = 82; // House height in pixels
export const HOUSE_OFFSCREEN_MARGIN = 200; // Margin for culling off-screen houses
export const HOUSE_GLOW_PROXIMITY = 40; // Distance for house glow effect
export const GROUND_HEIGHT_RATIO = 0.78; // Ground starts at 78% of screen height
export const ENTER_ANIMATION_SPEED = 0.03; // House enter animation speed
export const STAR_COUNT = 120; // Number of stars in sky
export const SNOWFLAKE_COUNT = 140; // Number of snowflakes
export const TREE_COUNT = 25; // Number of trees (reduced from 42 to avoid crowding)
export const SANTA_PICKUP_SPEED_IN = 3.5; // Santa flying in speed
export const SANTA_PICKUP_SPEED_OUT = 4.5; // Flying away speed
export const SANTA_PICKUP_RISE_RATE = 0.8; // Santa vertical rise rate when flying away
export const SANTA_PICKUP_DISTANCE = 100; // Distance when Santa picks up the girl
export const SANTA_EXIT_DISTANCE = 200; // Distance when Santa exits screen
export const SANTA_BOARDING_PAUSE = 30; // Frames to pause while girl boards sleigh
export const DPR_MAX = 2; // Max device pixel ratio (prevents excessive resolution on high DPI)

// ===== VISUAL CONSTANTS =====
export const FLOWER_COLORS = ['#ff6b9d', '#ffb5d8', '#ff8fab', '#ffc0cb', '#ff69b4'];

// Aurora Borealis
export const AURORA_WAVE_COUNT = 3;
export const AURORA_SPEED = 0.002;
export const AURORA_COLORS = [
  { r: 0, g: 255, b: 100 },   // Green
  { r: 100, g: 200, b: 255 }, // Blue
  { r: 200, g: 100, b: 255 }  // Purple
];

// Footprints
export const FOOTPRINT_FADE_DURATION = 300; // frames
export const FOOTPRINT_SPACING = 20; // pixels between footprints

// Window Glow
export const WINDOW_FLICKER_SPEED = 0.08;

// Chimney Smoke
export const SMOKE_PARTICLE_COUNT = 5; // per chimney
export const SMOKE_RISE_SPEED = 0.3;
export const SMOKE_SWAY_AMOUNT = 0.5;

// Sparkle Trail
export const SPARKLE_COUNT = 20;
export const SPARKLE_LIFETIME = 40; // frames
export const SPARKLE_SIZE = 3;

// Shooting Stars
export const SHOOTING_STAR_CHANCE = 0.001; // per frame
export const SHOOTING_STAR_SPEED = 8;
export const SHOOTING_STAR_LENGTH = 80;

// Icicles
export const ICICLE_COUNT_PER_HOUSE = 6;

// Moon
export const MOON_SIZE = 60;
export const MOON_GLOW_SIZE = 120;
export const MOON_CLICK_RADIUS = 80; // Click detection radius

// Twinkling House Lights
export const HOUSE_LIGHTS_COUNT = 8;
export const LIGHT_COLORS = ['#ff6b6b', '#6bff6b', '#6b6bff', '#ffff6b', '#ff6bff'];

// Snowdrifts
export const SNOWDRIFT_COUNT = 15;

// Deer/Woodland Creatures
export const DEER_SPAWN_CHANCE = 0.002; // per frame
export const DEER_SPEED = 0.5;

// Frosted Ground Sparkles
export const GROUND_SPARKLE_COUNT = 40;
export const GROUND_SPARKLE_TWINKLE_SPEED = 0.05;

// Magic Particle Bursts
export const MAGIC_PARTICLE_COUNT = 25;
export const MAGIC_PARTICLE_LIFETIME = 60;

// ===== ANIMATION TIMINGS =====
export const ENVELOPE_OPEN_DURATION = 1000;
export const LETTER_APPEAR_DELAY = 50;
export const SANTA_SPAWN_MIN_FRAMES = 480; // 8 seconds at 60fps
export const SANTA_SPAWN_MAX_FRAMES = 720; // 12 seconds at 60fps
export const DOOR_OPEN_ANGLE = 15; // degrees
export const DOOR_ANIMATION_SPEED = 0.5;

// ===== DRAWING CONSTANTS =====
export const TREE_TRUNK_WIDTH = 6;
export const TREE_TRUNK_HEIGHT_RATIO = 0.25;
export const TREE_OFFSCREEN_MARGIN = 100;
export const WINDOW_WIDTH = 28;
export const WINDOW_HEIGHT = 24;
export const SHOE_WIDTH = 3;
export const SHOE_HEIGHT = 2;
export const FAMILY_SPACING = 40;
export const FAMILY_ANIMATION_SPEED = 0.04;

// ===== ANIMATION SPEEDS =====
export const STAR_TWINKLE_SPEED_FAST = 0.05;
export const STAR_TWINKLE_SPEED_SLOW = 0.02;
export const SNOW_ALPHA = 0.65;
export const WALKING_ANIMATION_SPEED = 0.15;

// ===== AUDIO CONSTANTS =====
export const MUSIC_URL = "assets/audio/bgm_christmas.mp3";
export const DEFAULT_VOLUME = 0.55;
export const FOOTSTEP_INTERVAL = 25; // Frames between footstep sounds
export const FOOTSTEP_VOLUME = 0.15;

// ===== SKY ELEMENTS =====
// Flying Reindeer
export const REINDEER_SPAWN_CHANCE = 0.0008; // per frame
export const REINDEER_SPEED = 2.5;
export const REINDEER_SIZE = 40;

// Christmas Ornaments
export const ORNAMENT_SPAWN_CHANCE = 0.001; // per frame
export const ORNAMENT_FLOAT_SPEED = 0.3;
export const ORNAMENT_SIZE = 25;
export const ORNAMENT_COLORS = ['#ff6b6b', '#6bff6b', '#6b6bff', '#ffd700', '#ff1493'];

// Christmas Bells
export const BELL_SPAWN_CHANCE = 0.0007; // per frame
export const BELL_FLOAT_SPEED = 0.4;
export const BELL_SIZE = 20;
export const BELL_SPARKLE_COUNT = 3;

// ===== DEBUG =====
export const DEBUG = false; // Set to true for console logging
