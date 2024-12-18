import { create } from "zustand";
import { GameState, Position, Enemy, Tree as TreeType } from "../types/game";
import {
  calculateDistance,
  clampPosition,
  normalizeVector,
} from "../utils/gameUtils";

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const BASE_ATTACK_RANGE = 50;
const BASE_ENEMY_DAMAGE = 2;
const ENEMY_ATTACK_RANGE = 20;

const INITIAL_TREE_COUNT = 5;
const TREE_INCREMENT_PER_LEVEL = 2;
const ENEMY_INCREMENT_PER_LEVEL = 2;

const BASE_XP = 5;
const BASE_XP_TO_LEVEL_UP = 100;
const XP_INCREMENT_PER_LEVEL = 50;
const BASE_ENEMY_SPEED = 0.2;
const ENEMY_SPEED_INCREMENT = 0.1;
const BASE_SPAWN_RATE = 0.01;
const SPAWN_RATE_INCREMENT = 0.01;
const SPAWN_DELAY = 2000;

const levelUpSoundPath = "src/assets/mixkit-completion-of-a-level-2063.wav";
const gameOverSoundPath = "src/assets/mixkit-player-losing-or-failing-2042.wav";
const backgroundMusicPath = "src/assets/game-music-loop-6-144641.mp3";

let backgroundMusic: HTMLAudioElement;

const generateTreePosition = () => ({
  x: Math.random() * (GAME_WIDTH - 50) + 25,
  y: Math.random() * (GAME_HEIGHT - 50) + 25,
});

const generateInitialTrees = (level: number) => {
  const treeCount = INITIAL_TREE_COUNT + (level - 1) * TREE_INCREMENT_PER_LEVEL;
  return Array.from({ length: treeCount }, (_, id) => ({
    position: generateTreePosition(),
    health: 200,
    maxHealth: 200,
    id: id + 1,
  })) as TreeType[];
};

const INITIAL_STATE: GameState = {
  player: {
    position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    health: 200,
    maxHealth: 200,
    damage: 50,
    speed: 8,
    experience: 0,
    level: 1,
    attackRange: BASE_ATTACK_RANGE,
  },
  enemies: [],
  trees: generateInitialTrees(1),
  gameOver: false,
  score: 0,
  lastSpawnTime: 0,
  level: 1,
  inventory: [],
  enemiesKilled: 0,
  lastKillTime: 0,
  comboKillCount: 0,
};

const MAX_ENEMIES_PER_LEVEL = 20;
const NO_SPAWN_RADIUS = 50;

const startBackgroundMusic = () => {
  backgroundMusic = new Audio(backgroundMusicPath);
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.5;
  backgroundMusic.play().catch((error) => {
    console.error("Error playing background music:", error);
  });
};

const getRandomItem = (inventory: string[]) => {
  const items = [
    "🪽", // Kill all enemies
    "🫧", // Heal trees
    "🗡️", // Increase attack
    "🛡️", // Immunity for trees
    "🌱", // Plant a new tree
    "❤️", // Increase player health by 30%
  ];

  if (inventory.includes("⏱️")) items.push("⏱️");
  if (inventory.includes("🔫")) items.push("🔫");
  return items[Math.floor(Math.random() * items.length)];
};

startBackgroundMusic();

export const useGameStore = create<
  GameState & {
    movePlayer: (direction: Position) => void;
    spawnEnemy: () => void;
    attackEnemy: (enemyIndex: number) => void;
    updateGame: () => void;
    resetGame: () => void;
    useItem: (item: string) => void;
    removeItem: (item: string) => void;
    addItem: (item: string) => void;
  }
>((set) => ({
  ...INITIAL_STATE,

  movePlayer: (direction) =>
    set((state) => {
      let newPosition = {
        x: state.player.position.x + direction.x * state.player.speed,
        y: state.player.position.y + direction.y * state.player.speed,
      };

      if (newPosition.x < 0) newPosition.x = GAME_WIDTH;
      else if (newPosition.x > GAME_WIDTH) newPosition.x = 0;

      if (newPosition.y < 0) newPosition.y = GAME_HEIGHT;
      else if (newPosition.y > GAME_HEIGHT) newPosition.y = 0;

      newPosition = clampPosition(newPosition, GAME_WIDTH, GAME_HEIGHT);

      return {
        player: {
          ...state.player,
          position: newPosition,
        },
      };
    }),

  spawnEnemy: () =>
    set((state) => {
      const currentTime = Date.now();
      const maxEnemies =
        MAX_ENEMIES_PER_LEVEL +
        (state.player.level - 1) * ENEMY_INCREMENT_PER_LEVEL;

      if (
        state.enemies.length >= maxEnemies ||
        currentTime - state.lastSpawnTime < SPAWN_DELAY
      ) {
        return state;
      }

      let position: Position = { x: 0, y: 0 };
      let validSpawn = false;

      while (!validSpawn) {
        const spawnEdge = Math.floor(Math.random() * 4);
        switch (spawnEdge) {
          case 0:
            position = { x: Math.random() * GAME_WIDTH, y: 0 };
            break;
          case 1:
            position = { x: GAME_WIDTH, y: Math.random() * GAME_HEIGHT };
            break;
          case 2:
            position = { x: Math.random() * GAME_WIDTH, y: GAME_HEIGHT };
            break;
          default:
            position = { x: 0, y: Math.random() * GAME_HEIGHT };
        }

        validSpawn = !state.trees.some(
          (tree) => calculateDistance(position, tree.position) < NO_SPAWN_RADIUS
        );
      }

      const newEnemy: Enemy = {
        position,
        health: 50,
        maxHealth: 50,
        damage: BASE_ENEMY_DAMAGE + state.player.level - 1,
        speed:
          BASE_ENEMY_SPEED + (state.player.level - 1) * ENEMY_SPEED_INCREMENT,
        type: Math.random() > 0.5 ? "logger" : "polluter",
      };

      return {
        enemies: [...state.enemies, newEnemy],
        lastSpawnTime: currentTime,
      };
    }),

  attackEnemy: () =>
    set((state) => {
      const newEnemies = [...state.enemies];
      const attackRange = state.player.attackRange;
      const playerPosition = state.player.position;

      const enemiesInRange = newEnemies.filter((enemy) => {
        const dx = enemy.position.x - playerPosition.x;
        const dy = enemy.position.y - playerPosition.y;
        return Math.sqrt(dx * dx + dy * dy) < attackRange;
      });

      enemiesInRange.forEach((enemy) => {
        enemy.health -= state.player.damage;

        if (enemy.health <= 0) {
          const enemyIndexToRemove = newEnemies.indexOf(enemy);
          newEnemies.splice(enemyIndexToRemove, 1);
        }
      });

      const gainedExperience = BASE_XP * enemiesInRange.length;
      const newExperience = state.player.experience + gainedExperience;

      const currentTime = Date.now();
      const timeSinceLastKill = currentTime - state.lastKillTime;

      let comboKillCount = state.comboKillCount;

      if (timeSinceLastKill <= 10000) {
        comboKillCount += enemiesInRange.length;
      } else {
        comboKillCount = enemiesInRange.length;
      }

      const calculateLevel = (experience: number): number => {
        let level = 1;
        let requiredXP = BASE_XP_TO_LEVEL_UP;

        while (experience >= requiredXP) {
          level++;
          experience -= requiredXP;
          requiredXP += XP_INCREMENT_PER_LEVEL;
        }

        return level;
      };

      const updatedLevel = calculateLevel(newExperience);

      let experienceForNextLevel =
        BASE_XP_TO_LEVEL_UP + (updatedLevel - 1) * XP_INCREMENT_PER_LEVEL;

      if (
        newExperience >= experienceForNextLevel &&
        updatedLevel > state.player.level
      ) {
        const levelUpSound = new Audio(levelUpSoundPath);
        levelUpSound.play();

        const newTrees = generateInitialTrees(updatedLevel);

        const increasedAttackRange = BASE_ATTACK_RANGE + updatedLevel * 5; // Example increment
        const increasedDamage = state.player.damage + updatedLevel * 5; //
        const increasedSpeed = Math.max(10, state.player.speed + updatedLevel);

        // 5. Adjust enemy spawn rate slightly
        const adjustedSpawnRate = BASE_SPAWN_RATE + (updatedLevel - 1) * 0.001; // Gradual increase

        return {
          enemies: newEnemies,
          player: {
            ...state.player,
            experience: newExperience,
            level: updatedLevel,
            attackRange: increasedAttackRange,
            damage: increasedDamage,
            speed: increasedSpeed,
          },
          level: updatedLevel,
          enemiesKilled: state.enemiesKilled + enemiesInRange.length,
          lastKillTime: currentTime,
          comboKillCount,
          inventory: [...state.inventory],
          trees: newTrees,
          enemySpawnRate: adjustedSpawnRate,
        };
      }

      const updatedState = {
        enemies: newEnemies,
        score: state.score + 100 * enemiesInRange.length,
        player: {
          ...state.player,
          experience: newExperience, // Keep the total experience
          level: updatedLevel, // Use the calculated level
        },
        level: updatedLevel,
        enemiesKilled: state.enemiesKilled + enemiesInRange.length,
        lastKillTime: currentTime,
        comboKillCount,
        inventory: [...state.inventory],
      };

      if (updatedState.comboKillCount >= 5) {
        const item = getRandomItem(state.inventory);
        updatedState.inventory.push(item);
        updatedState.comboKillCount = 0;
      }

      return updatedState;
    }),

  updateGame: () =>
    set((state) => {
      if (state.gameOver) return state;

      const newEnemies = [...state.enemies];
      const newTrees = [...state.trees];
      let gameOver = false;
      let playerHealth = state.player.health;

      newEnemies.forEach((enemy) => {
        if (enemy.targetTree === undefined) {
          let nearestDistance = Infinity;
          let nearestTreeIndex = -1;

          newTrees.forEach((tree, treeIndex) => {
            const distance = calculateDistance(enemy.position, tree.position);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestTreeIndex = treeIndex;
            }
          });

          enemy.targetTree = nearestTreeIndex;
        }

        const targetTree = newTrees[enemy.targetTree];
        if (targetTree) {
          const dx = targetTree.position.x - enemy.position.x;
          const dy = targetTree.position.y - enemy.position.y;
          const normalized = normalizeVector(dx, dy);

          enemy.position.x += normalized.x * enemy.speed;
          enemy.position.y += normalized.y * enemy.speed;

          if (
            calculateDistance(enemy.position, targetTree.position) <
            state.player.attackRange
          ) {
            targetTree.health -= enemy.damage * 0.1;

            if (targetTree.health <= 0) {
              newTrees.splice(enemy.targetTree, 1);
              enemy.targetTree = undefined;
            }
          }
        }

        if (
          calculateDistance(enemy.position, state.player.position) <
          ENEMY_ATTACK_RANGE
        ) {
          playerHealth -= enemy.damage * 0.1;
          if (playerHealth <= 0) {
            const gameOverSound = new Audio(gameOverSoundPath);
            gameOverSound.play();
            gameOver = true;
          }
        }
      });

      if (newTrees.length === 0) {
        const gameOverSound = new Audio(gameOverSoundPath);
        gameOverSound.play();
        gameOver = true;
      }

      if (
        Math.random() <
        BASE_SPAWN_RATE + (state.player.level - 1) * SPAWN_RATE_INCREMENT
      ) {
        const newEnemy: Enemy = {
          position: {
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
          },
          health: 50,
          maxHealth: 50,
          damage: BASE_ENEMY_DAMAGE + state.player.level - 1,
          speed:
            BASE_ENEMY_SPEED + (state.player.level - 1) * ENEMY_SPEED_INCREMENT,
          type: Math.random() > 0.5 ? "logger" : "polluter",
        };
        newEnemies.push(newEnemy);
      }

      return {
        enemies: newEnemies,
        trees: newTrees,
        gameOver,
        player: {
          ...state.player,
          health: playerHealth,
        },
      };
    }),

  resetGame: () =>
    set({
      ...INITIAL_STATE,
      trees: generateInitialTrees(1),
    }),

  useItem: (item: string) =>
    set((state) => {
      const newInventory = state.inventory.filter((i) => i !== item); // Remove the item from inventory

      switch (item) {
        case "🪽":
          const enemiesKilled = state.enemies.length;
          const newExperience =
            state.player.experience + BASE_XP * enemiesKilled;
          return {
            enemies: [],
            player: {
              ...state.player,
              experience: newExperience,
            },
            inventory: newInventory,
          };
        case "🫧":
          state.trees.forEach((tree) => {
            tree.health = Math.min(tree.maxHealth, tree.health + 20);
          });
          break;
        case "🗡️":
          state.player.attackRange *= 2;
          state.player.damage *= 2;

          setTimeout(() => {
            set((s) => ({
              player: {
                ...s.player,
                attackRange: s.player.attackRange / 2,
                damage: s.player.damage / 2,
              },
            }));
          }, 30000);
          break;
        case "🛡️":
          state.trees.forEach((tree) => {
            tree.isImmune = true;
          });
          setTimeout(() => {
            state.trees.forEach((tree) => {
              tree.isImmune = false;
            });
          }, 20000);
          break;
        case "🌱":
          const newTree = {
            position: generateTreePosition(),
            health: 200,
            maxHealth: 200,
            id: state.trees.length + 1,
          };
          return { trees: [...state.trees, newTree], inventory: newInventory };
        case "❤️":
          const healthIncrease = state.player.maxHealth * 0.3;
          return {
            player: {
              ...state.player,
              health: Math.min(
                state.player.maxHealth,
                state.player.health + healthIncrease
              ),
            },
            inventory: newInventory,
          };
        case "⏱️": // Stop enemies for 10 seconds
          const stopEnemies = () => {
            set((s) => ({
              enemies: s.enemies.map((enemy) => ({
                ...enemy,
                speed: 0, // Stop enemy movement
              })),
            }));
            setTimeout(() => {
              set((s) => ({
                enemies: s.enemies.map((enemy) => ({
                  ...enemy,
                  speed:
                    BASE_ENEMY_SPEED +
                    (s.player.level - 1) * ENEMY_SPEED_INCREMENT, // Restore speed
                })),
              }));
            }, 10000);
          };
          stopEnemies();
          break;
        case "🔫": // Logic for shooting projectiles
          // Implement projectile shooting logic here
          break;
      }

      return { inventory: newInventory };
    }),

  removeItem: (item: string) =>
    set((state) => {
      const newInventory = state.inventory.filter((i) => i !== item);
      return { inventory: newInventory };
    }),
  addItem: (item: string) =>
    set((state) => ({
      inventory: [...state.inventory, item],
    })),
}));

startBackgroundMusic();
