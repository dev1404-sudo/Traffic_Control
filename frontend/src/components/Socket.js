// src/socket.js
import { io } from "socket.io-client";

// Connect to backend WebSocket server
const socket = io("http://localhost:5000", {
  transports: ["websocket"], // enforce websocket
  reconnection: true,        // auto-reconnect
  reconnectionAttempts: 5,   // retry 5 times
  reconnectionDelay: 1000    // 1s delay between retries
});

export default socket;
