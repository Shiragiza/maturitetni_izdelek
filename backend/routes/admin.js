const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
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

module.exports = router;
