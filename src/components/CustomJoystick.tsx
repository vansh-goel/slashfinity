import React, { useState } from "react";

interface CustomJoystickProps {
  onMove: (movement: { x: number; y: number }) => void;
  onAttack: () => void;
  style?: React.CSSProperties; // Add this line to allow style prop
}

const CustomJoystick: React.FC<CustomJoystickProps> = ({
  onMove,
  onAttack,
  style, // Destructure style prop
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsMoving(true);
    const touch = e.touches[0];
    updateStickPosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMoving) {
      const touch = e.touches[0];
      updateStickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsMoving(false);
    setStickPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 }); // Stop movement
  };

  const updateStickPosition = (clientX: number, clientY: number) => {
    const baseRect = document
      .getElementById("joystick-base")
      ?.getBoundingClientRect();
    if (baseRect) {
      const baseX = baseRect.left + baseRect.width / 2;
      const baseY = baseRect.top + baseRect.height / 2;

      const dx = clientX - baseX;
      const dy = clientY - baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = baseRect.width / 2;

      if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        setStickPosition({
          x: Math.cos(angle) * maxDistance,
          y: Math.sin(angle) * maxDistance,
        });
      } else {
        setStickPosition({ x: dx, y: dy });
      }

      // Normalize movement values
      onMove({
        x: stickPosition.x / maxDistance,
        y: stickPosition.y / maxDistance,
      });
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100px",
        left: "0",
        right: "0",
        display: "flex",
        justifyContent: "space-between",
        padding: "0 20px",
        ...style, // Apply the style prop here
      }}
    >
      <div
        id="joystick-base"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          border: "2px solid black", // Black border for joystick
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 255, 0.5)",
            transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)`,
            transition: isMoving ? "none" : "transform 0.1s",
          }}
        />
      </div>

      {/* Attack Button */}
      <button
        onClick={onAttack}
        style={{
          backgroundColor: "rgba(0, 0, 255, 0.5)",
          color: "white",
          padding: "20px 20px",
          height: "100px",
          width: "100px",
          borderRadius: "1000px",
          border: "2px solid black", // Black border for button
        }}
      >
        X
      </button>
    </div>
  );
};

export default CustomJoystick;
