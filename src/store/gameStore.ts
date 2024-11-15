import { create } from "zustand";
import { GameState, Position, Enemy, Tree as TreeType } from "../types/game";
import {
  calculateDistance,
  clampPosition,
  normalizeVector,
} from "../utils/gameUtils";

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const ATTACK_RANGE = 50; // Used for player attack range
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RANGE = 20;

// Function to generate random tree positions
const generateTreePosition = () => {
  return {
    x: Math.random() * (GAME_WIDTH - 50) + 25, // Ensure trees are within bounds
    y: Math.random() * (GAME_HEIGHT - 50) + 25,
  };
};

const INITIAL_STATE: GameState = {
  player: {
    position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 }, // Center the player
    health: 200,
    maxHealth: 200,
    damage: 50,
    speed: 8,
    experience: 0,
    level: 1,
  },
  enemies: [],
  trees: Array.from({ length: 3 }, (_, id) => ({
    position: generateTreePosition(),
    health: 200,
    maxHealth: 200,
    id: id + 1,
  })) as TreeType[], // Generate trees within bounds
  gameOver: false,
  score: 0,
};

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
      const newPosition = clampPosition(
        {
          x: state.player.position.x + direction.x * state.player.speed,
          y: state.player.position.y + direction.y * state.player.speed,
        },
        GAME_WIDTH,
        GAME_HEIGHT
      );

      return {
        player: {
          ...state.player,
          position: newPosition,
        },
      };
    }),

  spawnEnemy: () =>
    set((state) => {
      if (state.enemies.length >= 10) return state; // Max enemies cap

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
        return {
          enemies: newEnemies,
          score: state.score + 100,
          player: {
            ...state.player,
            experience: state.player.experience + 20,
            level: Math.floor((state.player.experience + 20) / 100) + 1,
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
      newEnemies.forEach((enemy, index) => {
        // Find nearest tree if enemy doesn't have a target
        if (enemy.targetTree === undefined) {
          let nearestDistance = Infinity;
          let nearestTreeIndex = 0;

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
            ATTACK_RANGE // Updated to use ATTACK_RANGE
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

  resetGame: () => set(INITIAL_STATE),
}));
