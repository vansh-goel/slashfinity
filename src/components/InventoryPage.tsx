// import React from "react";
// import { useGameStore } from "../store/gameStore";
// import axios from "axios";

// import { useTonConnectUI } from "@tonconnect/ui-react";
// import { Address, beginCell } from "@ton/core";

// const POWER_UPS = [
//   { name: "Energy Boost", price: 10 },
//   { name: "Shield", price: 15 },
//   { name: "Speed Multiplier", price: 20 },
//   { name: "Stop Enemies", price: 25 }, // ⏱️
//   { name: "Projectile Shooter", price: 30 }, // 🔫
// ];

// const InventoryPage: React.FC = () => {
//   const [tonConnectUI] = useTonConnectUI();
//   const { inventory, addItem } = useGameStore();

//   const handlePurchase = async (item: string) => {
//     const orderAmount = 10; // Fixed price for now
//     const merchantOrderNo = Date.now().toString();
//     const userId = "test@aeon.com";
//     const appId = import.meta.env.VITE_APP_ID;
//     const secretKey = import.meta.env.VITE_SECRET_ID;
//     const redirectURL = "https://slashfinity.vercel.app";
//     const callbackURL = "https://slashfinity.vercel.app";

//     // Generate signature for payment
//     const sign = generateSignature({
//       appId,
//       merchantOrderNo,
//       orderAmount: orderAmount.toString(),
//       payCurrency: "USDT",
//       userId,
//       secretKey,
//     });

//     const params = {
//       appId,
//       merchantOrderNo,
//       orderAmount: orderAmount.toString(),
//       payCurrency: "USDT",
//       userId,
//       paymentTokens: "USDT",
//       redirectURL,
//       callbackURL,
//       sign,
//     };

//     try {
//       const response = await axios.post(
//         "https://sbx-crypto-payment-api.aeon.xyz/open/api/payment/V2",
//         params
//       );

//       if (response.data.code === "0") {
//         // Payment successful, proceed with blockchain transaction
//         await purchasePowerUpOnBlockchain(item);

//         // Add item to local inventory
//         addItem(item);

//         // Redirect to payment URL
//         window.location.href = response.data.model.webUrl;
//       } else {
//         console.error("Payment error:", response.data.msg);
//       }
//     } catch (error) {
//       console.error("Error creating order:", error);
//     }
//   };

//   const purchasePowerUpOnBlockchain = async (powerUp: string) => {
//     const contractAddress = Address.parse("YOUR_CONTRACT_ADDRESS_HERE");

//     const transaction = {
//       to: contractAddress.toString(),
//       value: "0.05",
//       payload: beginCell()
//         .storeUint(1, 32)
//         .storeStringTail(powerUp)
//         .endCell()
//         .toBoc()
//         .toString("base64"),
//       validUntil: Math.floor(Date.now() / 1000) + 3600,
//       messages: [],
//     };

//     await tonConnectUI.sendTransaction(transaction);
//   };

//   const generateSignature = (params: {
//     appId: string;
//     merchantOrderNo: string;
//     orderAmount: string;
//     payCurrency: string;
//     userId: string;
//     secretKey: string;
//   }) => {
//     const {
//       appId,
//       merchantOrderNo,
//       orderAmount,
//       payCurrency,
//       userId,
//       secretKey,
//     } = params;

//     const stringToSign = `appId=${appId}&merchantOrderNo=${merchantOrderNo}&orderAmount=${orderAmount}&payCurrency=${payCurrency}&userId=${userId}&key=${secretKey}`;

//     // Use jshashes to generate SHA512 hash
//     const sha512 = new Hashes.SHA512();
//     return sha512.hex(stringToSign).toUpperCase(); // Convert to uppercase
//   };

//   return (
//     <div className="inventory-page">
//       <h2>Power-Up Shop</h2>
//       {POWER_UPS.map((powerUp) => (
//         <div key={powerUp.name} className="power-up-item">
//           <span>{powerUp.name}</span>
//           <span>Price: {powerUp.price} USDT</span>
//           <button
//             onClick={() => handlePurchase(powerUp.name)}
//             disabled={inventory.includes(powerUp.name)}
//           >
//             {inventory.includes(powerUp.name) ? "Owned" : "Purchase"}
//           </button>
//         </div>
//       ))}
//       <button onClick={() => window.history.back()}>Back</button>
//     </div>
//   );
// };

// export default InventoryPage;
