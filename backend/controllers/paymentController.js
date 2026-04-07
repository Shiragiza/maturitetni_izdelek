const Stripe = require('stripe');
const { pool } = require('../config/database');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Niste prijavljeni' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      console.error('Stripe keys not configured');
      return res.status(500).json({ error: 'Plačilni sistem ni konfiguriran. Prosimo, nastavite Stripe ključe v .env datoteki.' });
    }

    const [users] = await pool.query(
      'SELECT email, first_name FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    const user = users[0];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        }
      ],
      metadata: {
        user_id: req.session.userId.toString()
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success.html`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-cancel.html`
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error.message);
    res.status(500).json({ error: 'Napaka pri ustvarjanju plačila: ' + error.message });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;

    try {
      await pool.query(
        'UPDATE users SET has_access = TRUE WHERE id = ?',
        [userId]
      );

      await pool.query(
        'INSERT INTO payments (user_id, stripe_payment_id, stripe_customer_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, session.payment_intent, session.customer, session.amount_total / 100, session.currency, 'completed']
      );

      console.log(`Payment successful for user ${userId}`);
    } catch (error) {
      console.error('Error updating user access:', error);
    }
  }

  res.json({ received: true });
};

const getPaymentStatus = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Niste prijavljeni' });
    }

    const [users] = await pool.query(
      'SELECT has_access FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    res.json({ has_access: users[0].has_access });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju statusa' });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus
};
