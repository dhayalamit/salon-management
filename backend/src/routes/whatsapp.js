const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendTextMessage, sendTemplateMessage, retryFailedMessage, formatPhoneNumber } = require('../services/whatsappService');
const { processDailyBirthdays } = require('../services/cronScheduler');

const router = express.Router();

// GET /api/whatsapp/dashboard — Marketing Analytics & Overview
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [logsCount, todayCount, deliveredCount, failedCount, readCount, campaignsCount, rulesCount] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM message_logs`),
      db.query(`SELECT COUNT(*) AS total FROM message_logs WHERE created_at::text LIKE $1 || '%'`, [todayStr]),
      db.query(`SELECT COUNT(*) AS total FROM message_logs WHERE LOWER(status) = 'delivered'`),
      db.query(`SELECT COUNT(*) AS total FROM message_logs WHERE LOWER(status) = 'failed'`),
      db.query(`SELECT COUNT(*) AS total FROM message_logs WHERE LOWER(status) = 'read'`),
      db.query(`SELECT COUNT(*) AS total FROM whatsapp_campaigns`),
      db.query(`SELECT COUNT(*) AS total FROM automation_rules WHERE is_enabled::text IN ('true', '1')`),
    ]);

    const totalSent = Number(logsCount.rows[0]?.total || 0);
    const delivered = Number(deliveredCount.rows[0]?.total || 0);
    const failed = Number(failedCount.rows[0]?.total || 0);
    const read = Number(readCount.rows[0]?.total || 0);
    const todaySent = Number(todayCount.rows[0]?.total || 0);

    const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100;

    res.json({
      totalSent,
      todaySent,
      delivered,
      failed,
      read,
      deliveryRate,
      campaignsCount: Number(campaignsCount.rows[0]?.total || 0),
      activeRulesCount: Number(rulesCount.rows[0]?.total || 0),
    });
  } catch (err) {
    console.error('WhatsApp Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to fetch WhatsApp dashboard metrics' });
  }
});

// GET /api/whatsapp/templates — List templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM whatsapp_templates ORDER BY created_at DESC`);
    res.json(rows || []);
  } catch (err) {
    console.error('Fetch templates error:', err);
    res.status(500).json({ error: 'Failed to fetch message templates' });
  }
});

// POST /api/whatsapp/templates — Create new template
router.post('/templates', authenticate, async (req, res) => {
  try {
    const { name, language, category, components, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

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
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// DELETE /api/whatsapp/templates/:id — Delete template
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM whatsapp_templates WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// GET /api/whatsapp/campaigns — List promotional campaigns
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM whatsapp_campaigns ORDER BY created_at DESC`);
    res.json(rows || []);
  } catch (err) {
    console.error('Fetch campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/whatsapp/campaigns — Create & Send / Broadcast Campaign
router.post('/campaigns', authenticate, async (req, res) => {
  try {
    const { name, type, targetAudience, filterCriteria, templateName, customMessage, scheduledAt } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }

    // Build target audience SQL query based on targetAudience filter
    let audienceSql = `SELECT id, name, phone FROM customers WHERE phone IS NOT NULL AND phone != ''`;
    const params = [];

    if (targetAudience === 'vip') {
      audienceSql += ` AND (is_permanent::text IN ('true', '1') OR COALESCE(advance_balance, 0) > 0)`;
    } else if (targetAudience === 'female') {
      audienceSql += ` AND LOWER(gender) = 'female'`;
    } else if (targetAudience === 'male') {
      audienceSql += ` AND LOWER(gender) = 'male'`;
    } else if (targetAudience === 'inactive_30d') {
      const d30 = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
      audienceSql += ` AND id NOT IN (SELECT DISTINCT customer_id FROM customer_visits WHERE created_at::text >= '${d30}')`;
    }

    const { rows: recipients } = await db.query(audienceSql, params);

    const campaignId = db.generateUUID();
    const isScheduled = Boolean(scheduledAt);
    const campaignStatus = isScheduled ? 'scheduled' : 'sending';

    const campaignRes = await db.query(
      `INSERT INTO whatsapp_campaigns
         (id, name, type, target_audience, filter_criteria, template_name, custom_message, status, scheduled_at, sent_count, delivered_count, failed_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0) RETURNING *`,
      [
        campaignId,
        name.trim(),
        type || 'promotional',
        targetAudience || 'all',
        filterCriteria ? JSON.stringify(filterCriteria) : null,
        templateName || null,
        customMessage || '',
        campaignStatus,
        scheduledAt || null,
        recipients.length,
      ]
    );

    // If immediate send: broadcast in background
    if (!isScheduled) {
      let sentCount = 0;
      let failedCount = 0;

      for (const cust of recipients) {
        const body = (customMessage || 'Special offer from TRIO The Posh!').replace(/{{name}}/g, cust.name || 'Valued Client');
        const sendRes = await sendTextMessage({
          to: cust.phone,
          body,
          customerName: cust.name,
          customerId: cust.id,
          messageType: 'campaign',
        });
        if (sendRes.success) sentCount++;
        else failedCount++;
      }

      await db.query(
        `UPDATE whatsapp_campaigns SET status = 'completed', sent_count = $1, failed_count = $2 WHERE id = $3`,
        [sentCount, failedCount, campaignId]
      );
    } else {
      // Schedule in scheduled_messages table
      for (const cust of recipients) {
        const schedId = db.generateUUID();
        const body = (customMessage || 'Special offer from TRIO The Posh!').replace(/{{name}}/g, cust.name || 'Valued Client');
        await db.query(
          `INSERT INTO scheduled_messages (id, customer_id, customer_name, phone, message_type, template_name, message_text, scheduled_at, status, campaign_id)
           VALUES ($1, $2, $3, $4, 'campaign', $5, $6, $7, 'pending', $8)`,
          [schedId, cust.id, cust.name, cust.phone, templateName || null, body, scheduledAt, campaignId]
        );
      }
    }

    res.status(201).json(campaignRes.rows[0]);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to launch WhatsApp campaign' });
  }
});

// GET /api/whatsapp/automations — Fetch automation rules
router.get('/automations', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM automation_rules ORDER BY rule_type ASC`);

    // Ensure default rules exist
    const defaultRules = [
      { rule_type: 'birthday', is_enabled: 1, discount_offer: '20% OFF on any service' },
      { rule_type: 'appointment_reminder_24h', is_enabled: 1, discount_offer: '' },
      { rule_type: 'appointment_reminder_2h', is_enabled: 1, discount_offer: '' },
      { rule_type: 'review_request', is_enabled: 1, discount_offer: '' },
      { rule_type: 'welcome', is_enabled: 1, discount_offer: '10% OFF on next visit' },
      { rule_type: 'thank_you', is_enabled: 1, discount_offer: '' },
      { rule_type: 'miss_you_30d', is_enabled: 1, discount_offer: '15% OFF miss-you offer' },
      { rule_type: 'service_reminder', is_enabled: 1, discount_offer: '' },
    ];

    if (!rows || rows.length === 0) {
      for (const rule of defaultRules) {
        const id = db.generateUUID();
        await db.query(
          `INSERT INTO automation_rules (id, rule_type, is_enabled, discount_offer) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [id, rule.rule_type, rule.is_enabled, rule.discount_offer]
        );
      }
      const reFetch = await db.query(`SELECT * FROM automation_rules ORDER BY rule_type ASC`);
      return res.json(reFetch.rows || []);
    }

    res.json(rows);
  } catch (err) {
    console.error('Fetch automation rules error:', err);
    res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
});

// PUT /api/whatsapp/automations/:ruleType — Toggle or update an automation rule
router.put('/automations/:ruleType', authenticate, async (req, res) => {
  try {
    const { ruleType } = req.params;
    const { is_enabled, custom_message, discount_offer } = req.body;

    const existing = await db.query('SELECT id FROM automation_rules WHERE rule_type = $1', [ruleType]);

    if (existing.rows && existing.rows.length > 0) {
      const { rows } = await db.query(
        `UPDATE automation_rules
         SET is_enabled = $1, custom_message = $2, discount_offer = $3
         WHERE rule_type = $4 RETURNING *`,
        [is_enabled ? 1 : 0, custom_message || null, discount_offer || null, ruleType]
      );
      return res.json(rows[0]);
    } else {
      const id = db.generateUUID();
      const { rows } = await db.query(
        `INSERT INTO automation_rules (id, rule_type, is_enabled, custom_message, discount_offer)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, ruleType, is_enabled ? 1 : 0, custom_message || null, discount_offer || null]
      );
      return res.json(rows[0]);
    }
  } catch (err) {
    console.error('Update automation rule error:', err);
    res.status(500).json({ error: 'Failed to update automation rule' });
  }
});

// GET /api/whatsapp/logs — Audit logs with search, filter & pagination
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { status, type, search } = req.query;

    let sql = `SELECT * FROM message_logs WHERE 1=1`;
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
    console.error('Fetch message logs error:', err);
    res.status(500).json({ error: 'Failed to fetch message logs' });
  }
});

// POST /api/whatsapp/logs/:id/retry — Retry failed message
router.post('/logs/:id/retry', authenticate, async (req, res) => {
  try {
    const result = await retryFailedMessage(req.params.id);
    if (result.success) {
      res.json({ message: 'WhatsApp message retried successfully', result });
    } else {
      res.status(400).json({ error: result.error || 'Failed to resend message' });
    }
  } catch (err) {
    console.error('Retry message error:', err);
    res.status(500).json({ error: 'Failed to retry message' });
  }
});

// GET /api/whatsapp/settings — Fetch Meta WhatsApp credentials & configuration
router.get('/settings', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM marketing_settings WHERE id = 1');
    const settings = rows[0] || {
      id: 1,
      whatsapp_token: process.env.WHATSAPP_TOKEN || '',
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      google_review_link: 'https://g.page/r/triotheposh/review',
      auto_send_enabled: 1,
      daily_birthday_time: '09:00',
    };
    res.json(settings);
  } catch (err) {
    console.error('Fetch marketing settings error:', err);
    res.status(500).json({ error: 'Failed to fetch marketing settings' });
  }
});

// PUT /api/whatsapp/settings — Update Meta WhatsApp API credentials
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { whatsapp_token, phone_number_id, business_account_id, google_review_link, auto_send_enabled, daily_birthday_time } = req.body;

    const existing = await db.query('SELECT id FROM marketing_settings WHERE id = 1');

    if (existing.rows && existing.rows.length > 0) {
      await db.query(
        `UPDATE marketing_settings SET
           whatsapp_token = $1,
           phone_number_id = $2,
           business_account_id = $3,
           google_review_link = $4,
           auto_send_enabled = $5,
           daily_birthday_time = $6
         WHERE id = 1`,
        [
          whatsapp_token || null,
          phone_number_id || null,
          business_account_id || null,
          google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled ? 1 : 0,
          daily_birthday_time || '09:00',
        ]
      );
    } else {
      await db.query(
        `INSERT INTO marketing_settings (id, whatsapp_token, phone_number_id, business_account_id, google_review_link, auto_send_enabled, daily_birthday_time)
         VALUES (1, $1, $2, $3, $4, $5, $6)`,
        [
          whatsapp_token || null,
          phone_number_id || null,
          business_account_id || null,
          google_review_link || 'https://g.page/r/triotheposh/review',
          auto_send_enabled ? 1 : 0,
          daily_birthday_time || '09:00',
        ]
      );
    }

    res.json({ message: 'WhatsApp Cloud API settings updated successfully' });
  } catch (err) {
    console.error('Update marketing settings error:', err);
    res.status(500).json({ error: 'Failed to update marketing settings' });
  }
});

// POST /api/whatsapp/send-test — Quick direct WhatsApp message tester
router.post('/send-test', authenticate, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone number and message body are required' });
    }

    const result = await sendTextMessage({
      to: phone,
      body: message,
      customerName: 'Test Recipient',
      messageType: 'test',
    });

    if (result.success) {
      res.json({ message: 'Test message sent successfully', result });
    } else {
      res.status(400).json({ error: result.error || 'Failed to send test message' });
    }
  } catch (err) {
    console.error('Send test message error:', err);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

// GET /api/whatsapp/webhook — Meta Webhook verification endpoint
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && (token === 'trio_whatsapp_webhook_secret' || token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)) {
      console.log('[WhatsApp Webhook Verified]');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// POST /api/whatsapp/webhook — Meta Webhook real-time delivery status updates
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

        await db.query(`UPDATE message_logs SET status = $1 WHERE meta_message_id = $2`, [newStatus, metaMessageId]);
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
