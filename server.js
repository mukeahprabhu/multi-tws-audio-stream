const WebSocket = require("ws");
const url = require("url");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

const VALID_TOKENS = ["mysecret123", "supersecret456"]; // add as needed

console.log(`✅ WebSocket server running on port ${PORT}`);

wss.on("connection", (ws, req) => {
  const query = url.parse(req.url, true).query;
  const token = query.token;

  if (!VALID_TOKENS.includes(token)) {
    console.log("❌ Connection rejected: Invalid or missing token");
    ws.close();
    return;
  }

  console.log("🔌 New authenticated client connected");

  ws.on("message", (message) => {
    console.log("🔊 Received chunk of size:", message.length);

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket error:", err);
  });
});
