
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  WON = 'WON',
  EXPLODED = 'EXPLODED',
  CRASHED = 'CRASHED'
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  acceleration: number;
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'tree' | 'rock';
  id: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
