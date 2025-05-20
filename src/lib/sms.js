import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  throw new Error('Missing Twilio credentials in environment variables.');
}

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS verification code
 * @param {string} phoneNumber - The phone number to send the code to
 * @param {string} code - The verification code
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export async function sendVerificationCode(phoneNumber, code) {
  try {
    const message = await client.messages.create({
      body: `Your CST Votes verification code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return message;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send verification code');
  }
}

/**
 * Send voting confirmation SMS
 * @param {string} phoneNumber - The phone number to send the confirmation to
 * @param {string} candidateName - Name of the candidate voted for
 * @param {string} position - Position voted for
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export async function sendVoteConfirmation(phoneNumber, candidateName, position) {
  try {
    const message = await client.messages.create({
      body: `Your vote for ${candidateName} (${position}) has been successfully recorded. Thank you for participating in CST Elections 2025-2026.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return message;
  } catch (error) {
    console.error('Vote confirmation SMS failed:', error);
    throw new Error('Failed to send vote confirmation');
  }
}

/**
 * Send election reminder SMS
 * @param {string} phoneNumber - The phone number to send the reminder to
 * @param {string} timeRemaining - Time remaining until voting ends
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export async function sendElectionReminder(phoneNumber, timeRemaining) {
  try {
    const message = await client.messages.create({
      body: `Reminder: CST Elections 2025-2026 voting closes in ${timeRemaining}. Don't forget to cast your vote!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return message;
  } catch (error) {
    console.error('Election reminder SMS failed:', error);
    throw new Error('Failed to send election reminder');
  }
}

/**
 * Send password reset code via SMS
 * @param {string} phoneNumber - The phone number to send the code to
 * @param {string} code - The reset code
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export async function sendPasswordResetCode(phoneNumber, code) {
  try {
    const message = await client.messages.create({
      body: `Your CST Votes password reset code is: ${code}. Valid for 15 minutes. If you didn't request this, please ignore.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    return message;
  } catch (error) {
    console.error('Password reset SMS failed:', error);
    throw new Error('Failed to send password reset code');
  }
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber) {
  // Bhutan phone number format: +975 followed by 8 digits
  const bhutanPhoneRegex = /^\+975[1-9]\d{7}$/;
  return bhutanPhoneRegex.test(phoneNumber);
}

/**
 * Generate random verification code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} - Generated verification code
 */
export function generateVerificationCode(length = 6) {
  return Math.random()
    .toString()
    .slice(2, 2 + length);
}

/**
 * Rate limiting for SMS sending
 * Simple in-memory implementation (use Redis in production)
 */
const smsRateLimit = new Map();

/**
 * Check if phone number has exceeded rate limit
 * @param {string} phoneNumber - The phone number to check
 * @param {number} maxAttempts - Maximum attempts allowed (default: 3)
 * @param {number} windowMs - Time window in milliseconds (default: 1 hour)
 * @returns {boolean} - True if rate limited, false otherwise
 */
export function isRateLimited(phoneNumber, maxAttempts = 3, windowMs = 3600000) {
  const now = Date.now();
  const attempts = smsRateLimit.get(phoneNumber) || [];
  
  // Remove expired attempts
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return true;
  }
  
  // Add new attempt
  validAttempts.push(now);
  smsRateLimit.set(phoneNumber, validAttempts);
  return false;
}

/**
 * Clear rate limit for a phone number
 * @param {string} phoneNumber - The phone number to clear
 */
export function clearRateLimit(phoneNumber) {
  smsRateLimit.delete(phoneNumber);
}