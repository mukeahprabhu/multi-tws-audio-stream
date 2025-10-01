const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// In-memory sessions
const sessions = {};

// Generate 6-digit code
function generateCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

// Sender generates code
app.post("/api/auth/generate", (req, res) => {
  const code = generateCode();
  sessions[code] = { createdAt: Date.now(), ttl: 5 * 60 * 1000 };
  console.log("🔑 Generated code:", code);
  res.json({ code });
});

// Client joins using code
app.post("/api/auth/join", (req, res) => {
  const { code } = req.body;
  const session = sessions[code];
  if (!session) return res.status(400).json({ ok: false, error: "Invalid code" });
  if (Date.now() - session.createdAt > session.ttl) {
    delete sessions[code];
    return res.status(400).json({ ok: false, error: "Code expired" });
  }
  res.json({ ok: true, message: "Code valid!" });
});

// Clean expired codes every minute
setInterval(() => {
  const now = Date.now();
  for (const code in sessions) {
    if (now - sessions[code].createdAt > sessions[code].ttl) delete sessions[code];
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`🔐 Auth server running on port ${PORT}`);
});
