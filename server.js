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

app.get('/api/health', (req, res) => 
  res.json({ ok: true, time: new Date().toISOString() })
);

// THIS ONE LINE FIXES EVERYTHING
app.use('/api', notifyRoutes, userRoutes, reportRoutes);

app.listen(PORT, () => {
  console.log(\`GuardianshipApp Backend running on port \${PORT}\`);
  if (process.env.SUPABASE_URL) console.log('Supabase connected');
});
