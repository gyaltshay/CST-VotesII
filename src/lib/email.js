import nodemailer from 'nodemailer';

if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_PORT || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD || !process.env.EMAIL_FROM) {
  throw new Error('Missing required email server environment variables.');
}

// Log email configuration on startup
console.log('Email configuration:', {
  host: process.env.EMAIL_SERVER_HOST,
  port: process.env.EMAIL_SERVER_PORT,
  user: process.env.EMAIL_SERVER_USER,
  from: process.env.EMAIL_FROM,
  // Don't log the password for security
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: true,
  debug: true, // Enable debug logs
  logger: true // Enable built-in logger
});

// Verify the connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export async function sendEmail({ to, subject, html }) {
  console.log('Starting email send process...');
  console.log('Email details:', {
    to,
    subject,
    from: process.env.EMAIL_FROM,
    emailServerHost: process.env.EMAIL_SERVER_HOST,
    emailServerPort: process.env.EMAIL_SERVER_PORT,
    emailServerUser: process.env.EMAIL_SERVER_USER,
    hasPassword: !!process.env.EMAIL_SERVER_PASSWORD
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  try {
    console.log('Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return info;
  } catch (error) {
    console.error('Detailed email sending error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Verification Code',
    html: `
      <h1>Verification Code</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendVoteConfirmationEmail(email, candidateName, position) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Vote Confirmation',
    html: `
      <h1>Vote Confirmation</h1>
      <p>Your vote for ${candidateName} as ${position} has been recorded successfully.</p>
      <p>Thank you for participating in the election!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordChangeEmail(email) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Changed',
    html: `
      <h1>Password Changed</h1>
      <p>Your password has been changed successfully.</p>
      <p>If you did not make this change, please contact the system administrator immediately.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAdminAlertEmail(subject, message) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `Admin Alert: ${subject}`,
    html: `
      <h1>Admin Alert</h1>
      <p>${message}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}