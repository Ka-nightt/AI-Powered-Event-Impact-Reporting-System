const pool = require('../config/db');

async function listSdgGoals() {
  const res = await pool.query(`SELECT id, name, color_hex FROM sdg_goals ORDER BY id ASC`);
  return res.rows;
}

async function getEventSdgs(eventId) {
  const res = await pool.query(
    `SELECT g.id, g.name, g.color_hex
     FROM event_sdg_map m JOIN sdg_goals g ON g.id = m.sdg_id
     WHERE m.event_id = $1 ORDER BY g.id ASC`,
    [eventId]
  );
  return res.rows;
}

/**
 * Replaces the full set of SDG tags for an event (idempotent set operation).
 * `sdgIds` should be an array of integers 1-17.
 */
async function setEventSdgs(eventId, sdgIds = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM event_sdg_map WHERE event_id = $1`, [eventId]);
    for (const sdgId of sdgIds) {
      await client.query(
        `INSERT INTO event_sdg_map (event_id, sdg_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, sdgId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getEventSdgs(eventId);
}

module.exports = { listSdgGoals, getEventSdgs, setEventSdgs };
