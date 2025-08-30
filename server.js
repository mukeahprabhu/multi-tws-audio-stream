const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const sessions = {}; // { "123456": { sender: ws, clients: [] } }

wss.on("connection", (ws) => {
  console.log("🔗 New connection established");

  ws.on("message", (message) => {
    // If it's a string, it's JSON (code registration); else it's binary audio
    if (typeof message === "string") {
      try {
        const data = JSON.parse(message);

        if (data.type === "register_sender") {
          const code = data.code;

          if (!/^\d{6}$/.test(code)) {
            console.error("❌ Invalid session code format:", code);
            ws.close();
            return;
          }

          sessions[code] = {
            sender: ws,
            clients: []
          };

          ws.sessionCode = code;
          console.log("🎤 Sender registered with code:", code);
        }

        if (data.type === "register_client") {
          const code = data.code;
          const session = sessions[code];

          if (session) {
            session.clients.push(ws);
            ws.sessionCode = code;
            console.log("🎧 New client connected to session:", code);
          } else {
            console.warn("⚠️ Client tried to connect to invalid code:", code);
            ws.send(JSON.stringify({ type: "error", message: "Invalid session code" }));
            ws.close();
          }
        }

      } catch (err) {
        console.error("❌ JSON parse error:", err);
      }
    } else {
      // Binary audio data from sender
      const code = ws.sessionCode;
      const session = sessions[code];

      if (session && session.sender === ws) {
        // Forward audio to all clients
        session.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    }
  });

  ws.on("close", () => {
    const code = ws.sessionCode;

    if (code) {
      if (sessions[code]?.sender === ws) {
        console.log("🔌 Sender disconnected. Closing session:", code);
        sessions[code].clients.forEach((client) => client.close());
        delete sessions[code];
      } else {
        const clients = sessions[code]?.clients || [];
        sessions[code].clients = clients.filter((c) => c !== ws);
        console.log("👋 Client disconnected from session:", code);
      }
    }
  });
});

console.log("🚀 WebSocket server running on ws://localhost:8080");
