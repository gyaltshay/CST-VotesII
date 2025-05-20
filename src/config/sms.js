import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Missing Twilio credentials in environment variables.');
}

const client = twilio(accountSid, authToken);

export async function sendSMS(to, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    return result;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS');
  }
}

export function formatPhoneNumber(number) {
  // Format phone number to E.164 format for Bhutan
  if (!number.startsWith('+975')) {
    return `+975${number.replace(/\D/g, '')}`;
  }
  return number.replace(/\D/g, '');
}

export function validatePhoneNumber(number) {
  // Validate Bhutan phone number format
  const bhutanRegex = /^\+?975[17]\d{6}$/;
  return bhutanRegex.test(number.replace(/\D/g, ''));
}