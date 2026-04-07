const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, has_access, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju uporabnikov' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, has_access, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju uporabnika' });
  }
};

const createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, has_access, role } = req.body;

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email že obstaja' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, has_access, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, password_hash, has_access || false, role || 'user']
    );

    res.status(201).json({ message: 'Uporabnik ustvarjen', userId: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Napaka pri ustvarjanju uporabnika' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, has_access, role } = req.body;

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email že obstaja pri drugem uporabniku' });
    }

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, has_access = ?, role = ? WHERE id = ?',
      [first_name, last_name, email, phone, has_access, role, id]
    );

    res.json({ message: 'Uporabnik posodobljen' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Napaka pri posodabljanju uporabnika' });
  }
};

const updateUserAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { has_access } = req.body;

    await pool.query(
      'UPDATE users SET has_access = ? WHERE id = ?',
      [has_access, id]
    );

    res.json({ message: 'Dostop posodobljen' });
  } catch (error) {
    console.error('Update user access error:', error);
    res.status(500).json({ error: 'Napaka pri posodabljanju dostopa' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.session.userId) {
      return res.status(400).json({ error: 'Ne morete izbrisati sebe' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'Uporabnik izbrisan' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Napaka pri brisanju uporabnika' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserAccess,
  deleteUser
};
