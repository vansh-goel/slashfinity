import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SpeedBoster from "../assets/speed_booster.jpg";
import GoldenTree from "../assets/golden_tree.jpg";
import HealthPotion from "../assets/full_hp.jpg";

const Inventory = () => {
  const [speed, setSpeed] = useState(0);
  const navigate = useNavigate();

  const items = [
    {
      id: 1,
      name: "Speed Booster",
      price: 2.99,
      image: SpeedBoster,
      description: "Increase your speed by 50%",
      function: (speed: number) => {
        setSpeed(speed + 50);
        console.log(speed);
      },
    },
    {
      id: 2,
      name: "Ancient Tree",
      price: 14.99,
      image: GoldenTree,
      description: "A mystical tree with healing properties",
    },
    {
      id: 5,
      name: "Health Potion",
      price: 19.99,
      image: HealthPotion,
      description: "Restores 100 HP instantly",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-3xl font-bold text-white mb-8 bg-green-700 px-4 py-1 rounded-md"
        >
          Home
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.name}
                </h2>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => item.function && item.function(speed)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
