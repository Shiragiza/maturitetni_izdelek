const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { pool } = require('../config/database');
const adminController = require('../controllers/adminController');
const appointmentsController = require('../controllers/appointments');
const { validate } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');

router.get('/users', requireAdmin, adminController.getAllUsers);
router.get('/users/:id', requireAdmin, adminController.getUserById);

router.post('/users', requireAdmin, [
  body('first_name').notEmpty().trim().escape(),
  body('last_name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['user', 'admin']),
  validate
], adminController.createUser);

router.put('/users/:id', requireAdmin, [
  body('first_name').notEmpty().trim().escape(),
  body('last_name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('role').optional().isIn(['user', 'admin']),
  validate
], adminController.updateUser);

router.patch('/users/:id/access', requireAdmin, [
  body('has_access').isBoolean(),
  validate
], adminController.updateUserAccess);

router.delete('/users/:id', requireAdmin, adminController.deleteUser);

router.get('/appointments', requireAdmin, appointmentsController.getAllAppointments);
router.patch('/appointments/:id/status', requireAdmin, appointmentsController.updateAppointmentStatus);
router.delete('/appointments/:id', requireAdmin, appointmentsController.deleteAppointmentAdmin);

router.get('/barbers', requireAdmin, async (req, res) => {
    try {
        const [barbers] = await pool.query('SELECT * FROM barbers ORDER BY name');
        res.json({ barbers });
    } catch (error) {
        console.error('Error fetching barbers:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju brivcev' });
    }
});

router.post('/barbers', requireAdmin, async (req, res) => {
    try {
        const { name, description, image_url, age, active } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Ime je obvezno' });
        }

        const [result] = await pool.query(
            'INSERT INTO barbers (name, description, image_url, age, active) VALUES (?, ?, ?, ?, ?)',
            [name, description || '', image_url || '', age || null, active !== false]
        );

        res.json({ success: true, message: 'Brivec dodan', id: result.insertId });
    } catch (error) {
        console.error('Error creating barber:', error);
        res.status(500).json({ error: 'Napaka pri dodajanju brivca' });
    }
});

router.put('/barbers/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image_url, age, active } = req.body;

        const [existing] = await pool.query('SELECT id FROM barbers WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Brivec ne obstaja' });
        }

        await pool.query(
            'UPDATE barbers SET name = ?, description = ?, image_url = ?, age = ?, active = ? WHERE id = ?',
            [name, description || '', image_url || '', age || null, active !== false, id]
        );

        res.json({ success: true, message: 'Brivec posodobljen' });
    } catch (error) {
        console.error('Error updating barber:', error);
        res.status(500).json({ error: 'Napaka pri posodobitvi brivca' });
    }
});

router.delete('/barbers/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM barbers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Brivec ne obstaja' });
        }

        res.json({ success: true, message: 'Brivec izbrisan' });
    } catch (error) {
        console.error('Error deleting barber:', error);
        res.status(500).json({ error: 'Napaka pri brisanju brivca' });
    }
});

module.exports = router;
