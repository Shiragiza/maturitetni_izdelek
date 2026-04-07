const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email je obvezen' });
    }

    const [users] = await pool.query(
      'SELECT id, first_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.json({ message: 'Če ta email obstaja v sistemu, boste prejeli navodila za ponastavitev gesla.' });
    }

    const user = users[0];
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/pozabljeno-geslo.html?token=${resetToken}`;

    const mailOptions = {
      from: '"Brivska Akademija" <' + process.env.SMTP_USER + '>',
      to: email,
      subject: 'Ponastavitev gesla - Brivska Akademija',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Pozdravljeni ${user.first_name}!</h2>
          <p>Prejeli smo zahtevo za ponastavitev gesla za vaš račun.</p>
          <p>Kliknite na spodnjo povezavo za ponastavitev gesla:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: : 20px4px; margin 0;">Ponastavi geslo</a>
          <p>Povezava poteče čez 15 minut.</p>
          <p>Če niste zahtevali ponastavitve gesla, lahko to sporočilo prezrete.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Brivska Akademija</p>
        </div>
      `
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Email not configured. Token:', resetToken);
      return res.status(500).json({ error: 'Email sistem ni konfiguriran. Prosimo, nastavite SMTP nastavitve v .env datoteki.' });
    }

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Če ta email obstaja v sistemu, boste prejeli navodila za ponastavitev gesla.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Napaka pri zahtevi za ponastavitev gesla' });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token je obvezen' });
    }

    const [resets] = await pool.query(
      'SELECT pr.*, u.email, u.first_name FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Neveljaven ali potečen token' });
    }

    res.json({ valid: true, userId: resets[0].user_id });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Napaka pri preverjanju tokena' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token in novo geslo sta obvezna' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Geslo mora imeti vsaj 6 znakov' });
    }

    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Neveljaven ali potečen token' });
    }

    const reset = resets[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, reset.user_id]
    );

    await pool.query(
      'UPDATE password_resets SET used = TRUE WHERE id = ?',
      [reset.id]
    );

    res.json({ message: 'Geslo je bilo uspešno ponastavljeno' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Napaka pri ponastavitvi gesla' });
  }
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
