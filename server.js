const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket server running on port ${PORT}`);

// Store clients in rooms by code
const rooms = {}; // { code: Set of clients }

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");
  let clientRoom = null;

  ws.on("message", (message) => {
    // Check if it's a join message or audio chunk
    if (typeof message === "string" || message instanceof String) {
      const msg = JSON.parse(message);
      if (msg.type === "join") {
        clientRoom = msg.code;
        if (!rooms[clientRoom]) {
          rooms[clientRoom] = new Set();
        }
        rooms[clientRoom].add(ws);
        console.log(`👥 Client joined room: ${clientRoom}`);
      }
      return;
    }

    // Handle binary audio data
    if (clientRoom && rooms[clientRoom]) {
      rooms[clientRoom].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    if (clientRoom && rooms[clientRoom]) {
      rooms[clientRoom].delete(ws);
      if (rooms[clientRoom].size === 0) {
        delete rooms[clientRoom];
      }
    }
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket error:", err);
  });
});
