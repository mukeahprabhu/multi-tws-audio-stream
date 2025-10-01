const WebSocket = require("ws");
const fetch = require("node-fetch"); // ✅ install with: npm install node-fetch

const PORT = process.env.PORT || 10000;
const AUTH_SERVER = "https://multi-tws-audio-stream.onrender.com";

const wss = new WebSocket.Server({ port: PORT });
console.log(`✅ WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.isAuthorized = false;
  ws.role = null;

  ws.on("message", async (message) => {
    try {
      // Try to parse JSON messages (registration)
      let msg;
      try {
        msg = JSON.parse(message.toString());
      } catch {
        msg = null;
      }

      // Handle registration
      if (msg && (msg.type === "register_sender" || msg.type === "register_client")) {
        const response = await fetch(`${AUTH_SERVER}/api/auth/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: msg.code })
        });
        const data = await response.json();

        if (data.ok) {
          ws.isAuthorized = true;
          ws.role = msg.type;
          console.log(`✅ ${msg.type} authorized with code ${msg.code}`);
          ws.send(JSON.stringify({ ok: true, message: "Authorized" }));
        } else {
          console.log("❌ Unauthorized connection, closing...");
          ws.send(JSON.stringify({ ok: false, error: "Invalid/expired code" }));
          ws.close();
        }
        return;
      }

      // Handle audio chunks from sender
      if (ws.isAuthorized && ws.role === "register_sender" && Buffer.isBuffer(message)) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthorized) {
            client.send(message)
