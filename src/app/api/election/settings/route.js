import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache duration in seconds
const CACHE_DURATION = 60; // 1 minute

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
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const settings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    const response = NextResponse.json(settings);
    // Add cache headers
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`);
    // Add compression
    response.headers.set('Content-Encoding', 'gzip');
    // Log request details
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      method: 'GET',
      path: request.url,
      duration: Date.now() - startTime,
      status: 200
    });
    return response;
  } catch (error) {
    console.error('Error fetching election settings:', error);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const startTime = Date.now();
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await request.json();
    const { votingStartTime, votingEndTime, isActive } = data;
    // Validate the data
    if (votingStartTime && votingEndTime) {
      const start = new Date(votingStartTime);
      const end = new Date(votingEndTime);
      if (start >= end) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }
    // Get current settings or create if not exists
    let settings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    if (!settings) {
      settings = await prisma.electionSettings.create({
        data: {
          votingStartTime: new Date(),
          votingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isActive: false
        }
      });
    }
    // Update settings
    const updatedSettings = await prisma.electionSettings.update({
      where: { id: settings.id },
      data: {
        ...(votingStartTime && { votingStartTime: new Date(votingStartTime) }),
        ...(votingEndTime && { votingEndTime: new Date(votingEndTime) }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });
    // Log request details
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      method: 'PATCH',
      path: request.url,
      duration: Date.now() - startTime,
      status: 200
    });
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating election settings:', error);
    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      ip,
      method: 'PATCH',
      path: request.url,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 