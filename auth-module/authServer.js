const WebSocket = require("ws");
const { spawn } = require("child_process");

const AUTH_SERVER = "https://multi-tws-audio-stream.onrender.com";
const WS_SERVER = "wss://multi-tws-audio-backend.onrender.com"; // your main audio backend

let ffmpeg;

// Fetch OTP from Auth server
async function getOtp() {
  const response = await fetch(${AUTH_SERVER}/api/auth/generate, { method: "POST" });
  const data = await response.json();
  console.log("🔑 OTP generated for this session:", data.code);
  return data.code;
}

async function start() {
  try {
    const code = await getOtp();

    const socket = new WebSocket(WS_SERVER);

    socket.on("open", () => {
      console.log("✅ Connected to server from sender");

      // Send registration with OTP
      socket.send(JSON.stringify({ type: "register_sender", code }));

      ffmpeg = spawn("ffmpeg", [
        "-f", "dshow",
        "-i", "audio=Stereo Mix (Realtek(R) Audio)", // 🎙 adjust device name if needed
        "-ac", "1",
        "-ar", "44100",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "adts",
        "-"
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.error("⚠ FFmpeg error:", data.toString());
      });

      ffmpeg.stdout.on("data", (chunk) => {
        if (socket.readyState === WebSocket.OPEN) {
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

  } catch (err) {
    console.error("❌ Sender startup failed:", err);
  }
}

start();
