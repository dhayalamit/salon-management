const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  sendTextMessage,
  sendTemplateMessage,
  sendImageMessage,
  sendDocumentMessage,
  testWhatsAppConnection,
  retryFailedMessage,
  formatPhoneNumber,
} = require('../services/whatsappService');

const router = express.Router();

// GET /api/whatsapp/dashboard — Dashboard Analytics & Activity Overview
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [
      sentToday,
      deliveredToday,
      failedToday,
      pendingCount,
      scheduledCount,
      birthdaySentToday,
      remindersSentToday,
      festivalSentToday,
      totalCount,
      campaignsCount,
      activeRulesCount,
      recentActivity,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE CAST(created_at AS TEXT) LIKE $1 || '%'`, [todayStr]),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE LOWER(status) = 'delivered'`),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE LOWER(status) = 'failed'`),
      db.query(`SELECT COUNT(*) AS total FROM scheduled_jobs WHERE status = 'pending'`),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_campaigns WHERE status = 'scheduled'`),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE message_type = 'birthday' AND CAST(created_at AS TEXT) LIKE $1 || '%'`, [todayStr]),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE message_type LIKE 'appointment%' AND CAST(created_at AS TEXT) LIKE $1 || '%'`, [todayStr]),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages WHERE message_type = 'festival' AND CAST(created_at AS TEXT) LIKE $1 || '%'`, [todayStr]),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_messages`),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_campaigns`),
      db.query(`SELECT COUNT(*) AS total FROM automation_rules WHERE is_enabled IS NOT NULL AND is_enabled != '0' AND is_enabled != 'false'`),
      db.query(`SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10`),
    ]);

    const totalSent = Number(totalCount.rows[0]?.total || 0);
    const delivered = Number(deliveredToday.rows[0]?.total || 0);
    const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100;

    res.json({
      todaySent: Number(sentToday.rows[0]?.total || 0),
      delivered,
      failed: Number(failedToday.rows[0]?.total || 0),
      pending: Number(pendingCount.rows[0]?.total || 0),
      scheduled: Number(scheduledCount.rows[0]?.total || 0),
      birthdaySentToday: Number(birthdaySentToday.rows[0]?.total || 0),
      remindersSentToday: Number(remindersSentToday.rows[0]?.total || 0),
      festivalSentToday: Number(festivalSentToday.rows[0]?.total || 0),
      deliveryRate,
      campaignsCount: Number(campaignsCount.rows[0]?.total || 0),
      activeRulesCount: Number(activeRulesCount.rows[0]?.total || 0),
      recentActivity: recentActivity.rows || [],
    });
  } catch (err) {
    console.error('WhatsApp Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to fetch WhatsApp dashboard metrics' });
  }
});

// POST /api/whatsapp/send — Direct Individual Message Dispatcher
router.post('/send', authenticate, async (req, res) => {
  try {
    const { phone, customerId, customerName, message, mediaUrl, mediaType, filename } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }
    if (!message && !mediaUrl) {
      return res.status(400).json({ error: 'Message body or media attachment is required' });
    }

    let sendRes;
    if (mediaType === 'image' && mediaUrl) {
      sendRes = await sendImageMessage({
        to: phone,
        imageUrl: mediaUrl,
        caption: message,
        customerName,
        customerId,
        messageType: 'direct_image',
      });
    } else if (mediaType === 'document' && mediaUrl) {
      sendRes = await sendDocumentMessage({
        to: phone,
        documentUrl: mediaUrl,
        filename,
        caption: message,
        customerName,
        customerId,
        messageType: 'direct_document',
      });
    } else {
      sendRes = await sendTextMessage({
        to: phone,
        body: message,
        customerName,
        customerId,
        messageType: 'direct_text',
      });
    }

    if (sendRes.success) {
      res.json({ message: 'WhatsApp message sent successfully', result: sendRes });
    } else {
      res.status(400).json({ error: sendRes.error || 'Failed to send WhatsApp message' });
    }
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to dispatch WhatsApp message' });
  }
});

// POST /api/whatsapp/broadcast — Broadcast Campaign Launcher
router.post('/broadcast', authenticate, async (req, res) => {
  try {
    const { name, targetAudience, customMessage, mediaUrl, scheduledAt } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign title is required' });
    }

    let audienceSql = `SELECT id, name, phone FROM customers WHERE phone IS NOT NULL AND phone != ''`;
    const params = [];

    if (targetAudience === 'vip') {
      audienceSql += ` AND (is_permanent IN (1, '1', true, 'true') OR COALESCE(advance_balance, 0) > 0)`;
    } else if (targetAudience === 'female') {
      audienceSql += ` AND LOWER(gender) = 'female'`;
    } else if (targetAudience === 'male') {
      audienceSql += ` AND LOWER(gender) = 'male'`;
    } else if (targetAudience === 'inactive_30d') {
      const d30 = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
      audienceSql += ` AND id NOT IN (SELECT DISTINCT customer_id FROM customer_visits WHERE CAST(created_at AS TEXT) >= '${d30}')`;
    }

    const { rows: recipients } = await db.query(audienceSql, params);

    const campaignId = db.generateUUID();
    const isScheduled = Boolean(scheduledAt);

    await db.query(
      `INSERT INTO whatsapp_campaigns
         (id, name, type, target_audience, custom_message, status, scheduled_at, sent_count, delivered_count, failed_count)
       VALUES ($1, $2, 'broadcast', $3, $4, $5, $6, $7, 0, 0)`,
      [
        campaignId,
        name.trim(),
        targetAudience || 'all',
        customMessage || '',
        isScheduled ? 'scheduled' : 'sending',
        scheduledAt || null,
        recipients.length,
      ]
    );

    if (!isScheduled) {
      let sentCount = 0;
      let failedCount = 0;

      for (const cust of recipients) {
        const body = (customMessage || '').replace(/{{customer_name}}/g, cust.name || 'Valued Client');
        const sendRes = mediaUrl
          ? await sendImageMessage({ to: cust.phone, imageUrl: mediaUrl, caption: body, customerName: cust.name, customerId: cust.id, messageType: 'broadcast' })
          : await sendTextMessage({ to: cust.phone, body, customerName: cust.name, customerId: cust.id, messageType: 'broadcast' });

        if (sendRes.success) sentCount++;
        else failedCount++;
      }

      await db.query(
        `UPDATE whatsapp_campaigns SET status = 'completed', sent_count = $1, failed_count = $2 WHERE id = $3`,
        [sentCount, failedCount, campaignId]
      );
    }

    res.status(201).json({ message: 'Broadcast campaign created successfully', recipientsCount: recipients.length });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Failed to launch broadcast campaign' });
  }
});

// POST /api/whatsapp/test & /test-connection — Connection Tester
router.post('/test', authenticate, async (req, res) => {
  try {
    const result = await testWhatsAppConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ connected: false, status: 'error', message: err.message });
  }
});
router.post('/test-connection', authenticate, async (req, res) => {
  try {
    const result = await testWhatsAppConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ connected: false, status: 'error', message: err.message });
  }
});

// GET & POST /api/whatsapp/templates & /template
router.get('/templates', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM whatsapp_templates ORDER BY created_at DESC`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});
router.get('/template', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM whatsapp_templates ORDER BY created_at DESC`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/template', authenticate, async (req, res) => {
  try {
    const { name, category, language, components, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Template name is required' });

    const id = db.generateUUID();
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const compJson = typeof components === 'object' ? JSON.stringify(components) : components || '[]';

    const { rows } = await db.query(
      `INSERT INTO whatsapp_templates (id, name, language, category, components, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, cleanName, language || 'en_US', category || 'MARKETING', compJson, status || 'APPROVED']
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.delete('/template/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM whatsapp_templates WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// GET /api/whatsapp/automations — Automation Rules List
router.get('/automations', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM automation_rules ORDER BY created_at DESC`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// GET /api/whatsapp/history & /logs — Message History Audit Trail
router.get('/history', authenticate, async (req, res) => {
  try {
    const { status, type, search } = req.query;

    let sql = `SELECT * FROM whatsapp_messages WHERE 1=1`;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND LOWER(status) = $${params.length}`;
    }
    if (type) {
      params.push(type);
      sql += ` AND LOWER(message_type) = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (recipient_phone LIKE $${params.length} OR customer_name LIKE $${params.length} OR message_body LIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 200`;

    const { rows } = await db.query(sql, params);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch message history' });
  }
});

router.get('/logs', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM whatsapp_logs ORDER BY created_at DESC LIMIT 200`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch WhatsApp logs' });
  }
});

// GET & PUT /api/whatsapp/settings — Credentials Configuration
router.get('/settings', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM whatsapp_settings WHERE id = 1');
    const settings = rows[0] || {
      id: 1,
      whatsapp_token: process.env.WHATSAPP_TOKEN || '',
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      default_country_code: '91',
      google_review_link: 'https://g.page/r/triotheposh/review',
      auto_send_enabled: 1,
      daily_birthday_time: '09:00',
    };

    const maskedToken = settings.whatsapp_token
      ? `${settings.whatsapp_token.slice(0, 6)}...${settings.whatsapp_token.slice(-4)}`
      : '';

    res.json({
      ...settings,
      whatsapp_token_masked: maskedToken,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch WhatsApp settings' });
  }
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    const { whatsapp_token, phone_number_id, business_account_id, default_country_code, google_review_link, auto_send_enabled, daily_birthday_time } = req.body;

    const existing = await db.query('SELECT id FROM whatsapp_settings WHERE id = 1');

    if (existing.rows && existing.rows.length > 0) {
      await db.query(
        `UPDATE whatsapp_settings SET
           whatsapp_token = $1,
           phone_number_id = $2,
           business_account_id = $3,
           default_country_code = $4,
           google_review_link = $5,
           auto_send_enabled = $6,
           daily_birthday_time = $7
         WHERE id = 1`,
        [
          whatsapp_token || null,
          phone_number_id || null,
          business_account_id || null,
          default_country_code || '91',
          google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled ? 1 : 0,
          daily_birthday_time || '09:00',
        ]
      );
    } else {
      await db.query(
        `INSERT INTO whatsapp_settings (id, whatsapp_token, phone_number_id, business_account_id, default_country_code, google_review_link, auto_send_enabled, daily_birthday_time)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7)`,
        [
          whatsapp_token || null,
          phone_number_id || null,
          business_account_id || null,
          default_country_code || '91',
          google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled ? 1 : 0,
          daily_birthday_time || '09:00',
        ]
      );
    }

    res.json({ message: 'WhatsApp Center settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update WhatsApp settings' });
  }
});

// GET & POST /api/whatsapp/webhook — Meta Webhook Callback Verification & Events
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && (token === 'trio_whatsapp_center_secret' || token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)) {
      console.log('[WhatsApp Webhook Verified]');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.statuses &&
        body.entry[0].changes[0].value.statuses[0]
      ) {
        const statusObj = body.entry[0].changes[0].value.statuses[0];
        const metaMessageId = statusObj.id;
        const newStatus = statusObj.status; // 'delivered', 'read', 'failed'

        await db.query(`UPDATE whatsapp_messages SET status = $1 WHERE meta_message_id = $2`, [newStatus, metaMessageId]);
      }
      return res.status(200).send('EVENT_RECEIVED');
    } else {
      return res.sendStatus(404);
    }
  } catch (err) {
    console.error('[WhatsApp Webhook Event Error]', err.message);
    res.status(500).end();
  }
});

module.exports = router;
