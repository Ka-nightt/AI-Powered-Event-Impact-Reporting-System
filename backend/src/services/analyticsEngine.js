const pool = require('../config/db');

const AGE_LABELS = {
  under_18: 'Under 18',
  '18_24': '18–24',
  '25_34': '25–34',
  '35_44': '35–44',
  '45_54': '45–54',
  '55_plus': '55+',
};

/**
 * Computes the full analytics payload for a single event:
 * gender split, age group split, attendance rate, and survey satisfaction
 * summary. Shaped to be consumed directly by Chart.js on the frontend.
 */
async function computeEventAnalytics(eventId) {
  const attendanceRes = await pool.query(
    `SELECT gender, age_group, registered, attended FROM attendance WHERE event_id = $1`,
    [eventId]
  );
  const surveyRes = await pool.query(
    `SELECT satisfaction_score FROM survey_responses WHERE event_id = $1`,
    [eventId]
  );

  const rows = attendanceRes.rows;
  const totalRegistered = rows.length;
  const totalAttended = rows.filter((r) => r.attended).length;
  const totalAbsent = totalRegistered - totalAttended;

  const genderCounts = { male: 0, female: 0, other: 0, prefer_not_to_say: 0 };
  const ageCounts = Object.fromEntries(Object.keys(AGE_LABELS).map((k) => [k, 0]));

  for (const row of rows) {
    if (genderCounts[row.gender] !== undefined) genderCounts[row.gender] += 1;
    if (row.age_group && ageCounts[row.age_group] !== undefined) ageCounts[row.age_group] += 1;
  }

  const attendanceRate = totalRegistered > 0 ? Number(((totalAttended / totalRegistered) * 100).toFixed(1)) : 0;

  const scoredResponses = surveyRes.rows.filter((r) => r.satisfaction_score !== null);
  const scores = scoredResponses.map((r) => Number(r.satisfaction_score)).filter((n) => !Number.isNaN(n));
  const avgSatisfaction = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;

  // Response rate: how many survey responses came in relative to registered attendees.
  // If there's no attendance sheet at all, we can't compute a rate against it.
  const responseRate = totalRegistered > 0 ? Number(((surveyRes.rows.length / totalRegistered) * 100).toFixed(1)) : null;

  return {
    totals: {
      registered: totalRegistered,
      attended: totalAttended,
      absent: totalAbsent,
      attendanceRate,
      surveyResponses: surveyRes.rows.length,
      responseRate,
      avgSatisfaction,
    },
    genderBreakdown: {
      labels: ['Male', 'Female', 'Other', 'Prefer not to say'],
      data: [genderCounts.male, genderCounts.female, genderCounts.other, genderCounts.prefer_not_to_say],
    },
    ageBreakdown: {
      labels: Object.values(AGE_LABELS),
      data: Object.keys(AGE_LABELS).map((k) => ageCounts[k]),
    },
  };
}

/**
 * Trend data across a user's events - attendance rate and participant counts
 * over time - used for the dashboard trend chart.
 */
async function computeAttendanceTrend(userId) {
  const res = await pool.query(
    `
    SELECT e.id, e.name, e.event_date,
      COUNT(a.id) FILTER (WHERE a.id IS NOT NULL) AS registered,
      COUNT(a.id) FILTER (WHERE a.attended) AS attended
    FROM events e
    LEFT JOIN attendance a ON a.event_id = e.id
    WHERE e.user_id = $1
    GROUP BY e.id, e.name, e.event_date
    ORDER BY e.event_date ASC
  `,
    [userId]
  );

  return {
    labels: res.rows.map((r) => r.name),
    registered: res.rows.map((r) => Number(r.registered)),
    attended: res.rows.map((r) => Number(r.attended)),
  };
}

/**
 * Derives a simple status for an event based on what's been done with it:
 * 'pending'      - no attendance data uploaded yet
 * 'analyzed'     - attendance data exists, no report generated yet
 * 'report_ready' - at least one report has been generated
 */
function deriveStatus({ attendanceCount, reportCount }) {
  if (reportCount > 0) return 'report_ready';
  if (attendanceCount > 0) return 'analyzed';
  return 'pending';
}

/**
 * Aggregate stats for the dashboard, scoped to one user: total events,
 * total participants, reports generated, recent events (with status), and
 * recent activity feed.
 */
async function computeDashboardStats(userId) {
  const [events, participants, reports, recentEvents, recentActivity] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM events WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM attendance a JOIN events e ON e.id = a.event_id WHERE e.user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM reports r JOIN events e ON e.id = r.event_id WHERE e.user_id = $1`,
      [userId]
    ),
    pool.query(
      `
      SELECT e.id, e.name, e.event_date,
        COUNT(DISTINCT a.id)::int AS participant_count,
        COUNT(DISTINCT r.id)::int AS report_count
      FROM events e
      LEFT JOIN attendance a ON a.event_id = e.id
      LEFT JOIN reports r ON r.event_id = e.id
      WHERE e.user_id = $1
      GROUP BY e.id, e.name, e.event_date
      ORDER BY e.event_date DESC
      LIMIT 6
    `,
      [userId]
    ),
    pool.query(
      `
      SELECT 'upload' AS type, u.upload_type AS detail, u.filename, u.created_at, e.name AS event_name
      FROM uploads u JOIN events e ON e.id = u.event_id
      WHERE e.user_id = $1
      UNION ALL
      SELECT 'report' AS type, NULL AS detail, r.file_path AS filename, r.generated_at AS created_at, e.name AS event_name
      FROM reports r JOIN events e ON e.id = r.event_id
      WHERE e.user_id = $1
      UNION ALL
      SELECT 'event' AS type, NULL AS detail, e.name AS filename, e.created_at, e.name AS event_name
      FROM events e
      WHERE e.user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `,
      [userId]
    ),
  ]);

  return {
    totalEvents: events.rows[0].count,
    totalParticipants: participants.rows[0].count,
    reportsGenerated: reports.rows[0].count,
    recentEvents: recentEvents.rows.map((e) => ({
      id: e.id,
      name: e.name,
      event_date: e.event_date,
      participantCount: e.participant_count,
      status: deriveStatus({ attendanceCount: e.participant_count, reportCount: e.report_count }),
    })),
    recentActivity: recentActivity.rows,
  };
}

module.exports = { computeEventAnalytics, computeAttendanceTrend, computeDashboardStats, deriveStatus, AGE_LABELS };
