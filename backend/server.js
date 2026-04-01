const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const mentorRoutes  = require('./routes/mentors');
const sessionRoutes = require('./routes/sessions');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- MIDDLEWARE ----
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- API ROUTES ----
app.use('/api/auth',     authRoutes);
app.use('/api/mentors',  mentorRoutes);
app.use('/api/sessions', sessionRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);

// ---- SERVE FRONTEND ----
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);

// ---- CONNECT MONGODB + START ----
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected:', process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
