const express = require('express');
const cors = require('cors');
const { StreamVideoServerClient } = require('@stream-io/video-node-sdk');
const app = express();
app.use(express.json());
app.use(cors());

const apiKey = 'pvjq2vc7dh9j';
const apiSecret = '89ebp3ns4w2pff2h3pygs47fmjgp8wnns5wxjkf4mpkcw7jgtb85m3qavj5phzmh';
const client = new StreamVideoServerClient({ apiKey, apiSecret });

app.post('/api/stream/token', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const token = client.createToken(userId);
  res.json({ token });
});

app.listen(8081, () => {
  console.log('Stream token service running on port 8081');
});