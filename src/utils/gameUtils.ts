import { Position } from '../types/game';

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

export const clampPosition = (pos: Position, maxWidth: number, maxHeight: number): Position => {
  return {
    x: Math.max(0, Math.min(pos.x, maxWidth)),
    y: Math.max(0, Math.min(pos.y, maxHeight))
  };
};

export const normalizeVector = (dx: number, dy: number): Position => {
  const length = Math.sqrt(dx * dx + dy * dy);
  return length === 0 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
};