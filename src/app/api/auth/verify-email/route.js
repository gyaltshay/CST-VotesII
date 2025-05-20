import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
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

export async function GET(request) {
  const startTime = Date.now();
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.redirect(new URL('/login?error=rate_limited', request.url));
    }
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    console.log('Verification attempt with token:', token);
    if (!token) {
      console.log('No token provided');
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }
    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('Invalid or expired token:', err);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }
    const { email } = decoded;
    console.log('Token decoded for email:', email);
    // Find user first
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }
    console.log('Found user:', user.id);
    // Update user's email verification status
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });
    console.log('User verified:', updatedUser.id);
    // Log request details
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      method: 'GET',
      path: request.url,
      duration: Date.now() - startTime,
      status: 302,
      user: updatedUser.id
    });
    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      ip,
      method: 'GET',
      path: request.url,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    });
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }
}