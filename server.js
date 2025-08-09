const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// sessions: code -> { sender: ws, clients: Set(ws) }
const sessions = {};

wss.on("connection", (ws) => {
  console.log("🔌 New connection");
  ws.role = null;
  ws.sessionCode = null;

  ws.on("message", (message) => {
    // Text messages (JSON): registration / join
    if (typeof message === "string") {
      let data;
      try {
        data = JSON.parse(message);
      } catch (e) {
        console.warn("Invalid JSON message from client");
        return;
      }

      // Sender registers a session
      if (data.type === "register_sender" && /^\d{6}$/.test(data.code)) {
        const code = data.code;

        // If a previous sender existed for this code, close previous session (clean)
        if (sessions[code] && sessions[code].sender && sessions[code].sender !== ws) {
          try { sessions[code].sender.close(); } catch(e) {}
          sessions[code].clients.forEach(c => { try { c.close(); } catch(e){} });
          delete sessions[code];
        }

        sessions[code] = { sender: ws, clients: new Set() };
        ws.role = "sender";
        ws.sessionCode = code;
        ws.send(JSON.stringify({ type: "registered", code }));
        console.log(`🎤 Sender registered for code ${code}`);
        return;
      }

      // Client tries to join a session
      if (data.type === "join" && /^\d{6}$/.test(data.code)) {
        const code = data.code;
        const session = sessions[code];
        if (session && session.sender) {
          session.clients.add(ws);
          ws.role = "client";
          ws.sessionCode = code;
          ws.send(JSON.stringify({ type: "joined", code }));
          console.log(`🎧 Client joined session ${code} (clients=${session.clients.size})`);
        } else {
          // Send explicit error so client can alert and stop
          ws.send(JSON.stringify({ type: "error", message: "Invalid code or no active sender" }));
          console.log(`⚠ Client attempted to join invalid code ${code}`);
        }
        return;
      }

      // Ignore other JSON/text messages
      return;
    }

    // Binary message (audio chunk). Only forward if sender and session exists.
    if (ws.role === "sender" && ws.sessionCode) {
      const sess = sessions[ws.sessionCode];
      if (!sess) return;
      // Forward raw chunk to all clients in the same session
      sess.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      // Optional debug log (comment out if noisy)
      // console.log(`Forwarded audio chunk (${message.length}) to ${sess.clients.size} clients`);
    } else {
      // If some client sent binary (shouldn't happen), ignore
    }
  });

  ws.on("close", () => {
    if (ws.role === "sender" && ws.sessionCode) {
      const code = ws.sessionCode;
      const sess = sessions[code];
      if (sess) {
        // notify and close clients
        sess.clients.forEach((c) => {
          try { c.send(JSON.stringify({ type: "ended" })); } catch(e){}
          try { c.close(); } catch(e){}
        });
        delete sessions[code];
        console.log(`❌ Sender disconnected, closed session ${code}`);
      }
    } else if (ws.role === "client" && ws.sessionCode) {
      const code = ws.sessionCode;
      const sess = sessions[code];
      if (sess) {
        sess.clients.delete(ws);
        console.log(`👋 Client left session ${code} (remaining=${sess.clients.size})`);
        if (sess.clients.size === 0 && (!sess.sender || sess.sender.readyState !== WebSocket.OPEN)) {
          delete sessions[code];
        }
      }
    } else {
      console.log("🔌 Connection closed");
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});
