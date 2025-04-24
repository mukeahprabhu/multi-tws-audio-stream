const WebSocket = require("ws");
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Store clients in a session-based manner
let sessions = {};

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  // When a new client connects, send them a welcome message
  ws.send(JSON.stringify({ type: "welcome", message: "Welcome to the WebSocket server!" }));

  ws.on("message", (message) => {
    try {
      // Parse the incoming message to identify if it's a session ID or audio chunk
      const data = JSON.parse(message);
      
      if (data.type === "session") {
        // Handle the session creation
        const sessionId = data.sessionId;
        
        if (!sessions[sessionId]) {
          sessions[sessionId] = { sender: ws, receivers: [] };
          console.log(`🆕 New session created with ID: ${sessionId}`);
        }
        
        // Add the receiver to the session
        else {
          sessions[sessionId].receivers.push(ws);
          console.log(`🔌 Client joined session: ${sessionId}`);
        }

        // Confirm to the client that they've joined or created a session
        ws.send(JSON.stringify({ type: "session-joined", sessionId }));
      } 
      else if (data.type === "audio") {
        // Handle the audio chunk from the sender
        const sessionId = data.sessionId;
        const audioChunk = data.audioChunk; // The actual audio data

        console.log("🔊 Received audio chunk, broadcasting to session:", sessionId);

        if (sessions[sessionId]) {
          // Send the audio chunk to all receivers in the session
          sessions[sessionId].receivers.forEach((receiver) => {
            if (receiver.readyState === WebSocket.OPEN) {
              receiver.send(JSON.stringify({ type: "audio", audioChunk }));
            }
          });
        }
      }
    } catch (err) {
      console.error("⚠️ Error handling message:", err);
    }
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");

    // Clean up sessions if needed
    Object.keys(sessions).forEach((sessionId) => {
      sessions[sessionId].receivers = sessions[sessionId].receivers.filter(client => client !== ws);
      if (sessions[sessionId].sender === ws) {
        delete sessions[sessionId]; // Remove session if sender disconnected
      }
    });
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});

