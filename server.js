const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Set up the express app
const app = express();
const server = http.createServer(app);

// Set up the WebSocket server
const wss = new WebSocket.Server({ server });

// Log when a client connects
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Serve static files if necessary
app.use(express.static('public'));  // Update with the correct path if needed

// Make the server listen on the provided port
const port = process.env.PORT || 10000; // Use environment variable for cloud deployment
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});
