const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket server running on port ${PORT}`);

// Store current valid authentication code
let currentAuthCode = null;

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.isSender = false;
  ws.isAuthenticated = false;

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);

      // Sender sets the 6-digit code
      if (parsed.type === "authCode") {
        currentAuthCode = parsed.code;
        ws.isSender = true;
        ws.isAuthenticated = true;
        console.log(`🔑 Authentication code set by sender: ${parsed.code}`);
        return;
      }

      // Client tries to authenticate
      if (parsed.type === "authRequest") {
        if (parsed.code === currentAuthCode) {
          ws.isAuthenticated = true;
          ws.send(JSON.stringify({ type: "authResponse", success: true }));
          console.log("✅ Client authenticated successfully");
        } else {
          ws.send(JSON.stringify({ type: "authResponse", success: false }));
          console.log("❌ Client provided wrong code");
        }
        return;
      }
    } catch (e) {
      // Not JSON → must be audio data
      if (ws.isSender && ws.isAuthenticated) {
        wss.clients.forEach((client) => {
          if (!client.isSender && client.isAuthenticated && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket error:", err);
  });
});

