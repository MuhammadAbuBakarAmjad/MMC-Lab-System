// Express server entry point
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check — used to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors',  require('./routes/doctors'));

// TODO: mount as phases are completed
// app.use('/api/templates', require('./routes/templates'));
// app.use('/api/reports',   require('./routes/reports'));
// app.use('/api/settings',  require('./routes/settings'));
// app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(PORT, () => {
  console.log(`Lab system server running on http://localhost:${PORT}`);
});
