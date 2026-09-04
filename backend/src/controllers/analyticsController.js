const pool = require('../config/db');
const analyticsEngine = require('../services/analyticsEngine');

async function assertEventOwnership(eventId, userId) {
  const result = await pool.query(`SELECT id FROM events WHERE id = $1 AND user_id = $2`, [eventId, userId]);
  return result.rows.length > 0;
}

async function getEventAnalytics(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const analytics = await analyticsEngine.computeEventAnalytics(eventId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
}

async function getTrend(req, res, next) {
  try {
    const trend = await analyticsEngine.computeAttendanceTrend(req.userId);
    res.json(trend);
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const stats = await analyticsEngine.computeDashboardStats(req.userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getEventAnalytics, getTrend, getDashboard };
