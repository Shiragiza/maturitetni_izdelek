require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDatabase, pool } = require('./config/database');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const videoRoutes = require('./routes/videos');
const forgotPasswordRoutes = require('./routes/forgotPassword');
const appointmentsRoutes = require('./routes/appointments');
const barbersRoutes = require('./routes/barbers');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, '..')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/barbers', barbersRoutes);

app.get('/api/check-access', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ hasAccess: false, authenticated: false });
  }

  try {
    const [users] = await pool.query(
      'SELECT has_access FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.json({ hasAccess: false, authenticated: false });
    }

    const hasAccess = users[0].has_access === 1;
    req.session.hasAccess = hasAccess;
    await req.session.save();

    res.json({ hasAccess, authenticated: true });
  } catch (error) {
    console.error('Check access error:', error);
    res.json({ hasAccess: false, authenticated: false });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', req.path));
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
