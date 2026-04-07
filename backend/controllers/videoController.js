const { pool } = require('../config/database');

const getAllVideos = async (req, res) => {
  try {
    const [videos] = await pool.query(
      'SELECT * FROM videos ORDER BY created_at DESC'
    );
    res.json({ videos });
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju videov' });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [videos] = await pool.query(
      'SELECT * FROM videos WHERE id = ?',
      [id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video ne obstaja' });
    }

    res.json({ video: videos[0] });
  } catch (error) {
    console.error('Get video by id error:', error);
    res.status(500).json({ error: 'Napaka pri pridobivanju videa' });
  }
};

const createVideo = async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({ error: 'Naslov in video URL sta obvezna' });
    }

    const [result] = await pool.query(
      'INSERT INTO videos (title, description, video_url, thumbnail_url) VALUES (?, ?, ?, ?)',
      [title, description || '', video_url, thumbnail_url || '']
    );

    res.status(201).json({ message: 'Video ustvarjen', videoId: result.insertId });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Napaka pri ustvarjanju videa' });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, video_url, thumbnail_url } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({ error: 'Naslov in video URL sta obvezna' });
    }

    await pool.query(
      'UPDATE videos SET title = ?, description = ?, video_url = ?, thumbnail_url = ? WHERE id = ?',
      [title, description || '', video_url, thumbnail_url || '', id]
    );

    res.json({ message: 'Video posodobljen' });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Napaka pri posodabljanju videa' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM videos WHERE id = ?', [id]);

    res.json({ message: 'Video izbrisan' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Napaka pri brisanju videa' });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo
};
