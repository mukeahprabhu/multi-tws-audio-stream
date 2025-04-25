const WebSocket = require("ws");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🎧 WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  // FFmpeg for Linux using pulse or alsa (adjust input device if needed)
  const ffmpegProcess = spawn("ffmpeg", [
    "-f", "pulse", // Use 'alsa' if 'pulse' doesn't work
    "-i", "default", // Default system mic or audio output
    "-c:a", "pcm_s16le",
    "-ar", "44100",
    "-ac", "2",
    "-f", "s16le",
    "pipe:1"
  ]);

  ffmpegProcess.stdout.on("data", (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  ffmpegProcess.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  ffmpegProcess.on("close", (code, signal) => {
    console.log(`FFmpeg process exited with code ${code}, signal: ${signal}`);
  });

  ws.on("message", (message) => {
    if (message === '{"ping":true}') {
      ws.send('{"pong":true}');
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });

  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });
});
