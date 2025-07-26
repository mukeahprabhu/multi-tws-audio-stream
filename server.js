const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket server running on port ${PORT}`);

const sessions = {}; // { "123456": { sender: ws, clients: [] } }

wss.on("connection", (ws) => {
  let isSender = false;
  let sessionCode = null;

  ws.on("message", (message) => {
    if (typeof message === "string") {
      try {
        const data = JSON.parse(message);

        if (data.type === "register_sender" && /^\d{6}$/.test(data.code)) {
          sessionCode = data.code;
          isSender = true;
          sessions[sessionCode] = { sender: ws, clients: [] };
          console.log("🎤 Sender registered with code:", sessionCode);
        }

        if (data.type === "register_client" && /^\d{6}$/.test(data.code)) {
          const session = sessions[data.code];
          if (session) {
            session.clients.push(ws);
            sessionCode = data.code;
            console.log("🎧 Client joined session:", sessionCode);
          } else {
            ws.send(JSON.stringify({ type: "error", message: "Invalid code" }));
            ws.close();
          }
        }

      } catch (err) {
        console.error("❌ JSON parse error:", err);
      }
    } else {
      // Audio chunk from sender
      if (isSender && sessionCode && sessions[sessionCode]) {
        sessions[sessionCode].clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });

  ws.on("close", () => {
    if (isSender && sessionCode) {
      console.log("❌ Sender disconnected:", sessionCode);
      const clients = sessions[sessionCode]?.clients || [];
      clients.forEach((c) => c.close());
      delete sessions[sessionCode];
    } else if (sessionCode && sessions[sessionCode]) {
      sessions[sessionCode].clients = sessions[sessionCode].clients.filter((c) => c !== ws);
      console.log("👋 Client disconnected from:", sessionCode);
    }
  });
});
