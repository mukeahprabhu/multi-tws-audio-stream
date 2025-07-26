const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket server running on port ${PORT}`);

// Store sessions: code => { senderSocket, receivers[] }
const sessions = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g. "X8F7BZ"
}

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  let currentSessionCode = null;
  let isSender = false;

  ws.on("message", (msg) => {
    try {
      if (typeof msg !== "string") {
        // Binary stream from sender
        if (currentSessionCode && isSender) {
          const session = sessions.get(currentSessionCode);
          if (session) {
            session.receivers.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
              }
            });
          }
        }
        return;
      }

      const data = JSON.parse(msg);

      // Sender connects
      if (data.type === "host") {
        const code = generateCode();
        sessions.set(code, { senderSocket: ws, receivers: [] });
        currentSessionCode = code;
        isSender = true;
        ws.send(JSON.stringify({ type: "code", code }));
        console.log(`🎙 Sender started session with code: ${code}`);
        return;
      }

      // Receiver connects with code
      if (data.type === "join" && data.code) {
        const session = sessions.get(data.code);
        if (session) {
          session.receivers.push(ws);
          currentSessionCode = data.code;
          ws.send(JSON.stringify({ type: "joined", status: "success" }));
          console.log(`👂 Receiver joined session ${data.code}`);
        } else {
          ws.send(JSON.stringify({ type: "error", message: "Invalid code" }));
          console.warn(`❌ Receiver tried invalid code: ${data.code}`);
        }
        return;
      }

    } catch (err) {
      console.error("❌ Message processing error:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
    if (currentSessionCode) {
      const session = sessions.get(currentSessionCode);
      if (session) {
        if (isSender) {
          session.receivers.forEach((r) => r.close());
          sessions.delete(currentSessionCode);
          console.log(`🔒 Closed session ${currentSessionCode}`);
        } else {
          session.receivers = session.receivers.filter((r) => r !== ws);
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});
