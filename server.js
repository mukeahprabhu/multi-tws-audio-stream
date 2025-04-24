const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🌐 WebSocket server running on ws://localhost:${PORT}`);

// Broadcast to all except sender
const broadcast = (data, sender) => {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on("connection", (ws) => {
  console.log("🔌 New client connected. Total clients:", wss.clients.size);

  ws.on("message", (message) => {
    if (Buffer.isBuffer(message)) {
      console.log(`📨 Received audio chunk (${message.length} bytes)`);
      broadcast(message, ws);
    } else {
      console.warn("⚠️ Received non-binary message");
    }
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected. Remaining:", wss.clients.size);
  });

  ws.on("error", (err) => {
    console.error("🚨 WebSocket error:", err.message);
  });
});
