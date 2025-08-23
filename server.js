const WebSocket = require("ws");
const http = require("http");

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

let rooms = {}; // { code: [sockets...] }

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "join") {
        const { code } = data;
        if (!rooms[code]) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid code" }));
          return;
        }
        ws.roomCode = code;
        rooms[code].push(ws);
        ws.send(JSON.stringify({ type: "joined", message: "Code accepted" }));
      }

      else if (data.type === "create") {
        const { code } = data;
        if (rooms[code]) {
          ws.send(JSON.stringify({ type: "error", message: "Code already exists" }));
          return;
        }
        rooms[code] = [];
        ws.roomCode = code;
        ws.isSender = true;
        ws.send(JSON.stringify({ type: "created", message: "Room created" }));
      }

      else if (data.type === "audio" && ws.isSender && ws.roomCode) {
        // broadcast audio to all in the room
        rooms[ws.roomCode].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "audio", chunk: data.chunk }));
          }
        });
      }

    } catch (err) {
      console.error("Message error:", err);
    }
  });

  ws.on("close", () => {
    if (ws.roomCode && rooms[ws.roomCode]) {
      rooms[ws.roomCode] = rooms[ws.roomCode].filter(c => c !== ws);
      if (rooms[ws.roomCode].length === 0 && ws.isSender) {
        delete rooms[ws.roomCode]; // remove room if sender left
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
