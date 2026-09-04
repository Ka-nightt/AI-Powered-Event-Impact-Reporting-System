const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { readRows, mapAttendanceRow, mapSurveyRow, buildPreview } = require('../services/parseService');

const DATA_DIR = path.join(__dirname, '..', '..', 'uploads', 'data');

async function assertEventOwnership(eventId, userId) {
  const result = await pool.query(`SELECT id FROM events WHERE id = $1 AND user_id = $2`, [eventId, userId]);
  return result.rows.length > 0;
}

/**
 * Safely resolves a temp filename (as previously returned by a /preview call)
 * to a real path inside DATA_DIR, rejecting any path traversal attempt.
 */
function resolveTempFile(tempFile) {
  const safeName = path.basename(tempFile);
  const fullPath = path.join(DATA_DIR, safeName);
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}

// ---- Attendance ----

async function previewAttendance(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const rawRows = readRows(req.file.path);
    const mappedRows = rawRows.map(mapAttendanceRow);
    const preview = buildPreview(rawRows, mappedRows, 'attendance');

    res.json({ tempFile: path.basename(req.file.path), originalName: req.file.originalname, preview });
  } catch (err) {
    next(err);
  }
}

async function confirmAttendance(req, res, next) {
  try {
    const { eventId } = req.params;
    const { tempFile, originalName } = req.body;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });

    const filePath = resolveTempFile(tempFile);
    if (!filePath) return res.status(400).json({ error: 'Uploaded file has expired - please re-upload' });

    const rows = readRows(filePath).map(mapAttendanceRow);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        await client.query(
          `INSERT INTO attendance (event_id, full_name, gender, age_group, registered, attended, raw_row)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [eventId, row.full_name, row.gender, row.age_group, row.registered, row.attended, row.raw_row]
        );
      }
      await client.query(
        `INSERT INTO uploads (event_id, upload_type, filename, row_count, status)
         VALUES ($1, 'attendance', $2, $3, 'processed')`,
        [eventId, originalName || tempFile, rows.length]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      await pool.query(
        `INSERT INTO uploads (event_id, upload_type, filename, status, error_message)
         VALUES ($1, 'attendance', $2, 'failed', $3)`,
        [eventId, originalName || tempFile, err.message]
      );
      throw err;
    } finally {
      client.release();
      fs.unlink(filePath, () => {});
    }

    res.status(201).json({ success: true, rowsProcessed: rows.length });
  } catch (err) {
    next(err);
  }
}

// ---- Survey ----

async function previewSurvey(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const rawRows = readRows(req.file.path);
    const mappedRows = rawRows.map(mapSurveyRow);
    const preview = buildPreview(rawRows, mappedRows, 'survey');

    res.json({ tempFile: path.basename(req.file.path), originalName: req.file.originalname, preview });
  } catch (err) {
    next(err);
  }
}

async function confirmSurvey(req, res, next) {
  try {
    const { eventId } = req.params;
    const { tempFile, originalName } = req.body;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });

    const filePath = resolveTempFile(tempFile);
    if (!filePath) return res.status(400).json({ error: 'Uploaded file has expired - please re-upload' });

    const rows = readRows(filePath).map(mapSurveyRow);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        await client.query(
          `INSERT INTO survey_responses (event_id, satisfaction_score, feedback_text, raw_row)
           VALUES ($1,$2,$3,$4)`,
          [eventId, row.satisfaction_score, row.feedback_text, row.raw_row]
        );
      }
      await client.query(
        `INSERT INTO uploads (event_id, upload_type, filename, row_count, status)
         VALUES ($1, 'survey', $2, $3, 'processed')`,
        [eventId, originalName || tempFile, rows.length]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      await pool.query(
        `INSERT INTO uploads (event_id, upload_type, filename, status, error_message)
         VALUES ($1, 'survey', $2, 'failed', $3)`,
        [eventId, originalName || tempFile, err.message]
      );
      throw err;
    } finally {
      client.release();
      fs.unlink(filePath, () => {});
    }

    res.status(201).json({ success: true, rowsProcessed: rows.length });
  } catch (err) {
    next(err);
  }
}

async function listUploads(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    const result = await pool.query(
      `SELECT * FROM uploads WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { previewAttendance, confirmAttendance, previewSurvey, confirmSurvey, listUploads };
