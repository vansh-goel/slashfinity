import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { HealthBar } from "./HealthBar";
import { GameOverlay } from "./GameOverlay";
import CustomJoystick from "./CustomJoystick"; // Import the custom joystick
import ConfettiExplosion from "react-confetti-explosion";

export const GameCanvas: React.FC = () => {
  const {
    player,
    enemies,
    trees,
    gameOver,
    movePlayer,
    attackEnemy,
    updateGame,
    spawnEnemy,
    resetGame,
    level,
    inventory, // Add inventory to destructured state
    useItem, // Add useItem to destructured state
  } = useGameStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === "r") resetGame();
        return;
      }

      const movement = { x: 0, y: 0 };
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          movement.y = -1;
          break;
        case "arrowdown":
        case "s":
          movement.y = 1;
          break;
        case "arrowleft":
        case "a":
          movement.x = -1;
          break;
        case "arrowright":
        case "d":
          movement.x = 1;
          break;
        case " ":
          if (!isMobile) {
            const nearestEnemyIndex = enemies.findIndex((enemy) => {
              const dx = enemy.position.x - player.position.x;
              const dy = enemy.position.y - player.position.y;
              return Math.sqrt(dx * dx + dy * dy) < 50;
            });
            if (nearestEnemyIndex !== -1) {
              attackEnemy(nearestEnemyIndex);
            }
          }
          break;
      }
      if (movement.x !== 0 || movement.y !== 0) {
        movePlayer(movement);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    const gameLoop = setInterval(() => {
      if (!gameOver) {
        updateGame();
        if (Math.random() < 0.02) {
          spawnEnemy();
        }
      }
    }, 1000 / 60);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearInterval(gameLoop);
    };
  }, [
    movePlayer,
    attackEnemy,
    updateGame,
    spawnEnemy,
    enemies,
    player.position,
    gameOver,
    resetGame,
  ]);

  useEffect(() => {
    if (level > 1) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false); // Stop confetti after 1 second
      }, 1000); // 1000 milliseconds = 1 second
      return () => clearTimeout(timer);
    }
  }, [level]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-green-300">
      {showConfetti && (
        <ConfettiExplosion
          particleCount={100} // Reduced particle count to minimize lag
          duration={1000} // Adjusted duration to match the timeout
          force={0.8}
          width={1600}
        />
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="mb-4">Level: {player.level}</p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Play Again (Press R)
            </button>
          </div>
        </div>
      )}

      <GameOverlay player={player} isMobile={isMobile} />

      <div className="absolute inset-0">
        <div
          className="absolute transition-transform duration-100"
          style={{
            left: `${player.position.x}px`,
            top: `${player.position.y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 20,
          }}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold z-100">
            🥷
          </div>
          <HealthBar
            current={player.health}
            max={player.maxHealth}
            width={32}
          />
        </div>

        {trees.map((tree) => (
          <div
            key={tree.id}
            className="absolute transition-transform"
            style={{
              left: `${tree.position.x}px`,
              top: `${tree.position.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <div className="w-12 h-12 rounded-lg bg-green-700 flex items-center justify-center text-white font-bold">
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
              transform: "translate(-50%, -50%)",
              zIndex: 10, // Ensure enemies are above trees
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                enemy.type === "logger" ? "bg-red-500" : "bg-purple-500"
              }`}
            >
              {enemy.type === "logger" ? "☢️" : "👹"}
            </div>
            <HealthBar
              current={enemy.health}
              max={enemy.maxHealth}
              width={24}
            />
          </div>
        ))}
      </div>

      {isMobile && (
        <CustomJoystick
          onMove={(movement) => {
            movePlayer(movement);
            updateGame();
          }}
          onAttack={() => {
            const nearestEnemyIndex = enemies.findIndex((enemy) => {
              const dx = enemy.position.x - player.position.x;
              const dy = enemy.position.y - player.position.y;
              return Math.sqrt(dx * dx + dy * dy) < 50 + player.level * 10;
            });
            if (nearestEnemyIndex !== -1) {
              attackEnemy(nearestEnemyIndex);
            }
          }}
          style={{ zIndex: 100 }}
        />
      )}

      {/* Inventory Display */}
      <div className="absolute right-0 top-0 z-50 p-4">
        <h2 className="text-lg font-bold">Inventory</h2>
        <div className="flex flex-col">
          {inventory.map((item, index) => (
            <div
              key={index}
              className="bg-white p-2 m-1 rounded shadow cursor-pointer"
              onClick={() => {
                useItem(item); // Use the item when clicked
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
