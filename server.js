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

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Routes
app.use('/api', notifyRoutes);
app.use('/api', userRoutes);
app.use('/api', reportRoutes);

// serve static if you want to host frontend from same server (optional)
// const path = require('path');
// app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`✅ GuardianshipApp Backend running on http://localhost:${PORT}`);
  if (process.env.SUPABASE_URL) console.log('Supabase URL present');
});
