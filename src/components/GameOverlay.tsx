import React from 'react';
import { Player } from '../types/game';

interface GameOverlayProps {
  player: Player;
  score: number;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ player, score }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-md">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="mt-2">
          <div className="text-sm text-gray-600">Level: {player.level}</div>
          <div className="text-sm text-gray-600">XP: {player.experience}/100</div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg shadow-md">
        <div className="text-sm">
          <p className="font-semibold">Controls:</p>
          <p>WASD or Arrow Keys to move</p>
          <p>Spacebar to attack enemies</p>
          <p>R to restart when game over</p>
        </div>
      </div>
    </div>
  );
};