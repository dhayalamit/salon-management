const cron = require('node-cron');
const db = require('../db');
const { sendTextMessage, getWhatsAppConfig, formatPhoneNumber } = require('./whatsappService');

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 1. AUTOMATED BIRTHDAY WISHES (Daily at 9:00 AM)
 */
async function processDailyBirthdays() {
  try {
    const config = await getWhatsAppConfig();
    if (!config.autoSendEnabled) return;

    const todayStr = getTodayString();
    const todayMD = todayStr.slice(5); // MM-DD

    const { rows: customers } = await db.query(
      `SELECT * FROM customers WHERE birthday IS NOT NULL AND (birthday LIKE '%' || $1 OR birthday LIKE $1 || '%')`,
      [todayMD]
    );

    if (!customers || customers.length === 0) return;

    const ruleQ = await db.query(`SELECT * FROM automation_rules WHERE rule_type = 'birthday'`);
    const rule = ruleQ.rows[0] || {};
    if (rule.is_enabled === 0 || rule.is_enabled === false) return;

    const discountOffer = rule.discount_offer || '20% OFF on any service this month';

    for (const cust of customers) {
      if (!cust.phone) continue;
      const phone = formatPhoneNumber(cust.phone, config.defaultCountryCode);

      // Check duplicate send today
      const checkLog = await db.query(
        `SELECT id FROM whatsapp_messages
         WHERE recipient_phone = $1 AND message_type = 'birthday' AND (created_at::text LIKE $2 || '%')`,
        [phone, todayStr]
      );

      if (checkLog.rows && checkLog.rows.length > 0) continue;

      const firstName = cust.name ? cust.name.split(' ')[0] : 'Valued Client';
      const body =
        rule.custom_message ||
        `🎉 Happy Birthday, ${firstName}!\n\nThe entire TRIO The Posh family wishes you a wonderful birthday.\n\nEnjoy ${discountOffer} as our special birthday gift!\n\nBook your appointment today!`;

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
 * 2. AUTOMATED APPOINTMENT REMINDERS (Every 5 Minutes)
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

      const phone = formatPhoneNumber(app.customer_phone, config.defaultCountryCode);
      const checkLog = await db.query(
        `SELECT id FROM whatsapp_messages WHERE recipient_phone = $1 AND message_type = $2 AND (created_at::text LIKE $3 || '%')`,
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
      const phone = formatPhoneNumber(vis.customer_phone, config.defaultCountryCode);
      const checkLog = await db.query(
        `SELECT id FROM whatsapp_messages WHERE recipient_phone = $1 AND message_type = 'review_request'`,
        [phone]
      );
      if (checkLog.rows && checkLog.rows.length > 0) continue;

      const body = `🌟 How was your experience at TRIO The Posh?\n\nDear ${vis.customer_name || 'Client'},\nThank you for visiting us yesterday! We hope you loved your salon experience.\n\nPlease rate your experience on Google:\n👉 ${config.googleReviewLink}\n\nYour feedback helps us serve you even better!`;

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
 * 4. PROCESS PENDING SCHEDULED JOBS QUEUE
 */
async function processScheduledJobsQueue() {
  try {
    const nowIso = new Date().toISOString();

    const { rows: pendingJobs } = await db.query(
      `SELECT * FROM scheduled_jobs WHERE status = 'pending' AND scheduled_at <= $1 LIMIT 50`,
      [nowIso]
    );

    if (!pendingJobs || pendingJobs.length === 0) return;

    for (const job of pendingJobs) {
      const res = await sendTextMessage({
        to: job.phone,
        body: job.message_text,
        customerName: job.customer_name,
        customerId: job.customer_id,
        messageType: job.job_type || 'scheduled',
      });

      const newStatus = res.success ? 'sent' : 'failed';
      await db.query('UPDATE scheduled_jobs SET status = $1 WHERE id = $2', [newStatus, job.id]);
    }
  } catch (err) {
    console.error('[Cron Scheduled Jobs Error]', err.message);
  }
}

/**
 * Initialize WhatsApp Center Automated Cron Scheduler
 */
function initCronScheduler() {
  console.log('[Cron] Initializing WhatsApp Center Cron Scheduler...');

  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron 9:00 AM] Running daily WhatsApp Center automation tasks...');
    await processDailyBirthdays();
  });

  cron.schedule('*/5 * * * *', async () => {
    await processAppointmentReminders();
    await processReviewRequests();
    await processScheduledJobsQueue();
  });

  console.log('[Cron] WhatsApp Center Cron Scheduler running successfully.');
}

module.exports = {
  initCronScheduler,
  processDailyBirthdays,
  processAppointmentReminders,
  processReviewRequests,
  processScheduledJobsQueue,
};
