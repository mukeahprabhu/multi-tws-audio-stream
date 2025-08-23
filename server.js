// server.js
const WebSocket = require("ws");

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log("Server running on ws://localhost:8080");

// Temporary in-memory store for codes
// Example structure: { "123456": senderSocket }
const codes = {};

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Step 1: Sender generates a code and registers
      if (data.type === "register") {
        const { code } = data;
        codes[code] = ws; // Save sender socket against code
        ws.role = "sender";
        ws.code = code;
        console.log(`Sender registered with code: ${code}`);
        ws.send(JSON.stringify({ type: "registered", code }));
      }

      // Step 2: Receiver enters code to connect
      else if (data.type === "join") {
        const { code } = data;
        if (codes[code]) {
          const senderSocket = codes[code];
          ws.role = "receiver";
          ws.code = code;
          ws.sender = senderSocket;

          // Store receiver in sender
          if (!senderSocket.receivers) senderSocket.receivers = [];
          senderSocket.receivers.push(ws);

          console.log(`Receiver joined with code: ${code}`);
          ws.send(JSON.stringify({ type: "joined", success: true }));
        } else {
          console.log(`Invalid code attempt: ${code}`);
          ws.send(JSON.stringify({ type: "joined", success: false, error: "Invalid code" }));
        }
      }

      // Step 3: Audio data from sender → broadcast to receivers
      else if (data.type === "audio" && ws.role === "sender") {
        if (ws.receivers) {
          ws.receivers.forEach((receiver) => {
            if (receiver.readyState === WebSocket.OPEN) {
              receiver.send(JSON.stringify({ type: "audio", chunk: data.chunk }));
            }
          });
        }
      }

    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    // Cleanup if sender disconnects
    if (ws.role === "sender" && ws.code) {
      delete codes[ws.code];
      console.log(`Sender with code ${ws.code} removed`);
    }
  });
});

