/**
 * WhatsApp Automation Engine
 * Evaluates triggers, handles scheduling, replaces variables, and prevents duplicate sends.
 */

import { replaceTemplateVariables } from './variableEngine.js';
import { sendWhatsAppMessage, checkApiConnectionStatus } from './whatsappService.js';
import { getDb, saveDb } from '../mockStorage.js';

export const DEFAULT_AUTOMATIONS = [
  {
    id: 'rule_birthday',
    name: 'Birthday Wishes Automation',
    trigger: 'customer_birthday',
    type: 'birthday',
    trigger_label: 'Customer Birthday Today at 10:00 AM',
    template_id: 'tpl_birthday_1',
    template_name: 'Birthday Special Wish',
    delay_hours: 0,
    send_time: '10:00',
    days_offset: 0, // 0 = on birthday, -1 = 1 day before
    allow_once_per_year: true,
    is_enabled: true,
    last_run: null,
    next_run: 'Today at 10:00 AM',
  },
  {
    id: 'rule_reminder_24h',
    name: 'Appointment Reminder (24 Hours Before)',
    trigger: 'appointment_reminder',
    type: 'reminder_24h',
    trigger_label: '24 Hours Before Appointment',
    template_id: 'tpl_reminder_24h',
    template_name: '24h Appointment Reminder',
    lead_time_minutes: 1440,
    is_enabled: true,
    last_run: null,
    next_run: 'Auto Calculated',
  },
  {
    id: 'rule_reminder_30m',
    name: 'Appointment Reminder (30 Mins Before)',
    trigger: 'appointment_reminder',
    type: 'reminder_30m',
    trigger_label: '30 Minutes Before Appointment',
    template_id: 'tpl_reminder_30m',
    template_name: '30m Urgent Reminder',
    lead_time_minutes: 30,
    is_enabled: true,
    last_run: null,
    next_run: 'Auto Calculated',
  },
  {
    id: 'rule_confirmation',
    name: 'Instant Booking Confirmation',
    trigger: 'appointment_created',
    type: 'confirmation',
    trigger_label: 'When Appointment is Booked',
    template_id: 'tpl_booking_confirm',
    template_name: 'Booking Confirmation',
    is_enabled: true,
    last_run: null,
    next_run: 'On Event',
  },
  {
    id: 'rule_thankyou',
    name: 'Post-Visit Thank You & Feedback',
    trigger: 'visit_completed',
    type: 'thank_you',
    trigger_label: 'After Visit Completion',
    template_id: 'tpl_thank_you',
    template_name: 'Thank You & Feedback',
    is_enabled: true,
    last_run: null,
    next_run: 'On Event',
  },
];

/**
 * Runs the automation engine scan across database triggers.
 */
export async function runAutomationEngineScan() {
  const db = getDb();
  if (!db.whatsapp) db.whatsapp = {};
  if (!db.whatsapp.automations) db.whatsapp.automations = DEFAULT_AUTOMATIONS;
  if (!db.whatsapp.history) db.whatsapp.history = [];
  if (!db.whatsapp.sent_keys) db.whatsapp.sent_keys = {};

  const apiSettings = db.whatsapp.settings || { isTestMode: true };
  const conn = checkApiConnectionStatus(apiSettings);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let totalProcessed = 0;

  // ================= 1. BIRTHDAY AUTOMATION =================
  const birthdayRule = db.whatsapp.automations.find((a) => a.type === 'birthday' && a.is_enabled);
  if (birthdayRule) {
    const customers = db.customers || [];
    for (const cust of customers) {
      if (!cust.birthday && !cust.birthdate) continue;
      const bdayStr = cust.birthday || cust.birthdate;
      const bdayMonthDay = bdayStr.substring(5); // Assuming YYYY-MM-DD

      if (bdayMonthDay === currentMonthDay) {
        const dedupeKey = `birthday_${cust.id}_${now.getFullYear()}`;

        // Check if already sent this year
        if (!db.whatsapp.sent_keys[dedupeKey]) {
          const defaultMsg = '🎉 Happy Birthday {{customer_name}}!\n\nWishing you a beautiful day! Enjoy a 20% OFF Birthday Discount on all services at {{salon_name}}.\n\nBook your special treatment today!';
          const template = (db.whatsapp.templates || []).find((t) => t.id === birthdayRule.template_id);
          const messageText = template?.body_text || defaultMsg;

          const res = await sendWhatsAppMessage({
            to: cust.phone,
            messageText,
            context: { customer: cust },
            apiSettings,
          });

          // Log transaction
          db.whatsapp.sent_keys[dedupeKey] = { sent_at: new Date().toISOString(), status: res.status };
          db.whatsapp.history.unshift({
            id: `msg_bday_${Date.now()}_${cust.id}`,
            customer_id: cust.id,
            customer_name: cust.name,
            phone: cust.phone,
            message_type: 'Birthday Wish',
            automation_name: birthdayRule.name,
            template_name: template?.name || 'Birthday Special Wish',
            message: res.finalMessage || messageText,
            status: res.status,
            error: res.error || null,
            sent_at: new Date().toISOString(),
          });
          totalProcessed++;
        }
      }
    }
  }

  // ================= 2. APPOINTMENT REMINDERS =================
  const reminderRules = db.whatsapp.automations.filter((a) => a.trigger === 'appointment_reminder' && a.is_enabled);
  if (reminderRules.length > 0) {
    const appointments = (db.appointments || []).filter((a) => a.status === 'scheduled' || a.status === 'confirmed');

    for (const appt of appointments) {
      const cust = (db.customers || []).find((c) => String(c.id) === String(appt.customer_id || appt.customerId)) || {
        name: appt.customer_name || 'Customer',
        phone: appt.phone || appt.customer_phone || '',
      };

      const apptDateStr = appt.appointment_date || appt.date;
      const apptTimeStr = appt.appointment_time || appt.time || '12:00';
      if (!apptDateStr) continue;

      const apptDateTime = new Date(`${apptDateStr}T${apptTimeStr}:00`);
      if (isNaN(apptDateTime.getTime())) continue;

      const diffMinutes = Math.round((apptDateTime.getTime() - now.getTime()) / (1000 * 60));

      for (const rule of reminderRules) {
        const leadMin = rule.lead_time_minutes || 60;
        // Trigger if within lead window (e.g. 30 mins before +/- 15 mins)
        if (diffMinutes > 0 && diffMinutes <= leadMin && diffMinutes >= leadMin - 30) {
          const dedupeKey = `reminder_${appt.id}_${rule.type}`;

          if (!db.whatsapp.sent_keys[dedupeKey]) {
            const defaultMsg = 'Hi {{customer_name}},\n\nThis is a friendly reminder for your upcoming appointment at {{salon_name}} on {{appointment_date}} at {{appointment_time}} for {{service_name}}.\n\nSee you soon!';
            const template = (db.whatsapp.templates || []).find((t) => t.id === rule.template_id);
            const messageText = template?.body_text || defaultMsg;

            const res = await sendWhatsAppMessage({
              to: cust.phone,
              messageText,
              context: { customer: cust, appointment: appt },
              apiSettings,
            });

            db.whatsapp.sent_keys[dedupeKey] = { sent_at: new Date().toISOString(), status: res.status };
            db.whatsapp.history.unshift({
              id: `msg_rem_${Date.now()}_${appt.id}`,
              customer_id: cust.id,
              customer_name: cust.name || appt.customer_name,
              phone: cust.phone || appt.phone,
              message_type: 'Appointment Reminder',
              automation_name: rule.name,
              template_name: template?.name || 'Appointment Reminder',
              message: res.finalMessage || messageText,
              status: res.status,
              error: res.error || null,
              sent_at: new Date().toISOString(),
            });
            totalProcessed++;
          }
        }
      }
    }
  }

  saveDb(db);
  return { totalProcessed, connectionStatus: conn };
}

/**
 * Cancels pending appointment reminders if an appointment is cancelled or deleted.
 */
export function cancelAppointmentReminders(appointmentId) {
  const db = getDb();
  if (!db.whatsapp || !db.whatsapp.sent_keys) return;

  Object.keys(db.whatsapp.sent_keys).forEach((key) => {
    if (key.startsWith(`reminder_${appointmentId}_`)) {
      delete db.whatsapp.sent_keys[key];
    }
  });

  saveDb(db);
}
