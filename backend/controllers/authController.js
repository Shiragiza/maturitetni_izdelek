const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email že obstaja' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, has_access) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, password_hash, false]
    );

    res.status(201).json({ message: 'Registracija uspešna', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Napaka pri registraciji' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash, has_access, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Neveljaven email ali geslo' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Neveljaven email ali geslo' });
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.hasAccess = user.has_access;
    req.session.firstName = user.first_name;

    await req.session.save();

    res.json({
      message: 'Prijava uspešna',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        has_access: user.has_access,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Napaka pri prijavi' });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Napaka pri odjavi' });
    }
    res.json({ message: 'Odjava uspešna' });
  });
};

const refreshSession = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niste prijavljeni' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, has_access, role, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    const user = users[0];
    req.session.hasAccess = user.has_access;
    await req.session.save();

    res.json({ user });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({ error: 'Napaka pri osveževanju podatkov' });
  }
};

const getCurrentUser = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Niste prijavljeni' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, has_access, role, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju podatkov' });
  }
};

module.exports = { register, login, logout, getCurrentUser, refreshSession };
