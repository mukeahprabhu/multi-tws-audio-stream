const WebSocket = require("ws");
const { spawn } = require("child_process");

// Bind WebSocket server to 0.0.0.0 to accept external connections
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });
console.log("WebSocket server running on ws://0.0.0.0:8080");

wss.on("connection", (ws) => {
  console.log("Client connected");

  const ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",
    "-i", "audio=Stereo Mix (Realtek(R) Audio)", // Ensure correct input device
    "-f", "webm",
    "-acodec", "libvorbis",
    "-ar", "44100",
    "-ac", "2",
    "-"
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  ffmpeg.stdout.on("data", (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    ffmpeg.kill("SIGINT");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    ffmpeg.kill("SIGINT");
  });
});
