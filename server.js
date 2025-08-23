// server.js
const WebSocket = require("ws");
const http = require("http");
const url = require("url");

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = "mysecret123"; // <-- your token

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket upgrade
server.on("upgrade", (req, socket, head) => {
  const query = url.parse(req.url, true).query;
  const token = query.token;

  if (token !== SECRET_TOKEN) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// Store clients
let clients = new Set();

// On new connection
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Client connected. Total:", clients.size);

  ws.on("message", (message) => {
    // Forward audio chunks to everyone else
    for (let client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected. Total:", clients.size);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
