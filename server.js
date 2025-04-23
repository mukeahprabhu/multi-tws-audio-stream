const WebSocket = require('ws');
const http = require('http');

// Use the port assigned by Render or fallback to 8080 locally
const PORT = process.env.PORT || 8080;

// Create HTTP server (Render will handle HTTPS automatically)
const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    console.log('Received:', message);

    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
