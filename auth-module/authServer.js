// server.js
const WebSocket = require("ws");
const { URL } = require("url");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket server running on port ${PORT}`);

// rooms: code -> { sender: WebSocket, receivers: Set<WebSocket>, createdAt }
const rooms = new Map();

// Helper to create room
function createRoom(code, senderWs) {
  const room = { sender: senderWs, receivers: new Set(), createdAt: Date.now() };
  rooms.set(code, room);
  return room;
}

// Helper to remove room
function removeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  // close receivers gently
  room.receivers.forEach((r) => {
    try { r.send(JSON.stringify({ type: "error", message: "Sender disconnected" })); } catch {}
    try { r.close(); } catch {}
  });
  // close sender if still open
  try { if (room.sender && room.sender.readyState === WebSocket.OPEN) room.sender.close(); } catch {}
  rooms.delete(code);
  console.log(`🗑️ Room ${code} removed`);
}

wss.on("connection", (ws, req) => {
  console.log("🔌 New WebSocket connection");
  ws.isSender = false;
  ws.roomCode = null;

  ws.on("message", (data, isBinary) => {
    // If binary data -> likely audio chunk from a registered sender
    if (isBinary || Buffer.isBuffer(data)) {
      if (ws.isSender && ws.roomCode) {
        const room = rooms.get(ws.roomCode);
        if (!room) return;
        // Forward raw binary to all receivers in the room
        room.receivers.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data, { binary: true });
          }
        });
      }
      // ignore binary from non-senders
      return;
    }

    // otherwise text JSON message
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      console.warn("Received non-JSON text message (ignored)");
      return;
    }

    // Handle registration messages
    if (msg.type === "register_sender" && msg.code) {
      const code = String(msg.code).trim();
      // If room exists for code, remove it first (keep single sender per code)
      if (rooms.has(code)) {
        console.log(`⚠️ Overwriting existing room for code ${code}`);
        removeRoom(code);
      }
      ws.isSender = true;
      ws.roomCode = code;
      createRoom(code, ws);
      console.log(`🎙️ Registered sender for code ${code}`);
      try { ws.send(JSON.stringify({ type: "registered", code })); } catch {}
      return;
    }

    if (msg.type === "register_client" && msg.code) {
      const code = String(msg.code).trim();
      const room = rooms.get(code);
      if (!room || !room.sender || room.sender.readyState !== WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: "error", message: "Invalid or expired code" })); } catch {}
        console.log(`❌ Client attempted invalid code ${code}`);
        // close client after slight delay so the client can read error
        setTimeout(() => { try { ws.close(); } catch {} }, 200);
        return;
      }
      // Attach client to room
      ws.isSender = false;
      ws.roomCode = code;
      room.receivers.add(ws);
      console.log(`👂 Client joined room ${code} (receivers=${room.receivers.size})`);
      try { ws.send(JSON.stringify({ type: "joined", code })); } catch {}
      return;
    }

    // Optional ping/pong or other messages
    if (msg.type === "ping") {
      try { ws.send(JSON.stringify({ type: "pong" })); } catch {}
      return;
    }

    // unknown message type
    console.log("ℹ️ Unknown message type:", msg.type);
  });

  ws.on("close", () => {
    console.log("🔌 Connection closed");
    // If sender disconnects, remove room and close receivers
    if (ws.isSender && ws.roomCode) {
      console.log(`❌ Sender for code ${ws.roomCode} disconnected`);
      removeRoom(ws.roomCode);
    } else if (!ws.isSender && ws.roomCode) {
      // remove receiver from room
      const room = rooms.get(ws.roomCode);
      if (room) {
        room.receivers.delete(ws);
        console.log(`👋 Receiver left room ${ws.roomCode} (remaining=${room.receivers.size})`);
      }
    }
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket error:", err);
  });
});

// Optional housekeeping: remove rooms older than X minutes if sender never connected properly
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    // if room has no sender open, remove (safety)
    if (!room.sender || room.sender.readyState !== WebSocket.OPEN) {
      removeRoom(code);
      continue;
    }
    // if room older than 6 hours, remove
    if (now - room.createdAt > 6 * 60 * 60 * 1000) {
      removeRoom(code);
    }
  }
}, 60 * 1000);
