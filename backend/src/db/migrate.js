require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running migration against', process.env.DATABASE_URL);
  try {
    await pool.query(sql);
    console.log('✅ Migration complete - schema and SDG seed data applied.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
