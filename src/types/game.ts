export interface Position {
  x: number;
  y: number;
}

export interface Character {
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
}

export interface Player extends Character {
  experience: number;
  level: number;
}

export interface Enemy extends Character {
  type: 'logger' | 'polluter';
  targetTree?: number;
}

export interface Tree {
  position: Position;
  health: number;
  maxHealth: number;
  id: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  trees: Tree[];
  gameOver: boolean;
  score: number;
}