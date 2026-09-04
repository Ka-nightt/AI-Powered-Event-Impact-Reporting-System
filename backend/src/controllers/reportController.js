const path = require('path');
const pool = require('../config/db');
const analyticsEngine = require('../services/analyticsEngine');
const sdgService = require('../services/sdgService');
const aiService = require('../services/aiService');
const { generateEventReportPdf } = require('../services/pdfService');

async function assertEventOwnership(eventId, userId) {
  const result = await pool.query(`SELECT * FROM events WHERE id = $1 AND user_id = $2`, [eventId, userId]);
  return result.rows[0] || null;
}

function fallbackInsights(errorMessage) {
  return {
    executiveSummary: `AI summary unavailable: ${errorMessage}`,
    attendanceAnalysis: '',
    surveyFindings: '',
    keyStrengths: [],
    areasOfConcern: [],
    recommendations: [],
    conclusion: '',
  };
}

async function generateReport(req, res, next) {
  try {
    const { eventId } = req.params;
    const event = await assertEventOwnership(eventId, req.userId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const [analytics, sdgs, photosRes] = await Promise.all([
      analyticsEngine.computeEventAnalytics(eventId),
      sdgService.getEventSdgs(eventId),
      pool.query(`SELECT * FROM photos WHERE event_id = $1 ORDER BY created_at ASC`, [eventId]),
    ]);

    let aiInsights;
    try {
      aiInsights = await aiService.generateEventInsights({ event, analytics, sdgs });
    } catch (err) {
      // Don't fail the whole report if the local AI model is unreachable -
      // fall back to a placeholder so the PDF still generates.
      aiInsights = fallbackInsights(err.message);
    }

    const filePath = await generateEventReportPdf({
      event,
      analytics,
      sdgs,
      aiInsights,
      photos: photosRes.rows,
    });

    const insertRes = await pool.query(
      `INSERT INTO reports (event_id, file_path, ai_summary, ai_recommendations, ai_sections)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        eventId,
        filePath,
        aiInsights.executiveSummary,
        (aiInsights.recommendations || []).join('\n'),
        JSON.stringify(aiInsights),
      ]
    );

    res.status(201).json({ report: insertRes.rows[0], downloadUrl: `/api/reports/download/${insertRes.rows[0].id}` });
  } catch (err) {
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!(await assertEventOwnership(eventId, req.userId))) return res.status(404).json({ error: 'Event not found' });
    const result = await pool.query(
      `SELECT * FROM reports WHERE event_id = $1 ORDER BY generated_at DESC`,
      [eventId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function downloadReport(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.* FROM reports r JOIN events e ON e.id = r.event_id WHERE r.id = $1 AND e.user_id = $2`,
      [id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
    const report = result.rows[0];
    res.download(path.resolve(report.file_path));
  } catch (err) {
    next(err);
  }
}

module.exports = { generateReport, listReports, downloadReport };
