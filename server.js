const WebSocket = require("ws");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  const ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",
    "-i", "audio=Stereo Mix (Realtek(R) Audio)", // Your actual input device
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
