import React from "react";
import { useGameStore } from "../store/gameStore";
import axios from "axios";

const POWER_UPS = [
  {
    name: "⏱️ Stop All Enemies",
    price: 10,
    description: "Freeze time and strategize",
  },
  {
    name: "🌱 Eco Shield",
    price: 15,
    description: "Protect your green empire",
  },
  {
    name: "🍃 Nature Boost",
    price: 20,
    description: "Accelerate environmental progress",
  },
];

const InventoryPage: React.FC = () => {
  const { addItem } = useGameStore();

  const handlePurchase = async (powerUp: string, price: number) => {
    const orderAmount = price;
    const merchantOrderNo = Date.now().toString();
    const userId = "test@aeon.com";
    const appId = import.meta.env.VITE_APP_ID;
    const secretKey = import.meta.env.VITE_SECRET_ID;
    const redirectURL = "https://slashfinity.vercel.app";
    const callbackURL = "https://slashfinity.vercel.app";

    const sign = await generateSignature({
      appId,
      merchantOrderNo,
      orderAmount: orderAmount.toString(),
      payCurrency: "USD",
      userId,
      secretKey,
    });

    const params = {
      appId,
      merchantOrderNo,
      orderAmount: orderAmount.toString(),
      payCurrency: "USD",
      userId,
      redirectURL,
      callbackURL,
      sign,
    };

    try {
      const response = await axios.post(
        "https://sbx-crypto-payment-api.aeon.xyz/open/api/payment/V2",
        params
      );

      if (response.data.code === "0") {
        addItem(powerUp);
        window.location.href = response.data.model.webUrl;
      } else {
        console.error("Payment error:", response.data.msg);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const generateSignature = async (params: {
    appId: string;
    merchantOrderNo: string;
    orderAmount: string;
    payCurrency: string;
    userId: string;
    secretKey: string;
  }) => {
    const {
      appId,
      merchantOrderNo,
      orderAmount,
      payCurrency,
      userId,
      secretKey,
    } = params;
    const stringToSign = `appId=${appId}&merchantOrderNo=${merchantOrderNo}&orderAmount=${orderAmount}&payCurrency=${payCurrency}&userId=${userId}&key=${secretKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => ("00" + b.toString(16)).slice(-2))
      .join("")
      .toUpperCase();
    return hashHex;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 flex flex-col justify-center items-center text-white p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          Power-Up Shop
        </h1>

        <div className="space-y-4">
          {POWER_UPS.map((powerUp) => (
            <div
              key={powerUp.name}
              className="bg-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/20 transition-colors"
            >
              <div>
                <h3 className="font-semibold">{powerUp.name}</h3>
                <p className="text-sm text-gray-300">{powerUp.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-green-300">{powerUp.price} USD</span>
                <button
                  onClick={() => handlePurchase(powerUp.name, powerUp.price)}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full text-white transition-colors"
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => window.history.back()}
            className="border-2 border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
