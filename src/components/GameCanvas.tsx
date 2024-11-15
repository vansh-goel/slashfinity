import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { HealthBar } from './HealthBar';
import { GameOverlay } from './GameOverlay';

export const GameCanvas: React.FC = () => {
  const {
    player,
    enemies,
    trees,
    score,
    gameOver,
    movePlayer,
    attackEnemy,
    updateGame,
    spawnEnemy,
    resetGame
  } = useGameStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === 'r') resetGame();
        return;
      }

      const movement = { x: 0, y: 0 };
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          movement.y = -1;
          break;
        case 'arrowdown':
        case 's':
          movement.y = 1;
          break;
        case 'arrowleft':
        case 'a':
          movement.x = -1;
          break;
        case 'arrowright':
        case 'd':
          movement.x = 1;
          break;
        case ' ':
          const nearestEnemyIndex = enemies.findIndex((enemy) => {
            const dx = enemy.position.x - player.position.x;
            const dy = enemy.position.y - player.position.y;
            return Math.sqrt(dx * dx + dy * dy) < 50;
          });
          if (nearestEnemyIndex !== -1) {
            attackEnemy(nearestEnemyIndex);
          }
          break;
      }
      if (movement.x !== 0 || movement.y !== 0) {
        movePlayer(movement);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    const gameLoop = setInterval(() => {
      if (!gameOver) {
        updateGame();
        if (Math.random() < 0.02) {
          spawnEnemy();
        }
      }
    }, 1000 / 60);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameLoop);
    };
  }, [movePlayer, attackEnemy, updateGame, spawnEnemy, enemies, player.position, gameOver, resetGame]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="mb-4">Final Score: {score}</p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Play Again (Press R)
            </button>
          </div>
        </div>
      )}

      {/* Game UI */}
      <GameOverlay player={player} score={score} />

      {/* Game Elements */}
      <div className="absolute inset-0">
        {/* Player */}
        <div
          className="absolute transition-transform duration-100"
          style={{
            left: `${player.position.x}px`,
            top: `${player.position.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            P
          </div>
          <HealthBar current={player.health} max={player.maxHealth} width={32} />
        </div>

        {/* Trees */}
        {trees.map((tree) => (
          <div
            key={tree.id}
            className="absolute transition-transform"
            style={{
              left: `${tree.position.x}px`,
              top: `${tree.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold">
              🌳
            </div>
            <HealthBar current={tree.health} max={tree.maxHealth} width={48} />
          </div>
        ))}

        {/* Enemies */}
        {enemies.map((enemy, index) => (
          <div
            key={index}
            className="absolute transition-transform"
            style={{
              left: `${enemy.position.x}px`,
              top: `${enemy.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                enemy.type === 'logger' ? 'bg-red-500' : 'bg-purple-500'
              }`}
            >
              {enemy.type === 'logger' ? 'L' : 'P'}
            </div>
            <HealthBar current={enemy.health} max={enemy.maxHealth} width={24} />
          </div>
        ))}
      </div>
    </div>
  );
};