const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });  // Using port 8080

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Send a test message to the client
  ws.send("Welcome to the WebSocket server!");

  // Simulate sending audio data every second (for testing purposes)
  setInterval(() => {
    const audioData = Buffer.from("audio data");  // Replace with actual audio stream data
    ws.send(audioData);
  }, 1000);

  ws.on("message", (message) => {
    console.log("Received message:", message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
