
export interface Point {
  x: number;
  y: number;
}

export type ParticleType = 'energy' | 'hazard' | 'decoration' | 'shield' | 'magnet';

export interface Particle extends Point {
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: ParticleType;
  pulse?: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER'
}
