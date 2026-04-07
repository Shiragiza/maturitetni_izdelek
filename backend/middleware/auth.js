const { pool } = require('../config/database');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

const requireAccess = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT has_access FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    if (!users[0].has_access) {
      return res.status(403).json({ error: 'Access denied. Payment required.' });
    }

    req.session.hasAccess = true;
    await req.session.save();
    
    next();
  } catch (error) {
    console.error('requireAccess error:', error);
    return res.status(500).json({ error: 'Napaka pri preverjanju dostopa' });
  }
};

module.exports = { requireAuth, requireAdmin, requireAccess };
