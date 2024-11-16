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
  attackRange: number;
}

export interface Enemy extends Character {
  type: "logger" | "polluter";
  targetTree?: number;
}

export interface Tree {
  position: Position;
  health: number;
  maxHealth: number;
  id: number;
  isImmune?: boolean;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  trees: Tree[];
  gameOver: boolean;
  score: number;
  level: number;
  lastSpawnTime: number;
  chests: any[];
  inventory: any[];
  enemiesKilled: number;
  lastKillTime: number;
  comboKillCount: number;
}
