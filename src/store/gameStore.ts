import { create } from "zustand";
import { GameState, Position, Enemy, Tree as TreeType } from "../types/game";
import {
  calculateDistance,
  clampPosition,
  normalizeVector,
} from "../utils/gameUtils";

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const BASE_ATTACK_RANGE = 50; // Base attack range
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RANGE = 20;

const INITIAL_TREE_COUNT = 5; // Base number of trees
const TREE_INCREMENT_PER_LEVEL = 2; // Trees to spawn per level
const ENEMY_INCREMENT_PER_LEVEL = 2; // Enemies to spawn per level

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
  trees: generateInitialTrees(1), // Generate trees immediately at the start
  gameOver: false,
  score: 0,
  level: 1,
};

const MAX_ENEMIES_PER_LEVEL = 20; // Maximum enemies per level

export const useGameStore = create<
  GameState & {
    movePlayer: (direction: Position) => void;
    spawnEnemy: () => void;
    attackEnemy: (enemyIndex: number) => void;
    updateGame: () => void;
    resetGame: () => void;
  }
>((set) => ({
  ...INITIAL_STATE,

  movePlayer: (direction) =>
    set((state) => {
      let newPosition = {
        x: state.player.position.x + direction.x * state.player.speed,
        y: state.player.position.y + direction.y * state.player.speed,
      };

      // Wrap around logic
      if (newPosition.x < 0) {
        newPosition.x = GAME_WIDTH; // Wrap to the right
      } else if (newPosition.x > GAME_WIDTH) {
        newPosition.x = 0; // Wrap to the left
      }

      if (newPosition.y < 0) {
        newPosition.y = GAME_HEIGHT; // Wrap to the bottom
      } else if (newPosition.y > GAME_HEIGHT) {
        newPosition.y = 0;
      }

      return {
        player: {
          ...state.player,
          position: newPosition,
        },
      };
    }),

  spawnEnemy: () =>
    set((state) => {
      const maxEnemies =
        MAX_ENEMIES_PER_LEVEL + (state.level - 1) * ENEMY_INCREMENT_PER_LEVEL;
      if (state.enemies.length >= maxEnemies) return state; // Max enemies cap based on level

      const spawnEdge = Math.floor(Math.random() * 4);
      let position: Position;

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

      const newEnemy: Enemy = {
        position,
        health: 50,
        maxHealth: 50,
        damage: ENEMY_DAMAGE,
        speed: 0.5,
        type: Math.random() > 0.5 ? "logger" : "polluter",
      };

      return { enemies: [...state.enemies, newEnemy] };
    }),

  attackEnemy: (enemyIndex) =>
    set((state) => {
      const newEnemies = [...state.enemies];
      newEnemies[enemyIndex].health -= state.player.damage;

      if (newEnemies[enemyIndex].health <= 0) {
        newEnemies.splice(enemyIndex, 1);
        const newScore = state.score + 100;
        const newExperience = state.player.experience + 2;

        // Check if all enemies are defeated
        if (newEnemies.length === 0) {
          // Level up
          return {
            enemies: newEnemies,
            score: newScore,
            player: {
              ...state.player,
              experience: newExperience,
              level: state.player.level + 1,
              attackRange: BASE_ATTACK_RANGE + state.player.level * 10, // Increase attack range per level
            },
            trees: generateInitialTrees(state.player.level + 1), // Generate more trees for the next level
          };
        }

        return {
          enemies: newEnemies,
          score: newScore,
          player: {
            ...state.player,
            experience: newExperience,
            level: Math.floor(newExperience / 100) + 1,
          },
        };
      }

      return { enemies: newEnemies };
    }),

  updateGame: () =>
    set((state) => {
      if (state.gameOver) return state;

      // Update enemies
      const newEnemies = [...state.enemies];
      const newTrees = [...state.trees];
      let gameOver = false;
      let playerHealth = state.player.health;

      // Update each enemy
      newEnemies.forEach((enemy) => {
        // Find nearest tree if enemy doesn't have a target
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

        // Move towards target tree
        const targetTree = newTrees[enemy.targetTree];
        if (targetTree) {
          const dx = targetTree.position.x - enemy.position.x;
          const dy = targetTree.position.y - enemy.position.y;
          const normalized = normalizeVector(dx, dy);

          enemy.position.x += normalized.x * enemy.speed;
          enemy.position.y += normalized.y * enemy.speed;

          // Check if enemy reached tree
          if (
            calculateDistance(enemy.position, targetTree.position) <
            state.player.attackRange
          ) {
            targetTree.health -= enemy.damage * 0.1; // Reduced damage per frame

            if (targetTree.health <= 0) {
              gameOver = true;
            }
          }
        }

        // Check collision with player
        if (
          calculateDistance(enemy.position, state.player.position) <
          ENEMY_ATTACK_RANGE
        ) {
          playerHealth -= enemy.damage * 0.1; // Reduced damage per frame
          if (playerHealth <= 0) {
            gameOver = true;
          }
        }
      });

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
}));
