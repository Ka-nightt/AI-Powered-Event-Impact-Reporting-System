const pool = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../services/authService');

function publicUser(user) {
  return { id: user.id, full_name: user.full_name, email: user.email, created_at: user.created_at };
}

async function register(req, res, next) {
  try {
    const { full_name, email, password, confirm_password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email, and password are required' });
    }
    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [full_name.trim(), email.toLowerCase().trim(), passwordHash]
    );
    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
