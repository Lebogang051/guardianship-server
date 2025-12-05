// ============================================
// FILE: guardianship-server/server.js
// ============================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const alertRoutes = require('./routes/alertRoutes');
const userRoutes = require('./routes/userRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Middleware
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GuardianshipApp Backend is running' });
});

// Routes
app.use('/api', alertRoutes);
app.use('/api', userRoutes);
app.use('/api', broadcastRoutes);
app.use('/api', notificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ GuardianshipApp Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Alert endpoint: POST http://localhost:${PORT}/api/notify-alert`);
  console.log(`   Email notifications: POST http://localhost:${PORT}/api/send-alert-notifications`);
});