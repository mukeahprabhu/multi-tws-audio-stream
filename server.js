const WebSocket = require("ws");
const { spawn } = require("child_process");

const wss = new WebSocket.Server({ port: 10000 });

console.log("WebSocket server running on port 10000");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received chunk of size:", message.length); // ✅ Debug

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    checkAndRestartServer();
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

// Function to check if there are no clients connected
function checkAndRestartServer() {
  if (wss.clients.size === 0) {
    console.log("No active connections. Restarting server...");
    restartServer();
  }
}

// Function to restart the server
function restartServer() {
  wss.close(() => {
    console.log("Shutting down current server...");
    setTimeout(() => {
      console.log("Restarting WebSocket server...");
      // Restart the WebSocket server after a short delay
      startServer();
    }, 1000); // Delay before restart
  });
}

// Function to start the server again
function startServer() {
  const wss = new WebSocket.Server({ port: 10000 });
  console.log("WebSocket server running again on port 10000");
}
