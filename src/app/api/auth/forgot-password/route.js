import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in your environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
};

// Simple in-memory rate limiting
const requestCounts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  // Clean up old entries
  for (const [key, timestamp] of requestCounts.entries()) {
    if (timestamp < windowStart) {
      requestCounts.delete(key);
    }
  }
  // Count requests in current window
  const count = Array.from(requestCounts.entries())
    .filter(([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart)
    .length;
  if (count >= RATE_LIMIT.maxRequests) {
    return true;
  }
  // Add new request
  requestCounts.set(`${ip}-${now}`, now);
  return false;
}

export async function POST(request) {
  const startTime = Date.now();
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    const { email } = await request.json();
    console.log('Received password reset request for:', email);

    // Validate email format
    const emailPattern = /^\d{8}\.cst@rub\.edu\.bt$/;
    if (!emailPattern.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      );
    }

    console.log('User found, generating reset token...');
    // Generate reset token
    const resetToken = jwt.sign(
      { 
        email: user.email,
        id: user.id 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    try {
      console.log('Attempting to send password reset email...');
      // Send password reset email
      await sendEmail({
        to: email,
        subject: 'Password Reset - CST Votes',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You have requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0070f3; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        `
      });

      console.log('Password reset email sent successfully');
      // Log request details
      console.log({
        timestamp: new Date().toISOString(),
        ip,
        method: 'POST',
        path: request.url,
        duration: Date.now() - startTime,
        status: 200
      });
      return NextResponse.json(
        { 
          success: true,
          message: 'Password reset instructions sent to your email'
        },
        { status: 200 }
      );

    } catch (emailError) {
      console.error('Failed to send password reset email:', {
        error: emailError,
        stack: emailError.stack,
        code: emailError.code
      });
      return NextResponse.json(
        { 
          success: false,
          message: `Failed to send password reset email: ${emailError.message}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password reset error:', {
      error,
      stack: error.stack,
      code: error.code
    });
    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      ip,
      method: 'POST',
      path: request.url,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        success: false,
        message: `An error occurred: ${error.message}`
      },
      { status: 500 }
    );
  }
} 