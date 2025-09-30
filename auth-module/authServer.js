const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Store OTPs temporarily in memory (later we can shift to MongoDB if needed)
const activeOtps = new Map();

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// API: Generate new OTP
app.post("/api/auth/generate", (req, res) => {
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // valid for 5 min
  activeOtps.set(otp, expiresAt);

  console.log("🔑 OTP generated:", otp);
  res.json({ code: otp, expiresAt });
});

// API: Validate OTP
app.post("/api/auth/validate", (req, res) => {
  const { code } = req.body;
  const expiresAt = activeOtps.get(code);

  if (expiresAt && Date.now() < expiresAt) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// Default route for testing
app.get("/", (req, res) => {
  res.send("✅ Auth Server is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Auth server running on port ${PORT}`);
});
