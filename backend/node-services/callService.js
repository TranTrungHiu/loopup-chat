const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const apiKey = "pvjq2vc7dh9j"; // Thay bằng API key của bạn
const apiSecret = "89ebp3ns4w2pff2h3pygs47fmjgp8wnns5wxjkf4mpkcw7jgtb85m3qavj5phzmh"; // Thay bằng API secret của bạn

app.post("/api/stream/token", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    iat: now - 10, 
    exp: now + 60 * 60,
  };
  const token = jwt.sign(payload, apiSecret, { algorithm: "HS256", keyid: apiKey });
  res.json({ token });
});

app.listen(8081, () => console.log("Video token server running on 8081"));