import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

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

    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 401 }
      );
    }

    // Get total users (students only)
    const totalUsers = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total votes
    const totalVotes = await prisma.vote.count();

    // Get department-wise statistics
    const departmentStats = await prisma.user.groupBy({
      by: ['department'],
      where: { role: 'STUDENT' },
      _count: true
    });

    // Get gender-wise statistics
    const genderStats = await prisma.user.groupBy({
      by: ['gender'],
      where: { role: 'STUDENT' },
      _count: true
    });

    // Get vote distribution by position
    const positionStats = await prisma.vote.groupBy({
      by: ['candidate.positionId'],
      _count: true
    });

    // Get election status
    const status = await prisma.electionStatus.findFirst();

    const response = NextResponse.json({
      statistics: {
        totalUsers,
        totalVotes,
        voterTurnout: totalUsers > 0 ? (totalVotes / totalUsers) * 100 : 0,
        departmentStats,
        genderStats,
        positionStats
      },
      electionStatus: status
    });

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
    console.error('Failed to fetch admin stats:', error);
    
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
    
    // Provide more detailed error messages based on the error type
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Database constraint violation' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch admin statistics. Please try again later.' },
      { status: 500 }
    );
  }
} 