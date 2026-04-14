const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [barbers] = await pool.query(
      'SELECT id, name, description, image_url, age, active FROM barbers ORDER BY name'
    );
    res.json({ barbers });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.json({ error: 'Napaka pri pridobivanju podatkov' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const [barbers] = await pool.query(
      'SELECT id, name, description, image_url, age, active FROM barbers ORDER BY name'
    );
    res.json({ barbers });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.json({ error: 'Napaka pri pridobivanju podatkov' });
  }
});

module.exports = router;