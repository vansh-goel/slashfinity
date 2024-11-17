import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                isGameStarted ? (
                  <GameCanvas />
                ) : (
                  <HomeScreen onPlay={handlePlay} />
                )
              }
            />
          </Routes>
        </Router>
      </TonConnectUIProvider>
    </div>
  );
}

export default App;
