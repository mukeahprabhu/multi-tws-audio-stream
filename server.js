const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

// SSL certificate for HTTPS
const server = https.createServer({
  key: fs.readFileSync('path/to/your/private-key.pem'),
  cert: fs.readFileSync('path/to/your/certificate.pem'),
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Your server should listen to HTTPS port (e.g., 443 or 10000 if you prefer a custom port)
server.listen(10000, () => {
  console.log('WebSocket server running on wss://your-server-url:10000');
});
