const WebSocket = require("ws");
const { spawn } = require("child_process");

// Create a WebSocket server
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });
console.log("WebSocket server running on ws://0.0.0.0:8080");

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Launch FFmpeg to capture system audio (adjust input for your system)
  const ffmpeg = spawn("ffmpeg", [
    "-f", "dshow",           // for Windows, use dshow (DirectShow) for capturing system audio
    "-i", "audio=Stereo Mix (Realtek(R) Audio)",  // replace with the correct input device for your system
    "-f", "webm",            // output format (e.g., webm for WebSocket transport)
    "-acodec", "libvorbis",  // codec for audio
    "-ar", "44100",          // audio sample rate
    "-ac", "2",              // stereo audio
    "-"                      // stream to stdout
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  ffmpeg.stdout.on("data", (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);  // Send audio chunk over WebSocket
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    ffmpeg.kill("SIGINT");  // Stop FFmpeg when client disconnects
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    ffmpeg.kill("SIGINT");  // Stop FFmpeg on WebSocket error
  });
});
