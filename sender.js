const WebSocket = require("ws");
const { spawn } = require("child_process");

const socket = new WebSocket("wss://multi-tws-audio-backend.onrender.com");

let ffmpeg;

socket.on("open", () => {
  console.log("✅ Connected to server from sender");

  ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",
    "-i", "audio=Stereo Mix (Realtek(R) Audio)", // 🔧 Update based on device
    "-ac", "1",
    "-ar", "44100",
    "-c:a", "libmp3lame",
    "-compression_level", "0",
    "-q:a", "2",
    "-b:a", "192k",
    "-bufsize", "192k",
    "-f", "mp3",
    "-"
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error("⚠️ FFmpeg error:", data.toString());
  });

  ffmpeg.stdout.on("data", (chunk) => {
    if (socket.readyState === WebSocket.OPEN) {
      console.log("📤 Sending audio chunk of size:", chunk.length);
      socket.send(chunk);
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
