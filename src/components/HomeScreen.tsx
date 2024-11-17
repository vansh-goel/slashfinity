import React from "react";
import { TonConnectButton } from "@tonconnect/ui-react";

interface HomeScreenProps {
  onPlay: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-300 ">
      <h1 className="text-4xl font-bold mb-4">Welcome to Eco Warriors Game</h1>
      <button
        onClick={onPlay}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mb-4"
      >
        Play Game
      </button>
      <TonConnectButton className="text-white px-4 py-2 rounded transition" />
    </div>
  );
};
