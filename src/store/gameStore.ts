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

const generateTreePosition = () => {
  return {
    x: Math.random() * (GAME_WIDTH - 50) + 25,
    y: Math.random() * (GAME_HEIGHT - 50) + 25,
  };
};

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
  level: 1,
  lastSpawnTime: 0,
  chests: [],
  inventory: [],
  enemiesKilled: 0, // Track the number of enemies killed
  lastKillTime: 0, // Track the last kill time
  comboKillCount: 0, // Track the combo kill count
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

const getRandomItem = () => {
  const items = [
    "🪽", // Kill all enemies
    "🫧", // Heal trees
    "🗡️", // Increase attack
    "🛡️", // Immunity for trees
    "🛠️", // Build fence
    "🌱", // Plant a new tree
  ];
  return items[Math.floor(Math.random() * items.length)];
};

export const useGameStore = create<
  GameState & {
    movePlayer: (direction: Position) => void;
    spawnEnemy: () => void;
    attackEnemy: (enemyIndex: number) => void;
    updateGame: () => void;
    resetGame: () => void;
    useItem: (item: string) => void;
    removeItem: (item: string) => void;
  }
>((set) => ({
  ...INITIAL_STATE,

  movePlayer: (direction) =>
    set((state) => {
      let newPosition = {
        x: state.player.position.x + direction.x * state.player.speed,
        y: state.player.position.y + direction.y * state.player.speed,
      };

      // Logic to wrap around the screen
      if (newPosition.x < 0) {
        newPosition.x = GAME_WIDTH; // Move to the right side if going out of view on the left
      } else if (newPosition.x > GAME_WIDTH) {
        newPosition.x = 0; // Move to the left side if going out of view on the right
      }

      if (newPosition.y < 0) {
        newPosition.y = GAME_HEIGHT; // Move to the bottom if going out of view at the top
      } else if (newPosition.y > GAME_HEIGHT) {
        newPosition.y = 0; // Move to the top if going out of view at the bottom
      }

      // Clamp the position to ensure it stays within bounds
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

  attackEnemy: (enemyIndex) =>
    set((state) => {
      const newEnemies = [...state.enemies];
      newEnemies[enemyIndex].health -= state.player.damage;

      let newChest; // Declare newChest here

      if (newEnemies[enemyIndex].health <= 0) {
        newEnemies.splice(enemyIndex, 1);
        const newExperience = state.player.experience + BASE_XP;

        // Increment enemies killed
        const currentTime = Date.now();
        const timeSinceLastKill = currentTime - state.lastKillTime;

        let comboKillCount = state.comboKillCount;

        if (timeSinceLastKill <= 10000) {
          comboKillCount += 1; // Increment combo kill count if within 10 seconds
        } else {
          comboKillCount = 1; // Reset combo kill count if more than 10 seconds
        }

        const updatedState = {
          enemies: newEnemies,
          score: state.score + 100,
          player: {
            ...state.player,
            experience: newExperience,
            level:
              Math.floor(
                newExperience /
                  (BASE_XP_TO_LEVEL_UP +
                    (state.player.level - 1) * XP_INCREMENT_PER_LEVEL)
              ) + 1,
          },
          enemiesKilled: state.enemiesKilled + 1,
          chests: state.chests, // Ensure chests are included
          lastKillTime: currentTime, // Update last kill time
          comboKillCount, // Update combo kill count
        };

        // Check for chest spawn
        if (updatedState.comboKillCount >= 2) {
          newChest = {
            position: generateTreePosition(),
            health: 100, // Example health for the chest
            item: getRandomItem(), // Get a random item for the chest
            createdAt: currentTime, // Track when the chest was created
          };
          updatedState.chests = [...state.chests, newChest]; // Add newChest to chests
          updatedState.comboKillCount = 0; // Reset combo kill count
        }

        // Check for level up and play sound
        if (updatedState.player.level > state.player.level) {
          const levelUpSound = new Audio(levelUpSoundPath);
          levelUpSound.play();
          updatedState.player.experience = 0; // Reset experience to 0 after leveling up
        }

        return updatedState;
      }

      return { enemies: newEnemies };
    }),

  updateGame: () =>
    set((state) => {
      if (state.gameOver) return state;

      const newEnemies = [...state.enemies];
      const newTrees = [...state.trees];
      const newChests = [...state.chests];
      let gameOver = false;
      let playerHealth = state.player.health;

      const currentTime = Date.now();
      const filteredChests = newChests.filter((chest) => {
        return currentTime - chest.createdAt < 10000; // Keep chest for 10 seconds
      });

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

      // Chest logic
      newChests.forEach((chest) => {
        chest.health -= 1000; // Decrease health every second
        if (chest.health <= 0) {
          // Remove chest if health is 0
          filteredChests.splice(filteredChests.indexOf(chest), 1);
        }
      });

      // Check for chest interactions
      filteredChests.forEach((chest, index) => {
        if (calculateDistance(state.player.position, chest.position) < 50) {
          const item = chest.item; // Get the item from the chest
          // Call useItem from the state
          set((s) => {
            const newInventory = [...s.inventory];
            if (newInventory.length < 2) {
              newInventory.push(item);
            }
            return { inventory: newInventory };
          });

          // Remove the chest from the game state
          filteredChests.splice(index, 1);
        }
      });
      return {
        enemies: newEnemies,
        trees: newTrees,
        chests: filteredChests,
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
      const newInventory = [...state.inventory];
      if (newInventory.length < 2) {
        newInventory.push(item);
      }

      switch (item) {
        case "🪽":
          // Logic to kill all enemies
          return { enemies: [] }; // Clear all enemies
        case "🫧":
          // Logic to heal trees
          state.trees.forEach((tree) => {
            tree.health = Math.min(tree.maxHealth, tree.health + 20);
          });
          break;
        case "🗡️":
          // Increase attack range and damage for 30 seconds
          state.player.attackRange *= 20;
          state.player.damage *= 20;
          setTimeout(() => {
            state.player.attackRange /= 20;
            state.player.damage /= 20;
          }, 30000);
          break;
        case "🛡️":
          // Immunity for trees for 20 seconds
          state.trees.forEach((tree) => {
            tree.isImmune = true; // Assuming you have a way to track immunity
          });
          setTimeout(() => {
            state.trees.forEach((tree) => {
              tree.isImmune = false;
            });
          }, 20000);
          break;
        case "🛠️":
          // Build fence around trees
          // Implement fence logic here
          break;
        case "🌱":
          // Logic to plant a new tree
          const newTree = {
            position: generateTreePosition(),
            health: 200,
            maxHealth: 200,
            id: state.trees.length + 1,
          };
          return { trees: [...state.trees, newTree] };
      }

      return { inventory: newInventory };
    }),

  removeItem: (item: string) =>
    set((state) => {
      const newInventory = state.inventory.filter((i) => i !== item);
      return { inventory: newInventory };
    }),
}));

startBackgroundMusic();
