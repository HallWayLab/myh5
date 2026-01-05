
export const WORLD_WIDTH = 400;
export const TRACK_LENGTH = 7500; // Total distance to the toilet (shortened by half)
export const GRAVITY = 0.42;       // Downward acceleration (reduced by 30% from 0.6)
export const BRAKE_FORCE = 10.0;   // Braking force per tap
export const LATERAL_SPEED = 25;   // How much the player moves left/right per tap
export const MAX_SPEED = 40;       
export const MIN_SPEED = 1;        
export const BLADDER_MAX = 100;
export const PRESSURE_GROWTH = 0.08; 
export const TOILET_POSITION = TRACK_LENGTH - 400;

export const COLLISION_RADIUS = 15; // Hitbox size
export const OBSTACLE_SPAWN_CHANCE = 0.08; // Frequency of obstacles

export const COLORS = {
  SNOW: '#ffffff',
  TRACK_EDGE: '#cbd5e1',
  PLAYER: '#ef4444',
  TOILET: '#3b82f6',
  EXPLOSION: '#facc15', 
  BLOOD: '#dc2626',
  TREE: '#166534',
  ROCK: '#64748b'
};
