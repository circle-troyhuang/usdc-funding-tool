require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const fundRoutes = require('./routes/fund');
const transferStatusRoutes = require('./routes/transferStatus');
const testConnectionRoutes = require('./routes/testConnection');
const dailyLimitRoutes = require('./routes/dailyLimit');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api/fund', fundRoutes);
app.use('/api/transfer-status', transferStatusRoutes);
app.use('/api/test-connection', testConnectionRoutes);
app.use('/api/daily-limit', dailyLimitRoutes);

// Config endpoint: tells frontend whether API key is required
app.get('/api/config', (req, res) => {
  res.json({ apiKeyRequired: !process.env.CIRCLE_API_KEY });
});

// Health check for App Runner
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React build in production
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API key mode: ${process.env.CIRCLE_API_KEY ? 'server-side (key configured)' : 'client-side (user provides key)'}`);
});
