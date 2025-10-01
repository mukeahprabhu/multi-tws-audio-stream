const WebSocket = require("ws");

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
      const msg = JSON.parse(message.toString());

      // Handle registration
      if (msg.type === "register_sender" || msg.type === "register_client") {
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

      // Forward audio only from authorized sender
      if (ws.isAuthorized && ws.role === "register_sender" && Buffer.isBuffer(message)) {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthorized) {
            client.send(message);
          }
        });
      }

    } catch (err) {
      console.error("⚠ WebSocket error:", err);
    }
  });

  ws.on("close", () => console.log("❌ A client disconnected"));
  ws.on("error", (err) => console.error("⚠ WebSocket error:", err));
});
