const pool = require('../config/db');
const sdgService = require('../services/sdgService');
const { deriveStatus } = require('../services/analyticsEngine');

async function listEvents(req, res, next) {
  try {
    const { search } = req.query;
    const params = [req.userId];
    let whereClause = 'WHERE e.user_id = $1';
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND e.name ILIKE $${params.length}`;
    }

    const result = await pool.query(
      `
      SELECT e.*,
        COUNT(DISTINCT a.id)::int AS participant_count,
        COUNT(DISTINCT r.id)::int AS report_count
      FROM events e
      LEFT JOIN attendance a ON a.event_id = e.id
      LEFT JOIN reports r ON r.event_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.event_date DESC
      `,
      params
    );

    const events = result.rows.map((e) => ({
      ...e,
      participantCount: e.participant_count,
      status: deriveStatus({ attendanceCount: e.participant_count, reportCount: e.report_count }),
    }));

    for (const event of events) {
      event.sdgs = await sdgService.getEventSdgs(event.id);
    }
    res.json(events);
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM events WHERE id = $1 AND user_id = $2`, [id, req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    const event = result.rows[0];
    event.sdgs = await sdgService.getEventSdgs(id);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const { name, event_date, location, organizer, description, sdgIds } = req.body;
    if (!name || !event_date) {
      return res.status(400).json({ error: 'name and event_date are required' });
    }
    const result = await pool.query(
      `INSERT INTO events (user_id, name, event_date, location, organizer, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, name, event_date, location || null, organizer || null, description || null]
    );
    const event = result.rows[0];
    if (Array.isArray(sdgIds) && sdgIds.length) {
      event.sdgs = await sdgService.setEventSdgs(event.id, sdgIds);
    } else {
      event.sdgs = [];
    }
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, event_date, location, organizer, description, sdgIds } = req.body;
    const result = await pool.query(
      `UPDATE events SET
         name = COALESCE($1, name),
         event_date = COALESCE($2, event_date),
         location = COALESCE($3, location),
         organizer = COALESCE($4, organizer),
         description = COALESCE($5, description),
         updated_at = now()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, event_date, location, organizer, description, id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    const event = result.rows[0];
    if (Array.isArray(sdgIds)) {
      event.sdgs = await sdgService.setEventSdgs(id, sdgIds);
    } else {
      event.sdgs = await sdgService.getEventSdgs(id);
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id`, [id, req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
