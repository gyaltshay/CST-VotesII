import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    const { email, id } = decoded;
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user || user.email !== email) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
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
        message: 'Password updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
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
        message: 'An error occurred while resetting your password'
      },
      { status: 500 }
    );
  }
} 