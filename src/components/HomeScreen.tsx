import React from "react";
import { TonConnectButton } from "@tonconnect/ui-react";

interface HomeScreenProps {
  onPlay: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 flex flex-col justify-center items-center text-white p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          Slashfinity
        </h1>

        <p className="text-lg text-gray-200">
          Embark on an epic digital journey where your skills and strategy
          determine the fate of virtual worlds.
        </p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={onPlay}
            className="w-full bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full text-white font-semibold transition-colors"
          >
            Start Your Adventure
          </button>

          <button className="w-full border-2 border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
            View Inventory
          </button>
        </div>

        <div className="w-full flex justify-center">
          <TonConnectButton />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
