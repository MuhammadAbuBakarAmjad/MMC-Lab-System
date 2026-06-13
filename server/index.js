// Express server entry point
const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check — used to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/patients',  require('./routes/patients'));
app.use('/api/doctors',   require('./routes/doctors'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// In production, serve the built React frontend from /client/dist.
// Run `npm run build` inside /client first, then start the server with NODE_ENV=production.
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  // Any route that is not an API call gets the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lab system server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Serving built frontend from /client/dist');
  }
});
