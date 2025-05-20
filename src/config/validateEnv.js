const requiredEnvs = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_PORT',
  'EMAIL_SERVER_USER',
  'EMAIL_SERVER_PASSWORD',
  'EMAIL_FROM',
  'ADMIN_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
];

const missing = requiredEnvs.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}.\n` +
    'Please check your .env file and deployment environment.'
  );
}

export default true; 