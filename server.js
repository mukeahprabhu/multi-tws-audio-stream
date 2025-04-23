// server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 10000 });

console.log("WebSocket server running on port 10000");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});
