const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

router.post('/register', [
  body('first_name').notEmpty().trim().escape(),
  body('last_name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  validate
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], authController.login);

router.post('/logout', authController.logout);

router.get('/me', requireAuth, authController.getCurrentUser);

router.get('/refresh', requireAuth, authController.refreshSession);

module.exports = router;
