const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'I&D Hub Backend is running' });
});

// Ideas API — shared JSON-backed REST endpoints for A/B computer sync
app.use('/api/ideas', require('./routes/ideas'));

// AI proxy — server-side forwarding to AI providers (avoids browser CORS)
app.use('/api/ai', require('./routes/ai'));

// Start server
app.listen(PORT, () => {
  console.log(`I&D Hub Backend server running on port ${PORT}`);
});