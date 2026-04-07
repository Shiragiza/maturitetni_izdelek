const paypal = require('@paypal/checkout-server-sdk');
const { pool } = require('../config/database');

function getPayPalClient() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    let environment;
    if (mode === 'production') {
        environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
        environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }
    return new paypal.core.PayPalHttpClient(environment);
}

const createPayPalOrder = async(req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Niste prijavljeni' });
        }

        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            return res.status(500).json({ error: 'PayPal ni konfiguriran. Prosimo, nastavite PayPal nastavitve v .env datoteki.' });
        }

        const [users] = await pool.query(
            'SELECT email, first_name FROM users WHERE id = ?', [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Uporabnik ne obstaja' });
        }

        const paypalClient = getPayPalClient();

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: '0.01'
                },
                description: 'Brivska Akademija - Dostop do video posnetkov',
                custom_id: req.session.userId.toString()
            }],
            application_context: {
                brand_name: 'Brivska Akademija',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success.html`,
                cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-cancel.html`
            }
        });

        const order = await paypalClient.execute(request);

        const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;

        res.json({ orderId: order.result.id, url: approvalUrl });
    } catch (error) {
        console.error('Create PayPal order error:', error);
        res.status(500).json({ error: 'Napaka pri ustvarjanju PayPal naročila' });
    }
};

const capturePayPalOrder = async(req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'ID naročila je obvezen' });
        }

        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            return res.status(500).json({ error: 'PayPal ni konfiguriran' });
        }

        const paypalClient = getPayPalClient();

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const capture = await paypalClient.execute(request);

        if (capture.result.status === 'COMPLETED') {
            const customId = capture.result.purchase_units[0].custom_id;
            const paymentId = capture.result.id;

            if (customId) {
                await pool.query(
                    'UPDATE users SET has_access = TRUE WHERE id = ?', [customId]
                );

                await pool.query(
                    'INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)',                 [customId, paymentId, 0.01, 'EUR', 'completed']
                );

                console.log(`PayPal payment successful for user ${customId}`);
            }

            res.json({ success: true, message: 'Plačilo uspešno' });
        } else {
            res.status(400).json({ error: 'Plačilo ni bilo uspešno' });
        }
    } catch (error) {
        console.error('Capture PayPal order error:', error);
        res.status(500).json({ error: 'Napaka pri potrditvi plačila' });
    }
};

module.exports = {
    createPayPalOrder,
    capturePayPalOrder
};