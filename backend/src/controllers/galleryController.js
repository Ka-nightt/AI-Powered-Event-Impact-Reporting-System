const pool = require('../config/db');
const fs = require('fs');

async function assertEventOwnership(eventId, userId) {
  const result = await pool.query(`SELECT id FROM events WHERE id = $1 AND user_id = $2`, [eventId, userId]);
  return result.rows.length > 0;
}

async function uploadPhotos(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No photos uploaded' });

    const captions = Array.isArray(req.body.captions) ? req.body.captions : [];
    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await pool.query(
        `INSERT INTO photos (event_id, file_path, caption) VALUES ($1,$2,$3) RETURNING *`,
        [eventId, file.path, captions[i] || null]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
}

async function listPhotos(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    const result = await pool.query(`SELECT * FROM photos WHERE event_id = $1 ORDER BY created_at DESC`, [eventId]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function deletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.* FROM photos p JOIN events e ON e.id = p.event_id WHERE p.id = $1 AND e.user_id = $2`,
      [id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Photo not found' });
    const photo = result.rows[0];
    await pool.query(`DELETE FROM photos WHERE id = $1`, [id]);
    if (fs.existsSync(photo.file_path)) fs.unlinkSync(photo.file_path);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhotos, listPhotos, deletePhoto };
