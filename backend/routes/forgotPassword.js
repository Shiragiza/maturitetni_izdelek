const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPasswordController');
const { validate } = require('../middleware/validation');

router.post('/request', [
  body('email').isEmail().normalizeEmail(),
  validate
], forgotPasswordController.requestPasswordReset);

router.post('/verify', [
  body('token').notEmpty().trim(),
  validate
], forgotPasswordController.verifyResetToken);

router.post('/reset', [
  body('token').notEmpty().trim(),
  body('newPassword').isLength({ min: 6 }),
  validate
], forgotPasswordController.resetPassword);

module.exports = router;
