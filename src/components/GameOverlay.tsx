import React from "react";
import { Player } from "../types/game";

interface GameOverlayProps {
  player: Player;
  isMobile: boolean;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  player,
  isMobile,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-md">
        <div className="text-xl font-bold">Level: {player.level}</div>
      </div>

      {!isMobile && ( // Only show instructions on non-mobile
        <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg shadow-md">
          <div className="text-sm">
            <p className="font-semibold">Controls:</p>
            <p>WASD or Arrow Keys to move</p>
            <p>Spacebar to attack enemies</p>
            <p>R to restart when game over</p>
          </div>
        </div>
      )}
    </div>
  );
};
