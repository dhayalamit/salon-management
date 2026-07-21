const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM settings WHERE id = 1');
    const settings = rows[0] || {
      id: 1,
      salon_name: 'TRIO THE POSH',
      tagline: 'Redefining Beauty & Elegance',
      logo_url: '/logo.png',
      address: 'Piprali Road, Near MBA Chai Wala, Sikar - 332001',
      phone: '+91 98765 43210',
      email: 'info@triotheposh.com',
      gst_number: 'GSTIN08AAACT1234F1Z5',
      default_gst_percent: 0,
    };
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', authenticate, async (req, res) => {
  try {
    const { salon_name, tagline, logo_url, address, phone, email, gst_number, default_gst_percent, business_hours } = req.body;
    await db.query(
      `UPDATE settings SET
         salon_name = $1,
         tagline = $2,
         logo_url = $3,
         address = $4,
         phone = $5,
         email = $6,
         gst_number = $7,
         default_gst_percent = $8,
         business_hours = $9
       WHERE id = 1`,
      [
        salon_name || 'TRIO THE POSH',
        tagline || '',
        logo_url || '/logo.png',
        address || '',
        phone || '',
        email || '',
        gst_number || '',
        Number(default_gst_percent || 0),
        business_hours || '',
      ]
    );
    res.json({ message: 'Salon settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/settings/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const userQ = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userQ.rows[0]) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, userQ.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// PUT /api/settings/profile — Update current user name/email
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [
      email.toLowerCase(),
      req.user.id,
    ]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already in use by another account' });
    }

    const { rows } = await db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email.toLowerCase(), req.user.id]
    );

    res.json({ message: 'Profile updated successfully', user: rows[0] || { id: req.user.id, name, email } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
