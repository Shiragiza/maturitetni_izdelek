const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paypalController = require('../controllers/paypalController');
const { requireAuth } = require('../middleware/auth');

router.post('/create-checkout-session', requireAuth, paymentController.createCheckoutSession);
router.get('/status', requireAuth, paymentController.getPaymentStatus);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

router.post('/paypal/create-order', requireAuth, paypalController.createPayPalOrder);
router.post('/paypal/capture-order', requireAuth, paypalController.capturePayPalOrder);

module.exports = router;
