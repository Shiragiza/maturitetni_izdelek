const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { validate } = require('../middleware/validation');
const { requireAdmin, requireAccess, requireAuth } = require('../middleware/auth');
const { pool } = require('../config/database');

const requireAccessAsync = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT has_access FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    if (!users[0].has_access) {
      return res.status(403).json({ error: 'Access denied. Payment required.' });
    }

    next();
  } catch (error) {
    console.error('requireAccessAsync error:', error);
    return res.status(500).json({ error: 'Napaka pri preverjanju dostopa' });
  }
};

router.get('/', requireAdmin, videoController.getAllVideos);
router.get('/public', requireAuth, videoController.getAllVideos);
router.get('/:id', requireAdmin, videoController.getVideoById);

router.post('/', requireAdmin, [
  body('title').notEmpty().trim().escape(),
  body('video_url').notEmpty().trim(),
  body('description').optional().trim(),
  body('thumbnail_url').optional().trim(),
  validate
], videoController.createVideo);

router.put('/:id', requireAdmin, [
  body('title').notEmpty().trim().escape(),
  body('video_url').notEmpty().trim(),
  body('description').optional().trim(),
  body('thumbnail_url').optional().trim(),
  validate
], videoController.updateVideo);

router.delete('/:id', requireAdmin, videoController.deleteVideo);

module.exports = router;
