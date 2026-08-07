const db = require('../db');

/**
  * Phone Number Sanitizer for WhatsApp (Meta format)
  * Formats 10-digit Indian numbers into E.164 without leading '+' (e.g. 9876543210 -> 919876543210)
  */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Fetch WhatsApp API Configuration from DB or ENV
 */
async function getWhatsAppConfig() {
  try {
    const { rows } = await db.query('SELECT * FROM marketing_settings WHERE id = 1');
    const settings = rows[0] || {};

    const token = settings.whatsapp_token || process.env.WHATSAPP_TOKEN || process.env.META_WA_TOKEN;
    const phoneNumberId = settings.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;
    const businessAccountId = settings.business_account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WA_BUSINESS_ACCOUNT_ID;
    const autoSendEnabled = settings.auto_send_enabled !== undefined ? Boolean(settings.auto_send_enabled) : true;
    const googleReviewLink = settings.google_review_link || 'https://g.page/r/triotheposh/review';

    return {
      token,
      phoneNumberId,
      businessAccountId,
      autoSendEnabled,
      googleReviewLink,
      isConfigured: Boolean(token && phoneNumberId),
    };
  } catch (err) {
    console.error('[WhatsApp Config Error]', err.message);
    return {
      token: process.env.WHATSAPP_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      autoSendEnabled: true,
      googleReviewLink: 'https://g.page/r/triotheposh/review',
      isConfigured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    };
  }
}

/**
 * Log message transaction into message_logs table
 */
async function logMessage({
  recipientPhone,
  customerName,
  customerId,
  messageType,
  templateName,
  messageBody,
  status,
  metaMessageId,
  errorMessage,
  retryCount = 0,
}) {
  try {
    const id = db.generateUUID();
    await db.query(
      `INSERT INTO message_logs
         (id, recipient_phone, customer_name, customer_id, message_type, template_name, message_body, status, meta_message_id, error_message, retry_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        recipientPhone,
        customerName || 'Client',
        customerId || null,
        messageType || 'custom',
        templateName || null,
        messageBody || '',
        status || 'sent',
        metaMessageId || null,
        errorMessage || null,
        retryCount,
      ]
    );
    return id;
  } catch (err) {
    console.error('[WhatsApp Logger Error]', err.message);
  }
}

/**
 * Send WhatsApp Text Message via Meta Cloud API v19.0
 */
async function sendTextMessage({ to, body, customerName, customerId, messageType = 'custom' }) {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    console.warn('[WhatsApp] Invalid phone number provided:', to);
    return { success: false, error: 'Invalid phone number' };
  }

  const config = await getWhatsAppConfig();

  if (!config.isConfigured) {
    console.log(`[WhatsApp API Demo Log] To: ${formattedPhone} | Type: ${messageType} | Body:\n${body}`);
    await logMessage({
      recipientPhone: formattedPhone,
      customerName,
      customerId,
      messageType,
      messageBody: body,
      status: 'sent',
      metaMessageId: `wamid.demo.${Date.now()}`,
    });
    return { success: true, mode: 'demo', messageId: `wamid.demo.${Date.now()}` };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: { preview_url: true, body },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages[0]) {
      const metaId = data.messages[0].id;
      await logMessage({
        recipientPhone: formattedPhone,
        customerName,
        customerId,
        messageType,
        messageBody: body,
        status: 'sent',
        metaMessageId: metaId,
      });
      return { success: true, messageId: metaId };
    } else {
      const errorMsg = data.error ? data.error.message : 'Meta API call failed';
      console.error('[WhatsApp Meta API Error]', errorMsg);
      await logMessage({
        recipientPhone: formattedPhone,
        customerName,
        customerId,
        messageType,
        messageBody: body,
        status: 'failed',
        errorMessage: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    console.error('[WhatsApp Exception]', err.message);
    await logMessage({
      recipientPhone: formattedPhone,
      customerName,
      customerId,
      messageType,
      messageBody: body,
      status: 'failed',
      errorMessage: err.message,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send WhatsApp Template Message via Meta Cloud API v19.0
 */
async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'en_US',
  components = [],
  customerName,
  customerId,
  messageType = 'template',
  messageBodyFallback = '',
}) {
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) return { success: false, error: 'Invalid phone number' };

  const config = await getWhatsAppConfig();

  if (!config.isConfigured) {
    console.log(`[WhatsApp API Template Log] To: ${formattedPhone} | Template: ${templateName}`);
    await logMessage({
      recipientPhone: formattedPhone,
      customerName,
      customerId,
      messageType,
      templateName,
      messageBody: messageBodyFallback || `[Template: ${templateName}]`,
      status: 'sent',
      metaMessageId: `wamid.demo.${Date.now()}`,
    });
    return { success: true, mode: 'demo', messageId: `wamid.demo.${Date.now()}` };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages[0]) {
      const metaId = data.messages[0].id;
      await logMessage({
        recipientPhone: formattedPhone,
        customerName,
        customerId,
        messageType,
        templateName,
        messageBody: messageBodyFallback || `Template: ${templateName}`,
        status: 'sent',
        metaMessageId: metaId,
      });
      return { success: true, messageId: metaId };
    } else {
      const errorMsg = data.error ? data.error.message : 'Template message send failed';
      await logMessage({
        recipientPhone: formattedPhone,
        customerName,
        customerId,
        messageType,
        templateName,
        messageBody: messageBodyFallback,
        status: 'failed',
        errorMessage: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    console.error('[WhatsApp Template Error]', err.message);
    await logMessage({
      recipientPhone: formattedPhone,
      customerName,
      customerId,
      messageType,
      templateName,
      messageBody: messageBodyFallback,
      status: 'failed',
      errorMessage: err.message,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Retry Failed WhatsApp Messages from Log
 */
async function retryFailedMessage(logId) {
  try {
    const { rows } = await db.query('SELECT * FROM message_logs WHERE id = $1', [logId]);
    if (!rows[0]) return { success: false, error: 'Log entry not found' };

    const log = rows[0];
    const retryCount = Number(log.retry_count || 0) + 1;

    const res = await sendTextMessage({
      to: log.recipient_phone,
      body: log.message_body,
      customerName: log.customer_name,
      customerId: log.customer_id,
      messageType: log.message_type,
    });

    await db.query('UPDATE message_logs SET retry_count = $1 WHERE id = $2', [retryCount, logId]);

    return res;
  } catch (err) {
    console.error('[WhatsApp Retry Error]', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  formatPhoneNumber,
  getWhatsAppConfig,
  logMessage,
  sendTextMessage,
  sendTemplateMessage,
  retryFailedMessage,
};
