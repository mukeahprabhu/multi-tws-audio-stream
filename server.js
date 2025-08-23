const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// Allowed token(s) - you can generate a random secret
const VALID_TOKENS = ["mysecret123", "anothersecret456"];

wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url.replace("/", ""));
  const token = params.get("token");

  if (!VALID_TOKENS.includes(token)) {
    console.log("❌ Unauthorized connection attempt");
    ws.close();
    return;
  }

  console.log("✅ Authorized client connected");

  ws.on("message", (message) => {
    // Broadcast to everyone (except sender)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => console.log("🔌 Client disconnected"));
});

console.log("Server running on ws://localhost:8080");
