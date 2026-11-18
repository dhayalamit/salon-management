/**
 * WhatsApp Template Variable Engine
 * Replaces {{variable_name}} tags with real customer, salon, and appointment data.
 */

export const AVAILABLE_VARIABLES = [
  { key: 'customer_name', label: 'Customer Name', example: 'Rahul Sharma' },
  { key: 'customer_phone', label: 'Customer Phone', example: '+91 98765 43210' },
  { key: 'appointment_date', label: 'Appointment Date', example: '20 Aug 2026' },
  { key: 'appointment_time', label: 'Appointment Time', example: '05:00 PM' },
  { key: 'service_name', label: 'Service Name', example: 'Hair Cut & Styling' },
  { key: 'staff_name', label: 'Staff/Stylist Name', example: 'Vikram Singh' },
  { key: 'salon_name', label: 'Salon Name', example: 'TRIO The Posh Salon' },
  { key: 'salon_phone', label: 'Salon Phone', example: '+91 98765 43210' },
  { key: 'salon_address', label: 'Salon Address', example: 'Piprali Road, Near MBA Chai Wala, Sikar' },
  { key: 'amount', label: 'Amount / Bill Total', example: '₹1,500' },
  { key: 'offer', label: 'Special Offer / Discount', example: '20% OFF Birthday Special' },
  { key: 'birthday_date', label: 'Birthday Date', example: '17 August' },
];

export function replaceTemplateVariables(templateText, context = {}) {
  if (!templateText) return '';

  const {
    customer = {},
    appointment = {},
    staff = {},
    salon = {},
    offer = 'Special Discount',
    amount = '',
  } = context;

  const defaultSalon = {
    name: salon.name || salon.salon_name || 'TRIO The Posh Salon',
    phone: salon.phone || '+91 98765 43210',
    address: salon.address || 'Piprali Road, Near MBA Chai Wala, Sikar 332001',
  };

  const replacements = {
    customer_name: customer.name || customer.customer_name || 'Valued Customer',
    customer_phone: customer.phone || customer.customer_phone || '',
    appointment_date: appointment.date || appointment.appointment_date || 'Today',
    appointment_time: appointment.time || appointment.appointment_time || 'Scheduled Time',
    service_name: appointment.service_name || appointment.serviceName || 'Salon Service',
    staff_name: staff.name || appointment.staff_name || 'Our Senior Stylist',
    salon_name: defaultSalon.name,
    salon_phone: defaultSalon.phone,
    salon_address: defaultSalon.address,
    amount: amount || (appointment.total ? `₹${Number(appointment.total).toLocaleString('en-IN')}` : '₹0'),
    offer: offer || customer.offer || '20% OFF Special Gift',
    birthday_date: customer.birthday || customer.birthdate || 'Today',
  };

  let processed = templateText;

  // Replace {{variable}} tags
  Object.keys(replacements).forEach((key) => {
    const val = replacements[key] !== undefined ? String(replacements[key]) : '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    processed = processed.replace(regex, val);
  });

  return processed;
}
