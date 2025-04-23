const WebSocket = require('ws');

// Use the port provided by Render, or default to 10000 locally
const port = process.env.PORT || 10000;

const wss = new WebSocket.Server({ port }, () => {
  console.log(`✅ WebSocket server running on ws://localhost:${port}`);
});

wss.on('connection', (ws) => {
  console.log('📥 Client connected');

  ws.on('message', (message) => {
    console.log('📨 Received:', message);
    // Optional: Echo the message back
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});
