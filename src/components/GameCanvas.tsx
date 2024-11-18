import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { HealthBar } from "./HealthBar";
import { GameOverlay } from "./GameOverlay";
import CustomJoystick from "./CustomJoystick";
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
    inventory,
    useItem,
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
        setShowConfetti(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [level]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900">
      {showConfetti && (
        <ConfettiExplosion
          particleCount={100}
          duration={1000}
          force={0.8}
          width={1600}
        />
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 p-8 rounded-lg shadow-xl text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="mb-4">Level: {player.level}</p>
            <button
              onClick={resetGame}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
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
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold z-100">
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

        {enemies.map((enemy, index) => (
          <div
            key={index}
            className="absolute transition-transform"
            style={{
              left: `${enemy.position.x}px`,
              top: `${enemy.position.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                enemy.type === "logger" ? "bg-red-600" : "bg-purple-600"
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

      <div className="absolute right-0 top-0 z-50 p-4 text-white">
        <h2 className="text-lg font-bold">Inventory</h2>
        <div className="flex flex-col">
          {Array.from(new Set(inventory)).map((item, index) => (
            <div
              key={index}
              className="bg-white/10 border border-white/20 p-2 m-1 rounded shadow cursor-pointer hover:bg-white/20 transition"
              onClick={() => {
                useItem(item);
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
