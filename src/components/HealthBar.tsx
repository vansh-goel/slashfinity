import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  width: number;
}

export const HealthBar: React.FC<HealthBarProps> = ({ current, max, width }) => {
  const percentage = Math.max(0, Math.min((current / max) * 100, 100));
  
  return (
    <div className="relative h-1 bg-red-200 rounded-full mt-1" style={{ width }}>
      <div
        className="absolute h-full bg-red-500 rounded-full transition-all duration-200"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};