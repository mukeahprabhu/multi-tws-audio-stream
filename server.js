const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.on("message", (message) => {
    console.log("🔊 Received message:", message);

    // Ensure that the message is a JSON string
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);  // Parse the incoming message if it's a valid JSON
    } catch (err) {
      console.error("Invalid JSON message received:", message);
      return;  // Exit early if the message is not valid JSON
    }

    // Broadcast the message to all clients except the sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Send the message as a stringified JSON
        client.send(JSON.stringify(parsedMessage)); 
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });
});
