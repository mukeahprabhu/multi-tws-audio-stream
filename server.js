const WebSocket = require("ws");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  // FFmpeg process for capturing raw PCM audio
  const ffmpegProcess = spawn("ffmpeg", [
    "-f", "dshow", // Windows input format
    "-i", "audio=Stereo Mix (Realtek(R) Audio)", // Replace with actual stereo mix device
    "-c:a", "pcm_s16le", // Use raw PCM (16-bit signed little-endian)
    "-ar", "44100", // Sample rate (44.1kHz)
    "-ac", "2", // Stereo channels
    "-f", "s16le", // Output format: raw PCM
    "pipe:1" // Output to stdout (pipe)
  ]);

  // Handle audio data from FFmpeg
  ffmpegProcess.stdout.on("data", (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk); // Send raw PCM data to WebSocket clients
    }
  });

  // Handle FFmpeg errors
  ffmpegProcess.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  // On FFmpeg process close
  ffmpegProcess.on("close", (code, signal) => {
    console.log(`FFmpeg process exited with code ${code}, signal: ${signal}`);
  });

  // Handle WebSocket message (ping/pong)
  ws.on("message", (message) => {
    if (message === '{"ping":true}') {
      ws.send('{"pong":true}'); // Respond to ping
    }
  });

  // Handle WebSocket errors
  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });

  // Handle WebSocket close
  ws.on("close", () => {
    console.log("❌ A client disconnected");
  });
});
