import { useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { HomeScreen } from "./components/HomeScreen";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);

  const handlePlay = () => {
    setIsGameStarted(true);
  };

  return (
    <div className="w-full overflow-hidden">
      <TonConnectUIProvider manifestUrl="https://slashfinity.vercel.app/tonconnect-manifest.json">
        {isGameStarted ? <GameCanvas /> : <HomeScreen onPlay={handlePlay} />}
      </TonConnectUIProvider>
    </div>
  );
}

export default App;
