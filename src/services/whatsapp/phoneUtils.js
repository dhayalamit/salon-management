/**
 * Phone Number Utilities for WhatsApp Business API Integration
 */

export function normalizePhoneNumber(phoneInput, defaultCountryCode = '91') {
  if (!phoneInput) return '';

  // Convert to string and remove all non-numeric characters except +
  let cleaned = String(phoneInput).trim().replace(/[^\d+]/g, '');

  if (!cleaned) return '';

  // If starts with +, remove +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle Indian phone numbers (10 digits starting with 6,7,8,9)
  if (cleaned.length === 10 && /^[6789]\d{9}$/.test(cleaned)) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${defaultCountryCode}${cleaned.substring(1)}`;
  }

  // If 12 digits starting with 91 (e.g. 919876543210)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }

  return cleaned;
}

export function validatePhoneNumber(phoneInput) {
  const normalized = normalizePhoneNumber(phoneInput);

  if (!normalized) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Standard E.164 check (10 to 15 digits)
  if (normalized.length < 10 || normalized.length > 15) {
    return { isValid: false, error: 'Invalid phone number length (must be 10-15 digits).' };
  }

  if (!/^\d+$/.test(normalized)) {
    return { isValid: false, error: 'Phone number must contain digits only.' };
  }

  return { isValid: true, normalized, formatted: `+${normalized}` };
}
