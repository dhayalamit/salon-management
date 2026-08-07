const cron = require('node-cron');
const db = require('../db');
const { sendTextMessage, getWhatsAppConfig, formatPhoneNumber } = require('./whatsappService');

/**
 * Helper: Format current date string YYYY-MM-DD
 */
function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 1. AUTOMATED BIRTHDAY WISHES (Runs Daily at 9:00 AM)
 */
async function processDailyBirthdays() {
  try {
    const config = await getWhatsAppConfig();
    if (!config.autoSendEnabled) return;

    const todayStr = getTodayString();
    const todayMD = todayStr.slice(5); // MM-DD

    // Fetch customers with birthday matching today
    const { rows: customers } = await db.query(
      `SELECT * FROM customers WHERE birthday IS NOT NULL AND (birthday LIKE '%' || $1 OR birthday LIKE $1 || '%')`,
      [todayMD]
    );

    if (!customers || customers.length === 0) return;

    // Fetch automation rule for birthday
    const ruleQ = await db.query(`SELECT * FROM automation_rules WHERE rule_type = 'birthday'`);
    const rule = ruleQ.rows[0] || {};
    if (rule.is_enabled === 0 || rule.is_enabled === false) return;

    const discountOffer = rule.discount_offer || '20% OFF on your next service';

    for (const cust of customers) {
      if (!cust.phone) continue;
      const phone = formatPhoneNumber(cust.phone);

      // Check duplicate send today
      const checkLog = await db.query(
        `SELECT id FROM message_logs
         WHERE recipient_phone = $1 AND message_type = 'birthday' AND (created_at::text LIKE $2 || '%')`,
        [phone, todayStr]
      );

      if (checkLog.rows && checkLog.rows.length > 0) continue;

      const firstName = cust.name ? cust.name.split(' ')[0] : 'Valued Client';
      const body =
        rule.custom_message ||
        `🎉 Happy Birthday, ${firstName}!\n\nThe entire TRIO The Posh family wishes you a wonderful birthday.\n\nEnjoy ${discountOffer} this month as our special gift.\n\nBook your appointment today or call us!`;

      await sendTextMessage({
        to: cust.phone,
        body,
        customerName: cust.name,
        customerId: cust.id,
        messageType: 'birthday',
      });
    }
  } catch (err) {
    console.error('[Cron Birthday Error]', err.message);
  }
}

/**
 * 2. AUTOMATED APPOINTMENT REMINDERS (Runs Every 5 Minutes)
 */
async function processAppointmentReminders() {
  try {
    const config = await getWhatsAppConfig();
    if (!config.autoSendEnabled) return;

    const now = new Date();
    const todayStr = getTodayString();

    const { rows: appts } = await db.query(
      `SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
              s.name AS staff_name, sv.name AS service_name
       FROM appointments a
       LEFT JOIN customers c ON c.id::text = a.customer_id::text
       LEFT JOIN staff s ON s.id::text = a.staff_id::text
       LEFT JOIN services sv ON sv.id::text = a.service_id::text
       WHERE a.appointment_date >= $1 AND LOWER(a.status) IN ('booked', 'confirmed')`,
      [todayStr]
    );

    if (!appts || appts.length === 0) return;

    for (const app of appts) {
      if (!app.customer_phone) continue;

      // Parse appointment date & time
      const timeParts = (app.appointment_time || '09:00').split(':');
      const apptDateTime = new Date(app.appointment_date);
      apptDateTime.setHours(Number(timeParts[0] || 9), Number(timeParts[1] || 0), 0, 0);

      const diffMs = apptDateTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      let reminderType = null;
      let timeLabel = '';

      if (diffMins >= 1410 && diffMins <= 1470) {
        reminderType = 'appointment_24h';
        timeLabel = 'tomorrow';
      } else if (diffMins >= 110 && diffMins <= 130) {
        reminderType = 'appointment_2h';
        timeLabel = 'in 2 hours';
      } else if (diffMins >= 20 && diffMins <= 40) {
        reminderType = 'appointment_30m';
        timeLabel = 'in 30 minutes';
      }

      if (!reminderType) continue;

      const phone = formatPhoneNumber(app.customer_phone);
      const checkLog = await db.query(
        `SELECT id FROM message_logs WHERE recipient_phone = $1 AND message_type = $2 AND (created_at::text LIKE $3 || '%')`,
        [phone, reminderType, todayStr]
      );
      if (checkLog.rows && checkLog.rows.length > 0) continue;

      const body = `⏰ Appointment Reminder — TRIO The Posh\n\nHello ${app.customer_name || 'Client'},\nThis is a friendly reminder for your appointment ${timeLabel}:\n\n🗓️ Date: ${app.appointment_date}\n🕒 Time: ${app.appointment_time}\n✂️ Service: ${app.service_name || 'Salon Service'}\n💈 Stylist: ${app.staff_name || 'Salon Team'}\n📍 Address: Piprali Road, Near MBA Chai Wala, Sikar\n📞 Contact: +91 98765 43210\n\nWe look forward to seeing you!`;

      await sendTextMessage({
        to: app.customer_phone,
        body,
        customerName: app.customer_name,
        customerId: app.customer_id,
        messageType: reminderType,
      });
    }
  } catch (err) {
    console.error('[Cron Appointment Reminder Error]', err.message);
  }
}

/**
 * 3. POST-VISIT REVIEW REQUESTS (24 Hours After Visit)
 */
async function processReviewRequests() {
  try {
    const config = await getWhatsAppConfig();
    if (!config.autoSendEnabled) return;

    const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);

    const { rows: visits } = await db.query(
      `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone
       FROM customer_visits v
       LEFT JOIN customers c ON c.id::text = v.customer_id::text
       WHERE (v.created_at::text LIKE $1 || '%') AND c.phone IS NOT NULL`,
      [yesterdayStr]
    );

    if (!visits || visits.length === 0) return;

    for (const vis of visits) {
      const phone = formatPhoneNumber(vis.customer_phone);
      const checkLog = await db.query(
        `SELECT id FROM message_logs WHERE recipient_phone = $1 AND message_type = 'review_request'`,
        [phone]
      );
      if (checkLog.rows && checkLog.rows.length > 0) continue;

      const body = `🌟 How was your experience at TRIO The Posh?\n\nDear ${vis.customer_name || 'Client'},\nThank you for visiting us yesterday! We hope you loved your salon experience.\n\nCould you take 10 seconds to share your review on Google?\n👉 ${config.googleReviewLink}\n\nYour feedback helps us serve you even better!`;

      await sendTextMessage({
        to: vis.customer_phone,
        body,
        customerName: vis.customer_name,
        customerId: vis.customer_id,
        messageType: 'review_request',
      });
    }
  } catch (err) {
    console.error('[Cron Review Request Error]', err.message);
  }
}

/**
 * 4. PROCESS PENDING SCHEDULED CAMPAIGN MESSAGES QUEUE
 */
async function processScheduledMessagesQueue() {
  try {
    const nowIso = new Date().toISOString();

    const { rows: pendingMsgs } = await db.query(
      `SELECT * FROM scheduled_messages WHERE status = 'pending' AND scheduled_at <= $1 LIMIT 50`,
      [nowIso]
    );

    if (!pendingMsgs || pendingMsgs.length === 0) return;

    for (const msg of pendingMsgs) {
      const res = await sendTextMessage({
        to: msg.phone,
        body: msg.message_text,
        customerName: msg.customer_name,
        customerId: msg.customer_id,
        messageType: msg.message_type || 'scheduled',
      });

      const newStatus = res.success ? 'sent' : 'failed';
      await db.query('UPDATE scheduled_messages SET status = $1 WHERE id = $2', [newStatus, msg.id]);
    }
  } catch (err) {
    console.error('[Cron Scheduled Queue Error]', err.message);
  }
}

/**
 * Initialize All WhatsApp Automated Cron Schedulers
 */
function initCronScheduler() {
  console.log('[Cron] Initializing Automated WhatsApp Cron Schedulers...');

  // 1. Daily 9:00 AM Cron Job for Birthdays, Anniversaries, Miss You & Service Reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron 9:00 AM] Running daily WhatsApp automation tasks...');
    await processDailyBirthdays();
  });

  // 2. Every 5 Minutes Cron Job for Appointment Reminders, Review Requests & Scheduled Queue
  cron.schedule('*/5 * * * *', async () => {
    await processAppointmentReminders();
    await processReviewRequests();
    await processScheduledMessagesQueue();
  });

  console.log('[Cron] WhatsApp Cron Schedulers running successfully.');
}

module.exports = {
  initCronScheduler,
  processDailyBirthdays,
  processAppointmentReminders,
  processReviewRequests,
  processScheduledMessagesQueue,
};
