const WebSocket = require("ws");
const { spawn } = require("child_process");

const socket = new WebSocket("wss://multi-tws-audio-backend.onrender.com");
let ffmpeg;

socket.on("open", () => {
  console.log("✅ Connected to server from sender");

  ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",                               // Input format (DirectShow for Windows)
    "-i", "audio=Stereo Mix (Realtek(R) Audio)", // 🎙 Adjust based on your input device
    "-ac", "1",                                  // Mono audio for bandwidth efficiency
    "-ar", "44100",                              // Sample rate: 44.1kHz (standard for audio)
    "-c:a", "aac",                               // Use AAC codec for audio
    "-b:a", "256k",                              // Bitrate: 256 kbps (balanced quality)
    "-f", "adts",                                // Output format: ADTS (for AAC raw stream)
    "-"                                          // Output to stdout (pipe)
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error("⚠ FFmpeg error:", data.toString());
  });

  ffmpeg.stdout.on("data", (chunk) => {
    if (socket.readyState === WebSocket.OPEN) {
      console.log("📤 Sending audio chunk of size:", chunk.length);
      socket.send(chunk); // Send audio chunk over WebSocket
    }
  });
});

socket.on("close", () => {
  console.log("❌ Sender disconnected from server");
  if (ffmpeg) ffmpeg.kill("SIGINT");
});

socket.on("error", (err) => {
  console.error("❌ WebSocket sender error:", err);
  if (ffmpeg) ffmpeg.kill("SIGINT");
});
