const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.on("message", (message) => {
    // Check if the message is a buffer (binary data)
    if (Buffer.isBuffer(message)) {
      console.log("🔊 Received binary audio data of size:", message.length);

      // Broadcast the binary audio data to all clients except the sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);  // Send the raw binary data
        }
      });
    } else {
      console.error("Invalid message format received: not a buffer");
    }
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});
