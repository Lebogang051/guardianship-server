const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const notifyRoutes = require('./routes/notifyRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health Route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Combined Routes
app.use('/api', notifyRoutes, userRoutes, reportRoutes);

// Server Listener
app.listen(PORT, () => {
  console.log(`GuardianshipApp Backend running on port ${PORT}`);
  if (process.env.SUPABASE_URL) console.log("Supabase connected");
});
