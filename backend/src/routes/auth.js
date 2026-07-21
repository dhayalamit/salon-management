const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, staffId: user.staff_id, name: user.name },
    process.env.JWT_SECRET || 'salon_secret_key_prod_2026_x89a',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register  (admin only — creates admin or staff logins)
router.post('/register', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, staffId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, staff_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, staff_id`,
      [name, email.toLowerCase(), hash, role || 'staff', staffId || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, staff_id FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(rows[0]);
});

module.exports = router;
